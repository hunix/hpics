import { AppLayout } from '@/components/AppLayout';
import { AdvancedNetworkDashboard } from '@/components/network/AdvancedNetworkDashboard';

export default function AdvancedNetworkPage() {
  return (
    <AppLayout title="Advanced Network Analytics">
      <AdvancedNetworkDashboard />
    </AppLayout>
  );
}
