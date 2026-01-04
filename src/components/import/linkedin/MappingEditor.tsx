import { ColumnMapping } from './linkedinMapping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, MapPin } from 'lucide-react';

interface MappingEditorProps {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

const FIELD_CONFIG: Array<{
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
  description: string;
}> = [
  { key: 'first_name', label: 'First Name', required: false, description: 'Contact\'s first name' },
  { key: 'last_name', label: 'Last Name', required: false, description: 'Contact\'s last name' },
  { key: 'email', label: 'Email', required: false, description: 'Email address' },
  { key: 'organization', label: 'Company', required: false, description: 'Company or organization' },
  { key: 'job_title', label: 'Position', required: false, description: 'Job title or role' },
  { key: 'profile_url', label: 'LinkedIn URL', required: false, description: 'Profile URL' },
  { key: 'connected_on', label: 'Connected On', required: false, description: 'Connection date' },
  { key: 'notes', label: 'Notes', required: false, description: 'Additional notes' },
];

export function MappingEditor({ headers, mapping, onMappingChange }: MappingEditorProps) {
  const handleFieldChange = (field: keyof ColumnMapping, value: string) => {
    const newMapping = { ...mapping };
    if (value === '__none__') {
      delete newMapping[field];
    } else {
      newMapping[field] = parseInt(value, 10);
    }
    onMappingChange(newMapping);
  };
  
  // Check if we have at least one identifier
  const hasIdentifier = 
    mapping.first_name !== undefined ||
    mapping.last_name !== undefined ||
    mapping.email !== undefined ||
    mapping.profile_url !== undefined;
  
  const mappedCount = Object.values(mapping).filter(v => v !== undefined).length;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Column Mapping
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3">
          {hasIdentifier ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {mappedCount} fields mapped
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Map at least one identifier (name/email/URL)
            </Badge>
          )}
        </div>
        
        {/* Mapping fields */}
        <div className="grid gap-3">
          {FIELD_CONFIG.map(({ key, label, description }) => (
            <div key={key} className="grid grid-cols-[140px,1fr] gap-3 items-center">
              <label className="text-sm font-medium">{label}</label>
              <Select
                value={mapping[key]?.toString() ?? '__none__'}
                onValueChange={(value) => handleFieldChange(key, value)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">— Not mapped —</span>
                  </SelectItem>
                  {headers.map((header, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {index + 1}. {header || '(empty column)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground">
          Auto-mapping tried to match columns. Adjust if needed. At minimum, map one of: First Name, Last Name, Email, or LinkedIn URL.
        </p>
      </CardContent>
    </Card>
  );
}
