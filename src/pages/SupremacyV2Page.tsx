/**
 * Supremacy V2 Page
 * AGIS Phase 2 Command Center
 */

import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { SupremacyDashboardV2 } from '@/components/intelligence/SupremacyDashboardV2';

export default function SupremacyV2Page() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || undefined;

  return (
    <AppLayout title="Supremacy Command">
      <SupremacyDashboardV2 profileId={profileId} />
    </AppLayout>
  );
}
