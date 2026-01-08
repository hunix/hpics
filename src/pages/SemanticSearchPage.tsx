import { AppLayout } from '@/components/AppLayout';
import { SemanticSearch } from '@/components/search/SemanticSearch';

export default function SemanticSearchPage() {
  return (
    <AppLayout title="AI Search">
      <div className="max-w-4xl mx-auto">
        <SemanticSearch />
      </div>
    </AppLayout>
  );
}
