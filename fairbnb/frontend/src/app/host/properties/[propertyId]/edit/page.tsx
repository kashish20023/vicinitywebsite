'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PropertyEditWizardView } from '@/components/property/PropertyEditWizardView';

export default function HostEditPropertyPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  return <PropertyEditWizardView role="host" propertyId={propertyId} />;
}
