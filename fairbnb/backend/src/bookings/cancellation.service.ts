import { Injectable, BadRequestException } from '@nestjs/common';

export interface CancellationCalculationResult {
  cancellable: boolean;
  policy: string;
  refundPercentage: number;
  refundAmount: number;
  cancellationFee: number;
  reason?: string;
}

@Injectable()
export class CancellationService {
  calculateRefund(
    cancellationPolicy: string,
    checkInDate: Date | string,
    totalAmount: number,
    cancelledAt: Date = new Date(),
  ): CancellationCalculationResult {
    const checkIn = new Date(checkInDate);
    const policy = (cancellationPolicy || 'FLEXIBLE').toUpperCase();

    if (cancelledAt >= checkIn) {
      return {
        cancellable: false,
        policy,
        refundPercentage: 0,
        refundAmount: 0,
        cancellationFee: totalAmount,
        reason: 'CANCELLATION_AFTER_CHECKIN_NOT_ALLOWED',
      };
    }

    const diffMs = checkIn.getTime() - cancelledAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let refundPercentage = 0;

    switch (policy) {
      case 'FLEXIBLE':
        if (diffHours >= 24) {
          refundPercentage = 100;
        } else {
          refundPercentage = 50;
        }
        break;

      case 'MODERATE':
        if (diffDays >= 5) {
          refundPercentage = 100;
        } else if (diffDays >= 2) {
          refundPercentage = 50;
        } else {
          refundPercentage = 0;
        }
        break;

      case 'STRICT':
        if (diffDays >= 14) {
          refundPercentage = 100;
        } else if (diffDays >= 7) {
          refundPercentage = 50;
        } else {
          refundPercentage = 0;
        }
        break;

      default:
        // Default to flexible policy logic
        refundPercentage = diffHours >= 24 ? 100 : 50;
        break;
    }

    const refundAmount = Number(((totalAmount * refundPercentage) / 100).toFixed(2));
    const cancellationFee = Number((totalAmount - refundAmount).toFixed(2));

    return {
      cancellable: true,
      policy,
      refundPercentage,
      refundAmount,
      cancellationFee,
    };
  }
}
