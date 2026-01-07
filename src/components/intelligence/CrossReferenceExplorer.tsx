import { useState, useEffect } from 'react';
import { useCrossReference } from '@/hooks/useCrossReference';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Link2,
  User,
  Phone,
  Mail,
  Building,
  Fingerprint
} from 'lucide-react';

interface CrossReferenceExplorerProps {
  profileId?: string;
}

export function CrossReferenceExplorer({ profileId }: CrossReferenceExplorerProps) {
  const { 
    useProfileLinks, 
    useProfileCrossRefs, 
    runAnalysis, 
    confirmLink, 
    rejectLink, 
    isAnalyzing 
  } = useCrossReference();
  
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'email' | 'name'>('phone');

  const { data: links, isLoading: linksLoading } = profileId 
    ? useProfileLinks(profileId) 
    : { data: [], isLoading: false };
  
  const { data: crossRefs, isLoading: refsLoading } = profileId 
    ? useProfileCrossRefs(profileId) 
    : { data: [], isLoading: false };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'email_domain':
        return <Building className="h-4 w-4" />;
      case 'name':
        return <User className="h-4 w-4" />;
      default:
        return <Fingerprint className="h-4 w-4" />;
    }
  };

  const getLinkTypeColor = (type: string) => {
    switch (type) {
      case 'identity':
        return 'bg-red-500';
      case 'organization':
        return 'bg-blue-500';
      case 'communication':
        return 'bg-green-500';
      case 'location':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6" />
            Cross-Reference Intelligence
          </h2>
          <p className="text-muted-foreground">
            Automatic entity resolution and relationship discovery
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => runAnalysis(profileId)}
            disabled={isAnalyzing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
          <Button 
            onClick={() => runAnalysis(undefined, true)}
            disabled={isAnalyzing}
          >
            <Network className="h-4 w-4 mr-2" />
            Full Network Scan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="links" className="space-y-4">
        <TabsList>
          <TabsTrigger value="links">
            Entity Links ({links?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="refs">
            Cross References ({crossRefs?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="search">
            Search
          </TabsTrigger>
        </TabsList>

        {/* Entity Links */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Discovered Entity Links</CardTitle>
              <CardDescription>
                Automatically discovered connections between profiles based on shared identifiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <div className="text-center py-8">Loading links...</div>
              ) : links?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No entity links discovered yet. Run analysis to find connections.
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {links?.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${getLinkTypeColor(link.link_type)} text-white`}>
                            <Link2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {link.link_type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Confidence: {Math.round(link.confidence_score * 100)}%
                              </span>
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-mono">
                                {link.source_id.slice(0, 8)}...
                              </span>
                              <span className="mx-2">→</span>
                              <span className="font-mono">
                                {link.target_id.slice(0, 8)}...
                              </span>
                            </div>
                            {link.evidence && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Evidence: {(link.evidence as any).matching_reference || 'N/A'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {link.is_confirmed ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmed
                            </Badge>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => confirmLink(link.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => rejectLink(link.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cross References */}
        <TabsContent value="refs">
          <Card>
            <CardHeader>
              <CardTitle>Indexed References</CardTitle>
              <CardDescription>
                Normalized identifiers extracted from profile data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {refsLoading ? (
                <div className="text-center py-8">Loading references...</div>
              ) : crossRefs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cross references indexed yet. Run analysis to extract identifiers.
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 gap-3">
                    {crossRefs?.map((ref) => (
                      <div
                        key={ref.id}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="p-2 bg-muted rounded">
                          {getTypeIcon(ref.reference_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize text-xs">
                              {ref.reference_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {Math.round(ref.confidence * 100)}%
                            </span>
                          </div>
                          <div className="text-sm font-medium truncate">
                            {ref.reference_value}
                          </div>
                          {ref.normalized_value !== ref.reference_value && (
                            <div className="text-xs text-muted-foreground truncate">
                              Normalized: {ref.normalized_value}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Cross References</CardTitle>
              <CardDescription>
                Find profiles by shared identifiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={searchType === 'phone' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('phone')}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Phone
                  </Button>
                  <Button
                    variant={searchType === 'email' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('email')}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant={searchType === 'name' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchType('name')}
                  >
                    <User className="h-4 w-4 mr-1" />
                    Name
                  </Button>
                </div>
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder={`Enter ${searchType} to search...`}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                Enter a value and click search to find matching profiles
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
