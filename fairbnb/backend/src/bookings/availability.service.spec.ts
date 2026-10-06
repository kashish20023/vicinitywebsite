import { AvailabilityService } from './availability.service.js';

describe('AvailabilityService', () => {
  let availabilityService: AvailabilityService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      property: {
        findUnique: jest.fn(),
      },
      booking: {
        findMany: jest.fn(),
      },
    };
    availabilityService = new AvailabilityService(mockPrisma);
  });

  it('should return available: true when property is approved and no dates overlap', async () => {
    mockPrisma.property.findUnique.mockResolvedValue({
      id: 'prop_001',
      verificationStatus: 'APPROVED',
      status: 'PUBLISHED',
      maxGuests: 4,
      minNights: 1,
      unavailableDates: [],
    });

    mockPrisma.booking.findMany.mockResolvedValue([]);

    const today = new Date();
    const checkIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString().split('T')[0];
    const checkOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13).toISOString().split('T')[0];

    const result = await availabilityService.checkAvailability('prop_001', checkIn, checkOut, 2);

    expect(result.available).toBe(true);
    expect(result.nights).toBe(3);
  });

  it('should reject when requested guests exceed maxGuests', async () => {
    mockPrisma.property.findUnique.mockResolvedValue({
      id: 'prop_001',
      verificationStatus: 'APPROVED',
      status: 'PUBLISHED',
      maxGuests: 2,
      minNights: 1,
    });

    const today = new Date();
    const checkIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString().split('T')[0];
    const checkOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13).toISOString().split('T')[0];

    const result = await availabilityService.checkAvailability('prop_001', checkIn, checkOut, 5);

    expect(result.available).toBe(false);
    expect(result.reason).toContain('GUEST_LIMIT_EXCEEDED');
  });

  it('should reject when overlapping active booking exists', async () => {
    mockPrisma.property.findUnique.mockResolvedValue({
      id: 'prop_001',
      verificationStatus: 'APPROVED',
      status: 'PUBLISHED',
      maxGuests: 4,
      minNights: 1,
    });

    mockPrisma.booking.findMany.mockResolvedValue([
      { id: 'existing_b_001', status: 'CONFIRMED' },
    ]);

    const today = new Date();
    const checkIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10).toISOString().split('T')[0];
    const checkOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 13).toISOString().split('T')[0];

    const result = await availabilityService.checkAvailability('prop_001', checkIn, checkOut, 2);

    expect(result.available).toBe(false);
    expect(result.reason).toBe('PROPERTY_ALREADY_BOOKED');
  });
});
