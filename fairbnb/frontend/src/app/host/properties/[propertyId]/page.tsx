'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PropertyDetailManagementView } from '@/components/property/PropertyDetailManagementView';

export default function HostPropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  return <PropertyDetailManagementView role="host" propertyId={propertyId} />;
}
