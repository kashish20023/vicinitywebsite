import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminSettlementsPage from '../page';
import { api, ApiError } from '@/lib/api-client';

// Mock Auth Context
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin-1', role: 'ADMIN', name: 'Super Admin' },
    isAuthenticated: true,
  }),
}));

// Mock API client
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    status: number;
    data: any;
    constructor(message: string, statusCode: number, data?: any) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
      this.status = statusCode;
      this.data = data;
    }
  },
}));

const mockSettlementsList = {
  data: [
    {
      id: 'settlement-101',
      bookingId: 'booking-abc-123',
      status: 'READY',
      currency: 'INR',
      holdReasons: [],
      propertyTitle: 'Sunset Villa',
      guestName: 'Rahul Verma',
      bookingStatus: 'COMPLETED',
      revisions: [
        {
          revisionNumber: 1,
          totalGrossPaise: '2500000',
          hostNetPaise: '1700000',
          coHostNetPaise: '400000',
          platformNetPaise: '250000',
          taxNetPaise: '150000',
        },
      ],
      createdAt: '2026-09-20T10:00:00.000Z',
    },
    {
      id: 'settlement-102',
      bookingId: 'booking-xyz-789',
      status: 'APPROVED',
      currency: 'INR',
      holdReasons: [],
      propertyTitle: 'Ocean Breeze Suite',
      guestName: 'Priya Sharma',
      bookingStatus: 'COMPLETED',
      revisions: [
        {
          revisionNumber: 1,
          totalGrossPaise: '1000000',
          hostNetPaise: '800000',
          coHostNetPaise: '0',
          platformNetPaise: '100000',
          taxNetPaise: '100000',
        },
      ],
      createdAt: '2026-09-20T11:00:00.000Z',
    },
  ],
};

// Actual backend contract: top-level settlement object (NOT nested under { settlement: ... })
const mockValidSettlementDetail = {
  id: 'settlement-101',
  bookingId: 'booking-abc-123',
  status: 'READY',
  currency: 'INR',
  holdReasons: [],
  currentRevisionId: 'rev-1',
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:05:00.000Z',
  booking: {
    id: 'booking-abc-123',
    status: 'COMPLETED',
    checkIn: '2026-09-15T14:00:00.000Z',
    checkOut: '2026-09-18T11:00:00.000Z',
    totalAmount: 25000,
    property: {
      id: 'prop-1',
      title: 'Sunset Villa',
      hostId: 'host-1',
      host: { name: 'Vikram Singh', email: 'vikram@example.com' },
    },
    guest: { name: 'Rahul Verma', email: 'rahul@example.com', phone: '+919876543210' },
  },
  revisions: [
    {
      id: 'rev-1',
      revisionNumber: 1,
      reason: 'INITIAL_SETTLEMENT',
      totalGrossPaise: '2500000',
      totalRefundedPaise: '0',
      totalNetPaise: '2500000',
      hostNetPaise: '1700000',
      coHostNetPaise: '400000',
      platformNetPaise: '250000',
      taxNetPaise: '150000',
      isExecuted: false,
      createdAt: '2026-09-20T10:00:00.000Z',
      allocations: [
        {
          id: 'alloc-1',
          recipientRole: 'HOST',
          recipientUserId: 'host-1',
          allocationKey: 'HOST_PAYOUT',
          grossPaise: '1700000',
          refundDeductionPaise: '0',
          netEntitledPaise: '1700000',
          status: 'ELIGIBLE',
          holdReasons: [],
        },
        {
          id: 'alloc-2',
          recipientRole: 'CO_HOST',
          recipientUserId: 'cohost-1',
          allocationKey: 'CO_HOST_PAYOUT',
          grossPaise: '400000',
          refundDeductionPaise: '0',
          netEntitledPaise: '400000',
          status: 'ELIGIBLE',
          holdReasons: [],
        },
      ],
    },
  ],
  transferIntents: [],
  adjustments: [],
  auditEvents: [],
};

