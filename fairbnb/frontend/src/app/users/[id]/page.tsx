import React from 'react';
import { CreatorProfileView } from '@/components/profile/CreatorProfileView';

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const resolvedParams = await params;
  return <CreatorProfileView hostId={resolvedParams.id} />;
}
