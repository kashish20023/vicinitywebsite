import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ReelBookingModal } from '../ReelBookingModal';
import { api } from '@/lib/api-client';

describe('Task 4 — Real Booking Journey Verification Suite', () => {
  const mockProperty = {
    id: 'prop_manali_retreat_002',
    title: 'Himalayan Cloud Retreat & Spa',
    city: 'Manali',
    pricePerNight: 8900,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    property: mockProperty,
    reelId: 'reel_himalayas_999',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  it('journey: loads live quote, verifies property details, and enables handoff', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      available: true,
      pricing: {
        nights: 3,
        basePricePerNight: 8900,
        baseAmount: 26700,
        cleaningFee: 0,
        serviceFee: 2670,
        taxes: 5286.6,
        totalAmount: 34656.6,
      },
    });

    render(<ReelBookingModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Himalayan Cloud Retreat & Spa')).toBeInTheDocument();
    expect(screen.getByText('Manali')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/8,900/)).toBeInTheDocument();
    });

    const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
    expect(proceedBtn).toBeEnabled();
  });

  it('journey: past dates show validation error and disable handoff CTA', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ available: true });

    const { container } = render(<ReelBookingModal {...defaultProps} />);

    await waitFor(() => {
      const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
      expect(proceedBtn).toBeEnabled();
    });

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const checkInInput = dateInputs[0];
    fireEvent.change(checkInInput, { target: { value: '2020-01-01' } });

    await waitFor(() => {
      expect(screen.getByText(/check-in date cannot be in the past/i)).toBeInTheDocument();
    });

    const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
    expect(proceedBtn).toBeDisabled();
  });

  it('journey: analytics failure never blocks or corrupts booking handoff', async () => {
    vi.spyOn(api, 'post')
      .mockResolvedValueOnce({
        available: true,
        pricing: {
          nights: 3,
          basePricePerNight: 8900,
          accommodationTotal: 26700,
          cleaningFee: 0,
          serviceFee: 2670,
          taxes: 5286.6,
          totalAmount: 34656.6,
        },
      })
      // Analytics rejects with network error
      .mockRejectedValueOnce(new Error('Network error on analytics tracking'));

    render(<ReelBookingModal {...defaultProps} />);

    await waitFor(() => {
      const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
      expect(proceedBtn).toBeEnabled();
    });

    const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
    fireEvent.click(proceedBtn);

    // Navigation must succeed despite analytics failure
    expect(window.location.href).toContain('/book/prop_manali_retreat_002');
    expect(window.location.href).toContain('ref_reel_id=reel_himalayas_999');
    expect(window.location.href).toContain('ref_source=reels');
    expect(window.location.href).toContain('guests=2');
  });

  it('journey: double click guard prevents multiple concurrent navigation events', async () => {
    vi.spyOn(api, 'post')
      .mockResolvedValueOnce({ available: true })
      .mockResolvedValueOnce({ success: true });

    render(<ReelBookingModal {...defaultProps} />);

    await waitFor(() => {
      const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
      expect(proceedBtn).toBeEnabled();
    });

    const proceedBtn = screen.getByRole('button', { name: /proceed to reservation/i });
    fireEvent.click(proceedBtn);
    fireEvent.click(proceedBtn); // Rapid double click

    // Only one analytics call should have been triggered
    expect(api.post).toHaveBeenCalledTimes(2); // 1 for quote, 1 for analytics
  });
});
