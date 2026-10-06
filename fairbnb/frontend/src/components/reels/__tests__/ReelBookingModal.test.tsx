import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelBookingModal } from '../ReelBookingModal';
import { api } from '@/lib/api-client';

describe('Phase 14 — Reel Booking Modal & Attribution Suite', () => {
  const mockProperty = {
    id: 'prop_booking_test_1',
    title: 'Luxury Himalayan Chalet',
    city: 'Manali',
    pricePerNight: 8500,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    property: mockProperty,
    reelId: 'reel_chalet_404',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('renders booking drawer when isOpen is true with property details', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      available: true,
      pricing: {
        nights: 2,
        basePricePerNight: 8500,
        accommodationTotal: 17000,
        cleaningFee: 1000,
        serviceFee: 2000,
        taxes: 3000,
        totalAmount: 23000,
      },
    });

    render(<ReelBookingModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Luxury Himalayan Chalet')).toBeInTheDocument();
    expect(screen.getByText('Manali')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/8,500/)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /proceed to reservation/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ available: true });
    render(<ReelBookingModal {...defaultProps} />);

    const closeBtn = screen.getByRole('button', { name: /close booking drawer/i });
    fireEvent.click(closeBtn);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows unavailable warning when quote returns available: false', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      available: false,
      reason: 'PROPERTY_ALREADY_BOOKED',
    });

    render(<ReelBookingModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/these dates are already booked/i)).toBeInTheDocument();
    });

    const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
    expect(proceedBtn).toBeDisabled();
  });

  it('tracks BOOKING_STARTED event and redirects with ref_reel_id on clicking Proceed to Reservation', async () => {
    vi.spyOn(api, 'post')
      .mockResolvedValueOnce({ available: true }) // for quote
      .mockResolvedValueOnce({ success: true }); // for event tracking

    render(<ReelBookingModal {...defaultProps} />);

    await waitFor(() => {
      const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
      expect(proceedBtn).not.toBeDisabled();
    });

    const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
    fireEvent.click(proceedBtn);

    expect(api.post).toHaveBeenCalledWith(
      '/api/reels/reel_chalet_404/events',
      expect.objectContaining({
        eventType: 'BOOKING_STARTED',
        propertyId: 'prop_booking_test_1',
      })
    );

    expect(window.location.href).toContain('/book/prop_booking_test_1');
    expect(window.location.href).toContain('ref_reel_id=reel_chalet_404');
    expect(window.location.href).toContain('ref_source=reels');
  });
});
