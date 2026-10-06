import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class BookingDateValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const { checkIn, checkOut } = value;

    if (checkIn && checkOut) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);

      if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
        throw new BadRequestException('checkIn and checkOut must be valid ISO date strings');
      }

      if (outDate <= inDate) {
        throw new BadRequestException('checkOut date must be strictly after checkIn date');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inDate < today) {
        throw new BadRequestException('checkIn date cannot be in the past');
      }
    }

    return value;
  }
}
