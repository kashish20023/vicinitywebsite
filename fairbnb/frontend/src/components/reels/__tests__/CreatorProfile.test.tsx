import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CreatorProfileView, HostProfileData } from '../../profile/CreatorProfileView';

describe('Phase 7 — Creator Profiles (Listings + Reels) Suite', () => {
  const mockProfileData: HostProfileData = {
    host: {
      id: 'creator_host_1',
      name: 'Sofia Martinez',
      avatarUrl: 'https://example.com/sofia.jpg',
      bio: 'Luxury villa host in Ibiza & Marbella.',
      isSuperhost: true,
      joinedAt: '2023-05-15T00:00:00Z',
    },
    stats: {
      totalListings: 2,
      averageRating: 4.95,
      totalReviews: 28,
    },
    listings: [
      {
        id: 'prop_ibiza_1',
        title: 'Villa Paradiso Ibiza',
        city: 'Ibiza',
        state: 'Balearic Islands',
        basePrice: 650,
        coverImage: 'https://example.com/villa.jpg',
      },
      {
        id: 'prop_marbella_1',
        title: 'Marbella Beachfront Estate',
        city: 'Marbella',
        basePrice: 890,
      },
    ],
  };

  it('renders creator profile header, host name, bio, superhost badge, and stats', () => {
    render(<CreatorProfileView hostId="creator_host_1" initialData={mockProfileData} />);

    expect(screen.getByText('Sofia Martinez')).toBeInTheDocument();
    expect(screen.getByText('Superhost')).toBeInTheDocument();
    expect(screen.getByText(/luxury villa host in ibiza/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // total listings
    expect(screen.getByText(/5.0/)).toBeInTheDocument(); // avg rating
    expect(screen.getByText('28')).toBeInTheDocument(); // total reviews
  });

  it('renders Listings tab by default with property cards and links', () => {
    render(<CreatorProfileView hostId="creator_host_1" initialData={mockProfileData} />);

    expect(screen.getByRole('tab', { name: /listings \(2\)/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Villa Paradiso Ibiza')).toBeInTheDocument();
    expect(screen.getByText('Marbella Beachfront Estate')).toBeInTheDocument();
    expect(screen.getByText('$650')).toBeInTheDocument();
  });

  it('switches to Reels tab when Reels tab is clicked', async () => {
    render(<CreatorProfileView hostId="creator_host_1" initialData={mockProfileData} />);
    const reelsTab = screen.getByRole('tab', { name: /reels/i });

    await act(async () => {
      fireEvent.click(reelsTab);
    });

    expect(reelsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders empty listings fallback state when host has 0 listings', () => {
    const emptyListingsData: HostProfileData = {
      ...mockProfileData,
      stats: { ...mockProfileData.stats, totalListings: 0 },
      listings: [],
    };

    render(<CreatorProfileView hostId="creator_host_1" initialData={emptyListingsData} />);
    expect(
      screen.getByText(/this creator has no public listings at this time/i),
    ).toBeInTheDocument();
  });
});
