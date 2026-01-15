/**
 * Supremacy V2 Page
 * AGIS Phase 2 Command Center
 */

import { useSearchParams } from 'react-router-dom';
import { SupremacyDashboardV2 } from '@/components/intelligence/SupremacyDashboardV2';

export default function SupremacyV2Page() {
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile') || undefined;

  return (
    <div className="container mx-auto p-6">
      <SupremacyDashboardV2 profileId={profileId} />
    </div>
  );
}
