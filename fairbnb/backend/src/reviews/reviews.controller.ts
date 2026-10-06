import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { HostReplyReviewDto } from './dto/host-reply-review.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /reviews
   * Authenticated Guest endpoint to submit a review for a completed stay.
   */
  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(user.id, dto);
  }

  /**
   * GET /properties/:propertyId/reviews
   * Public endpoint to fetch property reviews and aggregate ratings.
   */
  @Get('properties/:propertyId/reviews')
  async getPropertyReviews(@Param('propertyId') propertyId: string) {
    return this.reviewsService.getPropertyReviews(propertyId);
  }

  /**
   * POST /reviews/:id/reply
   * Authenticated Host endpoint to reply to a guest review.
   */
  @Post('reviews/:id/reply')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async replyToReview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: HostReplyReviewDto,
  ) {
    return this.reviewsService.replyToReview(id, user.id, dto);
  }
}
