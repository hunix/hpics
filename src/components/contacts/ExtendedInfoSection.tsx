import { PersonalInfoManager } from './PersonalInfoManager';
import { LanguagesManager } from './LanguagesManager';
import { DevicesManager } from './DevicesManager';
import { VehiclesManager } from './VehiclesManager';
import { PropertiesManager } from './PropertiesManager';
import { TravelHistoryManager } from './TravelHistoryManager';
import { IdentityDocumentsManager } from './IdentityDocumentsManager';
import { ResidenceHistoryManager } from './ResidenceHistoryManager';
import { Separator } from '@/components/ui/separator';

interface ExtendedInfoSectionProps {
  profileId: string;
}

export function ExtendedInfoSection({ profileId }: ExtendedInfoSectionProps) {
  return (
    <div className="space-y-6">
      <PersonalInfoManager profileId={profileId} />
      <Separator />
      <LanguagesManager profileId={profileId} />
      <Separator />
      <IdentityDocumentsManager profileId={profileId} />
      <Separator />
      <ResidenceHistoryManager profileId={profileId} />
      <Separator />
      <DevicesManager profileId={profileId} />
      <Separator />
      <VehiclesManager profileId={profileId} />
      <Separator />
      <PropertiesManager profileId={profileId} />
      <Separator />
      <TravelHistoryManager profileId={profileId} />
    </div>
  );
}
