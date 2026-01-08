import { AppLayout } from '@/components/AppLayout';
import { EnhancedSemanticSearch } from '@/components/search/EnhancedSemanticSearch';

export default function SemanticSearchPage() {
  return (
    <AppLayout title="AI Search">
      <EnhancedSemanticSearch />
    </AppLayout>
  );
}
