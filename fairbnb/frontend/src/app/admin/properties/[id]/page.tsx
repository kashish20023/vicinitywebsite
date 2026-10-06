'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PropertyDetailManagementView } from '@/components/property/PropertyDetailManagementView';

export default function AdminPropertyDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return <PropertyDetailManagementView role="admin" propertyId={id} />;
}
