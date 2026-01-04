import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, AlertTriangle, Settings2 } from 'lucide-react';
import { GoogleParseResult } from './googleCsvParser';

interface GoogleMappingEditorProps {
  parseResult: GoogleParseResult;
  columnMapping: Record<string, number>;
  onMappingChange: (field: string, columnIndex: number | undefined) => void;
}

// Fields that can be mapped with their display names
const MAPPABLE_FIELDS = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'middle_name', label: 'Middle Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'email2', label: 'Email 2', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'mobile_phone', label: 'Mobile Phone', required: false },
  { key: 'home_phone', label: 'Home Phone', required: false },
  { key: 'business_phone', label: 'Business Phone', required: false },
  { key: 'organization', label: 'Company/Organization', required: false },
  { key: 'job_title', label: 'Job Title', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'notes', label: 'Notes', required: false },
  { key: 'birthday', label: 'Birthday', required: false },
  { key: 'website', label: 'Website', required: false },
  { key: 'nickname', label: 'Nickname', required: false },
  { key: 'home_address', label: 'Home Address', required: false },
  { key: 'home_city', label: 'Home City', required: false },
  { key: 'home_country', label: 'Home Country', required: false },
];

export function GoogleMappingEditor({ 
  parseResult, 
  columnMapping, 
  onMappingChange 
}: GoogleMappingEditorProps) {
  const { headers } = parseResult;
  
  // Count mapped required vs optional fields
  const mappedRequired = MAPPABLE_FIELDS.filter(f => f.required && columnMapping[f.key] !== undefined).length;
  const totalRequired = MAPPABLE_FIELDS.filter(f => f.required).length;
  const mappedOptional = MAPPABLE_FIELDS.filter(f => !f.required && columnMapping[f.key] !== undefined).length;
  
  const allRequiredMapped = mappedRequired >= totalRequired;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Column Mapping
        </CardTitle>
        <div className="flex items-center gap-3 text-sm">
          {allRequiredMapped ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="h-3 w-3 mr-1" />
              {mappedRequired}/{totalRequired} required
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {mappedRequired}/{totalRequired} required
            </Badge>
          )}
          <Badge variant="secondary">
            {mappedOptional} optional fields mapped
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MAPPABLE_FIELDS.map((field) => {
            const mappedIndex = columnMapping[field.key];
            const isMapped = mappedIndex !== undefined;
            
            return (
              <div key={field.key} className="space-y-1">
                <label className="text-sm font-medium flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </label>
                <Select
                  value={isMapped ? String(mappedIndex) : 'unmapped'}
                  onValueChange={(v) => {
                    if (v === 'unmapped') {
                      onMappingChange(field.key, undefined);
                    } else {
                      onMappingChange(field.key, parseInt(v, 10));
                    }
                  }}
                >
                  <SelectTrigger className={isMapped ? 'border-primary/50' : ''}>
                    <SelectValue>
                      {isMapped ? headers[mappedIndex] : '— Not mapped —'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unmapped">— Not mapped —</SelectItem>
                    {headers.map((header, index) => (
                      <SelectItem key={index} value={String(index)}>
                        {header || `Column ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
        
        {/* Sample data preview */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium mb-2">Sample Data Preview</div>
          <div className="text-xs text-muted-foreground space-y-1">
            {parseResult.contacts.slice(0, 3).map((contact, i) => (
              <div key={i} className="flex gap-4">
                <span className="font-medium min-w-[120px]">
                  {contact.first_name} {contact.last_name}
                </span>
                <span className="text-muted-foreground">{contact.email || '—'}</span>
                <span className="text-muted-foreground">{contact.phone || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
