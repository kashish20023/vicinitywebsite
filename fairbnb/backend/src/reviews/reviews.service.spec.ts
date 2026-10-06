import { ReviewsService } from './reviews.service.js';

describe('ReviewsService', () => {
  let reviewsService: ReviewsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      booking: {
        findUnique: jest.fn(),
      },
      review: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    reviewsService = new ReviewsService(mockPrisma);
  });

  it('should create review for a COMPLETED booking', async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: 'bk_100',
      guestId: 'usr_guest_1',
      propertyId: 'prop_1',
      status: 'COMPLETED',
      review: null,
    });

    mockPrisma.review.create.mockResolvedValue({
      id: 'rev_1',
      bookingId: 'bk_100',
      rating: 5,
      cleanlinessRating: 5,
      comment: 'Great stay!',
    });

    const result = await reviewsService.createReview('usr_guest_1', {
      bookingId: 'bk_100',
      rating: 5,
      comment: 'Great stay!',
    });

    expect(result.id).toBe('rev_1');
    expect(mockPrisma.review.create).toHaveBeenCalled();
  });

  it('should calculate accurate multi-category average ratings', async () => {
    mockPrisma.review.findMany.mockResolvedValue([
      {
        id: 'rev_1',
        rating: 5,
        cleanlinessRating: 5,
        accuracyRating: 4,
        locationRating: 5,
        valueRating: 4,
      },
      {
        id: 'rev_2',
        rating: 3,
        cleanlinessRating: 3,
        accuracyRating: 4,
        locationRating: 3,
        valueRating: 4,
      },
    ]);

    const result = await reviewsService.getPropertyReviews('prop_1');

    expect(result.summary.totalReviews).toBe(2);
    expect(result.summary.averageOverall).toBe(4); // (5+3)/2
    expect(result.summary.averageCleanliness).toBe(4); // (5+3)/2
    expect(result.summary.averageAccuracy).toBe(4); // (4+4)/2
    expect(result.summary.averageLocation).toBe(4); // (5+3)/2
  });

  it('should allow host to reply to a review for their property', async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: 'rev_1',
      property: { hostId: 'usr_host_1' },
    });

    mockPrisma.review.update.mockResolvedValue({
      id: 'rev_1',
      hostReply: 'Thank you for staying with us!',
    });

    const result = await reviewsService.replyToReview('rev_1', 'usr_host_1', {
      hostReply: 'Thank you for staying with us!',
    });

    expect(result.hostReply).toBe('Thank you for staying with us!');
    expect(mockPrisma.review.update).toHaveBeenCalled();
  });
});
