import React from 'react';
import { Metadata } from 'next';
import { ReelsFeed } from '@/components/reels/ReelsFeed';

export const metadata: Metadata = {
  title: 'Reels — FairBnB Short Video Tours',
  description:
    'Discover short-form video tours of unique stays and experiences hosted by FairBnB creators.',
};

export default function ReelsPage() {
  return (
    <main className="fullscreen-page w-full h-screen bg-gray-950 overflow-hidden !pb-0">
      <ReelsFeed />
    </main>
  );
}
