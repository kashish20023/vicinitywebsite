import React from 'react';
import { CreatorProfileView } from '@/components/profile/CreatorProfileView';

interface HostProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function HostProfilePage({ params }: HostProfilePageProps) {
  const resolvedParams = await params;
  return <CreatorProfileView hostId={resolvedParams.id} />;
}
