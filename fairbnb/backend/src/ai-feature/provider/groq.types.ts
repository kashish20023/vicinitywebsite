export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, any>;
  timeoutMs?: number;
  externalSignal?: AbortSignal;
}

export interface GroqCompletionResult<T = any> {
  rawContent: string;
  parsedData?: T;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

export interface CircuitBreakerState {
  failureCount: number;
  lastFailureTimestamp: number;
  isOpen: boolean;
}
