import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { HostReplyReviewDto } from './dto/host-reply-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly safeReviewerSelect = {
    id: true,
    name: true,
  };

  async createReview(reviewerId: string, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID '${dto.bookingId}' not found`);
    }

    if (booking.guestId !== reviewerId) {
      throw new ForbiddenException('You can only write reviews for your own bookings');
    }

    if (booking.status !== 'COMPLETED' && booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Reviews can only be submitted for completed or past stays (current status: ${booking.status})`,
      );
    }

    if (booking.review) {
      throw new ConflictException('A review has already been submitted for this booking');
    }

    const cleanlinessRating = dto.cleanlinessRating ?? dto.rating;
    const accuracyRating = dto.accuracyRating ?? dto.rating;
    const locationRating = dto.locationRating ?? dto.rating;
    const valueRating = dto.valueRating ?? dto.rating;

    return this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        propertyId: booking.propertyId,
        reviewerId,
        rating: dto.rating,
        cleanlinessRating,
        accuracyRating,
        locationRating,
        valueRating,
        comment: dto.comment,
      },
      include: {
        reviewer: { select: this.safeReviewerSelect },
      },
    });
  }

  async getPropertyReviews(propertyId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: this.safeReviewerSelect },
      },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        summary: {
          totalReviews: 0,
          averageOverall: 0,
          averageCleanliness: 0,
          averageAccuracy: 0,
          averageLocation: 0,
          averageValue: 0,
        },
        reviews: [],
      };
    }

    const sumOverall = reviews.reduce((sum, r) => sum + r.rating, 0);
    const sumCleanliness = reviews.reduce((sum, r) => sum + r.cleanlinessRating, 0);
    const sumAccuracy = reviews.reduce((sum, r) => sum + r.accuracyRating, 0);
    const sumLocation = reviews.reduce((sum, r) => sum + r.locationRating, 0);
    const sumValue = reviews.reduce((sum, r) => sum + r.valueRating, 0);

    return {
      summary: {
        totalReviews,
        averageOverall: Number((sumOverall / totalReviews).toFixed(2)),
        averageCleanliness: Number((sumCleanliness / totalReviews).toFixed(2)),
        averageAccuracy: Number((sumAccuracy / totalReviews).toFixed(2)),
        averageLocation: Number((sumLocation / totalReviews).toFixed(2)),
        averageValue: Number((sumValue / totalReviews).toFixed(2)),
      },
      reviews,
    };
  }

  async replyToReview(reviewId: string, hostId: string, dto: HostReplyReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { property: true },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${reviewId}' not found`);
    }

    if (review.property.hostId !== hostId) {
      throw new ForbiddenException('You can only reply to reviews for your own properties');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        hostReply: dto.hostReply,
        hostRepliedAt: new Date(),
      },
      include: {
        reviewer: { select: this.safeReviewerSelect },
      },
    });
  }
}
