'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PropertyEditWizardView } from '@/components/property/PropertyEditWizardView';

export default function AdminEditPropertyPage() {
  const params = useParams();
  const id = params.id as string;

  return <PropertyEditWizardView role="admin" propertyId={id} />;
}
