import { ServiceUnavailableException } from '@nestjs/common';
import { CashfreeProvider } from './cashfree.provider';
import * as crypto from 'crypto';

describe('CashfreeProvider Contract & Simulation Specification', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('1. Cashfree Standard Payouts V1 Contract & Outgoing Request Shapes', () => {
    it('authenticates via POST /payout/v1/authorize with x-client-id and x-client-secret headers', async () => {
      const calls: { url: string; options: any }[] = [];
      global.fetch = jest.fn().mockImplementation(async (url: string, options: any) => {
        calls.push({ url, options });
        if (url.includes('/payout/v1/authorize')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              subCode: '200',
              message: 'Token generated',
              data: {
                token: 'cf_bearer_test_token_12345',
                expiry: '2026-09-19 23:59:59',
              },
            }),
          };
        }
        if (url.includes('/payout/v1/requestTransfer')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              subCode: '200',
              message: 'Transfer initiated',
              data: {
                referenceId: 'cf_ref_98765',
              },
            }),
          };
        }
        throw new Error(`Unexpected URL: ${url}`);
      }) as any;

      const provider = new CashfreeProvider({
        appId: 'test_app_id_sandbox',
        secretKey: 'test_secret_key_sandbox',
        environment: 'SANDBOX',
        payoutsEnabled: true,
      });

      const result = await provider.executeTransfer({
        transferId: 'TX_CONTRACT_001',
        amount: 2500.5,
        currency: 'INR',
        beneficiaryId: 'BENE_HOST_001',
        transferMode: 'IMPS',
        narration: 'FairBnB Booking Payout',
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.providerReference).toBe('cf_ref_98765');
      expect(result._simulated).toBeFalsy();

      // Verify Authorize call shape
      expect(calls.length).toBe(2);
      const authCall = calls[0];
      expect(authCall.url).toBe('https://payout-gamma.cashfree.com/payout/v1/authorize');
      expect(authCall.options.method).toBe('POST');
      expect(authCall.options.headers['x-client-id']).toBe('test_app_id_sandbox');
      expect(authCall.options.headers['x-client-secret']).toBe('test_secret_key_sandbox');

      // Verify requestTransfer call shape
      const transferCall = calls[1];
      expect(transferCall.url).toBe('https://payout-gamma.cashfree.com/payout/v1/requestTransfer');
      expect(transferCall.options.method).toBe('POST');
      expect(transferCall.options.headers['Authorization']).toBe('Bearer cf_bearer_test_token_12345');
      expect(transferCall.options.headers['Content-Type']).toBe('application/json');

      const parsedBody = JSON.parse(transferCall.options.body);
      expect(parsedBody).toEqual({
        transferId: 'TX_CONTRACT_001',
        amount: '2500.50',
        beneId: 'BENE_HOST_001',
        transferMode: 'IMPS',
        remarks: 'FairBnB Booking Payout',
      });
    });

    it('queries transfer status via GET /payout/v1/getTransferStatus with Bearer token', async () => {
      const calls: { url: string; options: any }[] = [];
      global.fetch = jest.fn().mockImplementation(async (url: string, options: any) => {
        calls.push({ url, options });
        if (url.includes('/payout/v1/authorize')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              data: { token: 'cf_bearer_status_token' },
            }),
          };
        }
        if (url.includes('/payout/v1/getTransferStatus')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              data: {
                transfer: {
                  transferId: 'TX_STATUS_002',
                  status: 'SUCCESS',
                  referenceId: 'cf_ref_reconciled_555',
                  utr: 'UTR1234567890',
                },
              },
            }),
          };
        }
        throw new Error(`Unexpected URL: ${url}`);
      }) as any;

      const provider = new CashfreeProvider({
        appId: 'test_app_id_sandbox',
        secretKey: 'test_secret_key_sandbox',
        environment: 'SANDBOX',
        payoutsEnabled: true,
      });

      const result = await provider.getTransferStatus('TX_STATUS_002');
      expect(result.status).toBe('SUCCESS');
      expect(result.providerReference).toBe('cf_ref_reconciled_555');

      const statusCall = calls.find((c) => c.url.includes('/payout/v1/getTransferStatus'));
      expect(statusCall).toBeDefined();
      expect(statusCall?.url).toBe(
        'https://payout-gamma.cashfree.com/payout/v1/getTransferStatus?transferId=TX_STATUS_002',
      );
      expect(statusCall?.options.method).toBe('GET');
      expect(statusCall?.options.headers['Authorization']).toBe('Bearer cf_bearer_status_token');
    });

    it('verifies Payouts Webhook V1 signature using sorted POST parameters and independent cryptographic ground truth', () => {
      const secret = 'independent_test_secret';
      const provider = new CashfreeProvider({
        secretKey: secret,
        environment: 'SANDBOX',
      });

      // Ground truth vector independently established via command-line crypto:
      // sorted postData: '1' + 'TRANSFER_SUCCESS' + '2026-09-19 12:00:00' + 'CF_REF_IND_001' + 'TX_IND_001' + 'UTR999999'
      // HMAC-SHA256 Base64: 'JguBSPdXzBfSItQPFyBdvyLHyjyMaJOoOjgMwZYYsZ8='
      const independentValidSignature = 'JguBSPdXzBfSItQPFyBdvyLHyjyMaJOoOjgMwZYYsZ8=';

      const validPayload = {
        event: 'TRANSFER_SUCCESS',
        transferId: 'TX_IND_001',
        referenceId: 'CF_REF_IND_001',
        acknowledged: 1,
        eventTime: '2026-09-19 12:00:00',
        utr: 'UTR999999',
        signature: independentValidSignature,
      };

      // 1. Valid signature passes
      expect(provider.verifyPayoutWebhookV1Signature(validPayload)).toBe(true);

      // 2. Tampered signature fails
      const tamperedPayload = {
        ...validPayload,
        signature: 'TAMPERED_INCORRECT_SIGNATURE_BASE64==',
      };
      expect(provider.verifyPayoutWebhookV1Signature(tamperedPayload)).toBe(false);

      // 3. Missing signature fails
      const missingSigPayload = { ...validPayload };
      delete (missingSigPayload as any).signature;
      expect(provider.verifyPayoutWebhookV1Signature(missingSigPayload)).toBe(false);

      // 4. Tampered parameter payload fails
      const tamperedBodyPayload = {
        ...validPayload,
        utr: 'UTR_TAMPERED_111',
      };
      expect(provider.verifyPayoutWebhookV1Signature(tamperedBodyPayload)).toBe(false);
    });

    it('keeps Payment Gateway and Payouts Webhook V1 signature schemes strictly separate', () => {
      const secret = 'independent_test_secret';
      const provider = new CashfreeProvider({
        secretKey: secret,
        environment: 'SANDBOX',
      });

      const pgRawBody = JSON.stringify({ orderId: 'ORDER_123', orderAmount: 500 });
      const pgTimestamp = '1726740000';
      const pgSignature = crypto
        .createHmac('sha256', secret)
        .update(`${pgTimestamp}${pgRawBody}`)
        .digest('base64');

      // PG verifier accepts header-based signature over timestamp + rawBody
      expect(provider.verifyPgWebhookSignature(pgRawBody, pgTimestamp, pgSignature)).toBe(true);

      // Payouts V1 verifier rejects PG-style payload because signature is not in body parameters
      expect(
        provider.verifyPayoutWebhookV1Signature({
          rawBody: pgRawBody,
          timestamp: pgTimestamp,
        }),
      ).toBe(false);
    });

    it('getTransferStatus respects acknowledged=0 semantics (returns UNKNOWN until beneficiary bank acknowledges)', async () => {
      global.fetch = jest.fn().mockImplementation(async (url: string) => {
        if (url.includes('/payout/v1/authorize')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              data: { token: 'token_ack_test' },
            }),
          };
        }
        if (url.includes('/payout/v1/getTransferStatus')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              data: {
                transfer: {
                  transferId: 'TX_ACK_0',
                  status: 'SUCCESS',
                  acknowledged: 0, // Remitter debited, but beneficiary bank credit NOT yet confirmed!
                  referenceId: 'cf_ref_ack0',
                  utr: 'UTR_ACK_0',
                },
              },
            }),
          };
        }
        throw new Error(`Unexpected: ${url}`);
      }) as any;

      const provider = new CashfreeProvider({
        appId: 'test_app',
        secretKey: 'test_sec',
        environment: 'SANDBOX',
        payoutsEnabled: true,
      });

      const result = await provider.getTransferStatus('TX_ACK_0');
      // When acknowledged=0, must NOT be marked as final SUCCESS!
      expect(result.status).toBe('UNKNOWN');
      expect(result.failureReason).toBe('DEBIT_SUCCESS_AWAITING_BENEFICIARY_ACKNOWLEDGEMENT');
    });

    it('getTransferStatus returns SUCCESS when acknowledged=1', async () => {
      global.fetch = jest.fn().mockImplementation(async (url: string) => {
        if (url.includes('/payout/v1/authorize')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              data: { token: 'token_ack_test' },
            }),
          };
        }
        if (url.includes('/payout/v1/getTransferStatus')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              data: {
                transfer: {
                  transferId: 'TX_ACK_1',
                  status: 'SUCCESS',
                  acknowledged: 1, // Beneficiary bank acknowledged credit!
                  referenceId: 'cf_ref_ack1',
                  utr: 'UTR_ACK_1',
                },
              },
            }),
          };
        }
        throw new Error(`Unexpected: ${url}`);
      }) as any;

      const provider = new CashfreeProvider({
        appId: 'test_app',
        secretKey: 'test_sec',
        environment: 'SANDBOX',
        payoutsEnabled: true,
      });

      const result = await provider.getTransferStatus('TX_ACK_1');
      expect(result.status).toBe('SUCCESS');
      expect(result.providerReference).toBe('cf_ref_ack1');
    });
  });

  describe('2. Simulation and Disabled Mode Safeguards', () => {
    it('throws ServiceUnavailableException when SANDBOX credentials are missing (NEVER falls back to simulated success)', async () => {
      const provider = new CashfreeProvider({
        environment: 'SANDBOX',
        appId: undefined,
        secretKey: undefined,
        payoutsEnabled: true,
      });

      await expect(
        provider.executeTransfer({
          transferId: 'TX_UNCONFIGURED_001',
          amount: 1000,
          currency: 'INR',
          beneficiaryId: 'BENE_001',
        }),
      ).rejects.toThrow(ServiceUnavailableException);

      await expect(provider.getTransferStatus('TX_UNCONFIGURED_001')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when PRODUCTION credentials are missing', async () => {
      const provider = new CashfreeProvider({
        environment: 'PRODUCTION',
        appId: undefined,
        secretKey: undefined,
        payoutsEnabled: true,
      });

      await expect(
        provider.executeTransfer({
          transferId: 'TX_PROD_UNCONFIGURED',
          amount: 5000,
          currency: 'INR',
          beneficiaryId: 'BENE_PROD',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('tags simulated transfers explicitly with _simulated=true in MOCK environment', async () => {
      const provider = new CashfreeProvider({
        environment: 'MOCK',
        payoutsEnabled: true,
      });

      const result = await provider.executeTransfer({
        transferId: 'TX_SIMULATED_001',
        amount: 3000,
        currency: 'INR',
        beneficiaryId: 'BENE_MOCK',
      });

      expect(result.status).toBe('SUCCESS');
      expect(result._simulated).toBe(true);
      expect(result.rawResponse).toBeDefined();
      expect(result.rawResponse.simulated).toBe(true);
      expect(result.rawResponse.isSimulated).toBe(true);
      expect(result.providerReference).toMatch(/^cf_tx_mock_/);
    });

    it('throws ServiceUnavailableException when payoutsEnabled=false before attempting transfer', async () => {
      const provider = new CashfreeProvider({
        appId: 'test_app_id',
        secretKey: 'test_secret_key',
        environment: 'SANDBOX',
        payoutsEnabled: false,
      });

      expect(() => provider.guardPayoutsEnabled()).toThrow(ServiceUnavailableException);

      await expect(
        provider.executeTransfer({
          transferId: 'TX_DISABLED_001',
          amount: 1000,
          currency: 'INR',
          beneficiaryId: 'BENE_001',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('allows getTransferStatus() reconciliation of uncertain transfers even when payoutsEnabled=false', async () => {
      global.fetch = jest.fn().mockImplementation(async (url: string) => {
        if (url.includes('/payout/v1/authorize')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ status: 'SUCCESS', data: { token: 'recon_token' } }),
          };
        }
        if (url.includes('/payout/v1/getTransferStatus')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: 'SUCCESS',
              data: { transfer: { status: 'SUCCESS', referenceId: 'REF_RECON_DISABLED_MODE' } },
            }),
          };
        }
      }) as any;

      const provider = new CashfreeProvider({
        appId: 'test_app_id',
        secretKey: 'test_secret_key',
        environment: 'SANDBOX',
        payoutsEnabled: false, // New transfers are disabled
      });

      // Does NOT throw; allows reading status of existing uncertain transfer
      const result = await provider.getTransferStatus('TX_UNCERTAIN_EXISTING');
      expect(result.status).toBe('SUCCESS');
      expect(result.providerReference).toBe('REF_RECON_DISABLED_MODE');
    });
  });
});
