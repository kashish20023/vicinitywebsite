import {
  Injectable,
  Logger,
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RuntimeAiConfigService } from '../runtime-config/runtime-config.service.js';
import {
  GroqChatMessage,
  GroqCompletionOptions,
  GroqCompletionResult,
  CircuitBreakerState,
} from './groq.types.js';

@Injectable()
export class GroqProvider {
  private readonly logger = new Logger(GroqProvider.name);
  private readonly groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';

  // Configurable thresholds
  private readonly defaultTimeoutMs = 8000;
  private readonly maxOverallDeadlineMs = 12000;
  private readonly defaultModel = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
  private readonly fallbackModel = 'openai/gpt-oss-20b';

  // Circuit breaker state
  private readonly breaker: CircuitBreakerState = {
    failureCount: 0,
    lastFailureTimestamp: 0,
    isOpen: false,
  };
  private readonly failureThreshold = 3;
  private readonly resetTimeoutMs = 30000; // 30s cooldown after trip

  constructor(private readonly configService: RuntimeAiConfigService) {}

  private checkCircuitBreaker(): void {
    const now = Date.now();
    if (this.breaker.isOpen) {
      if (now - this.breaker.lastFailureTimestamp > this.resetTimeoutMs) {
        this.logger.log('Circuit breaker half-open: probing recovery.');
        this.breaker.isOpen = false;
        this.breaker.failureCount = 0;
      } else {
        throw new ServiceUnavailableException({
          code: 'AI_PROVIDER_DEGRADED',
          message: 'Groq provider circuit breaker is currently OPEN due to repeated consecutive failures.',
        });
      }
    }
  }

  private recordSuccess(): void {
    this.breaker.failureCount = 0;
    this.breaker.isOpen = false;
  }

  private recordFailure(): void {
    this.breaker.failureCount += 1;
    this.breaker.lastFailureTimestamp = Date.now();
    if (this.breaker.failureCount >= this.failureThreshold) {
      this.breaker.isOpen = true;
      this.logger.error(
        `Groq provider circuit breaker TRIPPED to OPEN after ${this.breaker.failureCount} consecutive failures. Cooldown: ${this.resetTimeoutMs}ms`,
      );
    }
  }

  /**
   * Execute chat completion against Groq API with bounded timeout,
   * structured JSON parsing, cancellation, and jittered single-retry on transient errors.
   */
  async createChatCompletion<T = any>(
    messages: GroqChatMessage[],
    options: GroqCompletionOptions = {},
  ): Promise<GroqCompletionResult<T>> {
    this.checkCircuitBreaker();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      throw new ServiceUnavailableException({
        code: 'AI_KEY_MISSING',
        message: 'GROQ_API_KEY environment variable is not configured.',
      });
    }

    const chosenModel = options.model || process.env.GROQ_MODEL || this.defaultModel;
    const timeoutMs = Math.min(options.timeoutMs || this.defaultTimeoutMs, this.maxOverallDeadlineMs);

    // Prepare abort controller linked to runtime config service
    const abortController = new AbortController();
    this.configService.registerAbortController(abortController);

    // Merge external signal if passed
    if (options.externalSignal) {
      options.externalSignal.addEventListener('abort', () => {
        abortController.abort(options.externalSignal?.reason);
      });
    }

    const timeoutTimer = setTimeout(() => {
      abortController.abort(new Error(`Individual Groq provider call exceeded timeout of ${timeoutMs}ms`));
    }, timeoutMs);

    const startTime = Date.now();