describe('Admin Settlements Inspect Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockImplementation((url: string) => {
      if (url.startsWith('/admin/settlements?')) {
        return Promise.resolve(mockSettlementsList);
      }
      if (url === '/admin/settlements') {
        return Promise.resolve(mockSettlementsList);
      }
      if (url === '/admin/settlements/booking-abc-123') {
        return Promise.resolve(mockValidSettlementDetail);
      }
      return Promise.reject(new (ApiError as any)('Not found', 404));
    });
  });

  it('A. Renders settlement details using actual backend contract without undefined.status crash', async () => {
    render(<AdminSettlementsPage />);

    // Wait for settlements list to load
    await waitFor(() => {
      expect(screen.getByText('booking-abc-...')).toBeInTheDocument();
    });

    // Click "Inspect" button on the first settlement
    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    // Drawer should open and load detailed ledger
    await waitFor(() => {
      expect(screen.getByText('Settlement Ledger & Execution')).toBeInTheDocument();
    });

    // Verify key fields rendered directly from backend contract
    await waitFor(() => {
      expect(screen.getByText(/Revision #1 Allocations/i)).toBeInTheDocument();
      expect(screen.getByText('HOST_PAYOUT')).toBeInTheDocument();
      expect(screen.getByText('CO_HOST_PAYOUT')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Authorize Rev #1/i })).toBeInTheDocument();
    });
  });

  it('B. Safe during loading state: shows spinner and never crashes dereferencing missing data', async () => {
    // Create a promise that does not resolve immediately
    let resolveDetail: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolveDetail = resolve;
    });

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/admin/settlements/booking-abc-123') {
        return pendingPromise;
      }
      return Promise.resolve(mockSettlementsList);
    });

    render(<AdminSettlementsPage />);

    await waitFor(() => {
      expect(screen.getByText('booking-abc-...')).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    // In loading state, loading message must be visible without any TypeError crash
    expect(screen.getByText(/Loading detailed settlement ledger.../i)).toBeInTheDocument();

    // Now resolve
    resolveDetail!(mockValidSettlementDetail);

    await waitFor(() => {
      expect(screen.getByText(/Revision #1 Allocations/i)).toBeInTheDocument();
    });
  });

  it('C. Handles missing optional data honestly without crashing', async () => {
    const minimalSettlementDetail = {
      id: 'settlement-101',
      bookingId: 'booking-abc-123',
      status: 'PENDING',
      currency: 'INR',
      holdReasons: [],
      currentRevisionId: null,
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-20T10:05:00.000Z',
      booking: {
        id: 'booking-abc-123',
        status: 'PENDING',
        checkIn: '2026-09-15T14:00:00.000Z',
        checkOut: '2026-09-18T11:00:00.000Z',
        totalAmount: 10000,
        // No property, no guest, no payments
      },
      revisions: [],
      transferIntents: [],
      adjustments: [],
      auditEvents: [],
    };

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/admin/settlements/booking-abc-123') {
        return Promise.resolve(minimalSettlementDetail);
      }
      return Promise.resolve(mockSettlementsList);
    });

    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Settlement Ledger & Execution')).toBeInTheDocument();
    });

    // Should render empty transfer intents notice without throwing
    expect(screen.getByText(/No transfer intents generated yet/i)).toBeInTheDocument();
  });

  it('D. Missing required data prevents financial actions and shows helpful error', async () => {
    const malformedData = {
      // Missing id and status
      bookingId: 'booking-abc-123',
    };

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/admin/settlements/booking-abc-123') {
        return Promise.resolve(malformedData);
      }
      return Promise.resolve(mockSettlementsList);
    });

    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Malformed settlement ledger data/i)).toBeInTheDocument();
    });

    // Financial actions must NOT be present
    expect(screen.queryByRole('button', { name: /Authorize Rev/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Execute Transfers/i })).not.toBeInTheDocument();
  });

  it('E. Handles 404 Not Found error with clear message and retry/close controls', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/admin/settlements/booking-abc-123') {
        return Promise.reject(new (ApiError as any)('Settlement not found', 404));
      }
      return Promise.resolve(mockSettlementsList);
    });

    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Settlement ledger not found for this booking.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /close/i }).length).toBeGreaterThan(0);
    });
  });

  it('F. Handles 403 Forbidden error safely', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/admin/settlements/booking-abc-123') {
        return Promise.reject(new (ApiError as any)('Forbidden', 403));
      }
      return Promise.resolve(mockSettlementsList);
    });

    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('Unauthorized: You do not have permission to inspect this settlement.'),
      ).toBeInTheDocument();
    });
  });

  it('G. Handles 500 Server error with retry option', async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === '/admin/settlements/booking-abc-123') {
        return Promise.reject(new (ApiError as any)('Internal Server Error', 500));
      }
      return Promise.resolve(mockSettlementsList);
    });

    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText('Server error while loading settlement details. Please try again.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('H. Protects against out-of-order responses (Rapid Inspect A -> Inspect B)', async () => {
    let resolveA: (val: any) => void;
    const promiseA = new Promise((resolve) => {
      resolveA = resolve;
    });

    const detailB = {
      ...mockValidSettlementDetail,
      id: 'settlement-102',
      bookingId: 'booking-xyz-789',
      status: 'APPROVED',
      booking: {
        ...mockValidSettlementDetail.booking,
        id: 'booking-xyz-789',
        totalAmount: 99999,
      },
    };

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/admin/settlements/booking-abc-123') {
        return promiseA; // Slow response
      }
      if (url === '/admin/settlements/booking-xyz-789') {
        return Promise.resolve(detailB); // Fast response
      }
      return Promise.resolve(mockSettlementsList);
    });

    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });

    // Click Inspect A (slow)
    fireEvent.click(inspectButtons[0]);

    // Immediately click Inspect B (fast)
    fireEvent.click(inspectButtons[1]);

    // B resolves immediately
    await waitFor(() => {
      expect(screen.getByText('₹99999')).toBeInTheDocument();
      expect(screen.getByText(/Booking: booking-xyz-789/)).toBeInTheDocument();
    });

    // Now slow response A resolves late
    resolveA!(mockValidSettlementDetail);

    // Give time for any microtasks to run
    await new Promise((r) => setTimeout(r, 50));

    // Must STILL show B's details and NOT be overwritten by A
    expect(screen.getByText('₹99999')).toBeInTheDocument();
    expect(screen.getByText(/Booking: booking-xyz-789/)).toBeInTheDocument();
    expect(screen.queryByText('₹25000')).not.toBeInTheDocument();
  });

  it('I. Closes drawer cleanly and resets state without leaking old data into next inspect', async () => {
    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Revision #1 Allocations/i)).toBeInTheDocument();
    });

    // Click Close (X) button
    const closeButtons = screen.getAllByRole('button').filter((b) => b.querySelector('svg.lucide-x'));
    fireEvent.click(closeButtons[0]);

    // Drawer should disappear
    await waitFor(() => {
      expect(screen.queryByText('Settlement Ledger & Execution')).not.toBeInTheDocument();
    });
  });

  it('J. Verifies Authorize action passes revisionNumber and calls server endpoint correctly', async () => {
    (api.post as any).mockResolvedValue({ success: true, message: 'Authorized' });

    render(<AdminSettlementsPage />);
    await waitFor(() => screen.getByText('booking-abc-...'));

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Authorize Rev #1/i })).toBeInTheDocument();
    });

    const authorizeButton = screen.getByRole('button', { name: /Authorize Rev #1/i });
    fireEvent.click(authorizeButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/settlements/booking-abc-123/authorize',
        expect.objectContaining({ revisionNumber: 1 }),
      );
    });
  });
});