    try {
      return await this.executeWithRetry<T>(
        messages,
        chosenModel,
        options,
        apiKey,
        abortController,
        startTime,
      );
    } finally {
      clearTimeout(timeoutTimer);
      this.configService.unregisterAbortController(abortController);
    }
  }

  private async executeWithRetry<T>(
    messages: GroqChatMessage[],
    model: string,
    options: GroqCompletionOptions,
    apiKey: string,
    abortController: AbortController,
    overallStartTime: number,
  ): Promise<GroqCompletionResult<T>> {
    let attempt = 0;
    const maxAttempts = 2; // Maximum 2 attempts (initial + 1 retry)

    while (attempt < maxAttempts) {
      attempt++;
      const currentCallStart = Date.now();

      // Check remaining overall deadline (12s max)
      const elapsedTotal = Date.now() - overallStartTime;
      if (elapsedTotal >= this.maxOverallDeadlineMs) {
        throw new GatewayTimeoutException({
          code: 'AI_OVERALL_DEADLINE_EXCEEDED',
          message: `Overall AI request deadline (${this.maxOverallDeadlineMs}ms) exceeded.`,
        });
      }

      try {
        const body: Record<string, any> = {
          model,
          messages,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 1500,
        };

        if (options.jsonSchema) {
          body.response_format = { type: 'json_object' };
        }

        const res = await fetch(this.groqEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });

        const latencyMs = Date.now() - currentCallStart;

        if (res.ok) {
          const json = await res.json();
          this.recordSuccess();

          const choice = json.choices?.[0];
          const rawContent = choice?.message?.content || '';

          let parsedData: T | undefined = undefined;
          if (options.jsonSchema && rawContent.trim()) {
            try {
              parsedData = JSON.parse(rawContent) as T;
            } catch (parseErr) {
              this.logger.warn(`Failed to parse Groq JSON response: ${rawContent.substring(0, 150)}`);
              throw new BadGatewayException({
                code: 'AI_PARSE_ERROR',
                message: 'Groq response did not adhere to valid JSON syntax.',
              });
            }
          }

          return {
            rawContent,
            parsedData,
            model: json.model || model,
            promptTokens: json.usage?.prompt_tokens || 0,
            completionTokens: json.usage?.completion_tokens || 0,
            totalTokens: json.usage?.total_tokens || 0,
            latencyMs,
          };
        }

        // Handle error responses
        const status = res.status;
        const errText = await res.text();

        // 401 / 403: Never retry
        if (status === 401 || status === 403) {
          this.recordFailure();
          throw new BadGatewayException({
            code: 'AI_AUTH_ERROR',
            message: 'Groq provider rejected authentication credentials (401/403).',
          });
        }

        // 429 Rate Limit or 5xx Server Error: Eligible for 1 retry
        if (status === 429 || status >= 500) {
          if (attempt < maxAttempts) {
            let retryDelayMs = 1000 + Math.floor(Math.random() * 500); // 1.0s - 1.5s jittered
            const retryAfterHeader = res.headers.get('retry-after');
            if (retryAfterHeader) {
              const seconds = parseInt(retryAfterHeader, 10);
              if (!isNaN(seconds) && seconds > 0 && seconds <= 3) {
                retryDelayMs = seconds * 1000;
              }
            }

            this.logger.warn(
              `Groq HTTP ${status} on attempt ${attempt}. Retrying in ${retryDelayMs}ms with fallback model if 5xx...`,
            );
            await new Promise((r) => setTimeout(r, retryDelayMs));

            // Use faster/lighter fallback model on second attempt if first was 5xx
            if (status >= 500 && model !== this.fallbackModel) {
              model = this.fallbackModel;
            }
            continue;
          }
        }

        this.recordFailure();
        throw new BadGatewayException({
          code: 'AI_PROVIDER_ERROR',
          status,
          message: `Groq returned HTTP ${status}: ${errText.substring(0, 120)}`,
        });
      } catch (err: any) {
        if (err.name === 'AbortError' || abortController.signal.aborted) {
          if (!this.configService.isMasterEnabled()) {
            throw new ServiceUnavailableException({
              code: 'AI_DISABLED',
              message: 'AI call was aborted because AI master switch or feature was turned off.',
            });
          }
          throw new GatewayTimeoutException({
            code: 'AI_TIMEOUT',
            message: 'Groq API request timed out or was aborted by system policy.',
          });
        }
        if (err.status && err.response) {
          throw err;
        }

        // Network / socket connection error
        if (attempt < maxAttempts) {
          const delay = 800 + Math.floor(Math.random() * 400);
          this.logger.warn(`Network connection error on attempt ${attempt}. Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        this.recordFailure();
        throw new BadGatewayException({
          code: 'AI_NETWORK_ERROR',
          message: `Failed to connect to Groq endpoint: ${err.message || 'Unknown network error'}`,
        });
      }
    }

    throw new BadGatewayException({
      code: 'AI_RETRY_EXHAUSTED',
      message: 'Groq provider retry limit exhausted.',
    });
  }
}
