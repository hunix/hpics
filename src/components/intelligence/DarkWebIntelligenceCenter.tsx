import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Globe, 
  Shield, 
  AlertTriangle, 
  Search,
  Eye,
  Key,
  RefreshCw,
  Skull,
  Lock,
  Unlock,
  ExternalLink
} from "lucide-react";
import { useDarkWebIntelligence } from "@/hooks/intelligence/useDarkWebIntelligence";

interface DarkWebIntelligenceCenterProps {
  profileId?: string;
}

export function DarkWebIntelligenceCenter({ profileId }: DarkWebIntelligenceCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("mentions");
  const { 
    mentions = [], 
    exposures = [], 
    threats = [], 
    isLoading,
    isScanning,
    scanDarkWeb,
    updateRemediation,
    criticalMentions,
    unresolvedExposures,
    highThreats,
    overallThreatScore,
    totalMentions,
    totalExposures
  } = useDarkWebIntelligence(profileId);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-500 bg-red-500/10 border-red-500/50";
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/50";
      case "medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/50";
      default: return "text-blue-500 bg-blue-500/10 border-blue-500/50";
    }
  };

  const handleScan = () => {
    scanDarkWeb({ profileId, searchTerms: searchQuery ? [searchQuery] : undefined });
  };

  const handleRemediate = (exposureId: string) => {
    updateRemediation({ 
      exposureId, 
      status: 'in_progress',
      action: 'Password reset initiated'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Skull className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Dark Web Intelligence</h2>
            <p className="text-sm text-muted-foreground">
              Underground monitoring • Credential exposure • Threat detection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search dark web..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleScan}
            disabled={isLoading || isScanning}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            Scan
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {typeof criticalMentions === 'number' && criticalMentions > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Unlock className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-500">Critical Credential Exposure</p>
                <p className="text-sm text-muted-foreground">
                  {criticalMentions} critical mentions found in recent dark web breaches
                </p>
              </div>
              <Button variant="destructive" size="sm" className="ml-auto">
                View Exposures
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mentions" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Dark Web Mentions
            {mentions.length > 0 && (
              <Badge variant="secondary" className="ml-1">{mentions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credential Exposures
            {exposures.length > 0 && (
              <Badge variant="destructive" className="ml-1">{exposures.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="threats" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Threat Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Underground Mentions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {mentions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No dark web mentions found</p>
                      <p className="text-sm">Enter a search query to scan underground sources</p>
                    </div>
                  ) : (
                    mentions.map((mention) => (
                      <div 
                        key={mention.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(mention.riskScore >= 80 ? 'critical' : mention.riskScore >= 50 ? 'high' : 'medium')}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {mention.sourceType}
                            </Badge>
                            <Badge className={`capitalize ${
                              mention.riskScore >= 80 ? 'bg-red-500' :
                              mention.riskScore >= 50 ? 'bg-orange-500' :
                              mention.riskScore >= 30 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}>
                              Risk: {mention.riskScore}%
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {mention.discoveredAt && new Date(mention.discoveredAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium">{mention.searchTerm}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Source
                          </Button>
                          <Button variant="ghost" size="sm">
                            Mark as Reviewed
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Exposed Credentials
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {exposures.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No credential exposures detected</p>
                      <p className="text-sm">Credentials appear secure</p>
                    </div>
                  ) : (
                    exposures.map((cred) => (
                      <div 
                        key={cred.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(cred.riskLevel >= 80 ? 'critical' : 'high')}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Unlock className="h-5 w-5 text-red-500" />
                            <span className="font-medium">
                              {cred.credentialTypes?.join(', ') || 'Unknown'}
                            </span>
                          </div>
                          <Badge className={`capitalize ${
                            cred.riskLevel >= 80 ? 'bg-red-500' : 'bg-orange-500'
                          }`}>
                            Risk: {cred.riskLevel}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                          <div>
                            <span className="text-muted-foreground">Exposed: </span>
                            <span className="font-mono">••••••••</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Breach: </span>
                            <span>{cred.breachSource || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Discovered: </span>
                            <span>
                              {cred.discoveredAt && new Date(cred.discoveredAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status: </span>
                            <span>{cred.remediationStatus || 'unresolved'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemediate(cred.id)}
                          >
                            Force Password Reset
                          </Button>
                          <Button variant="outline" size="sm">
                            Add to Monitoring
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Aggregated Threat Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {threats.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active threats detected</p>
                      <p className="text-sm">Threat landscape appears clear</p>
                    </div>
                  ) : (
                    threats.map((threat) => (
                      <div 
                        key={threat.id}
                        className={`p-4 rounded-lg border ${getSeverityColor(threat.threatLevel || 'medium')}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <AlertTriangle className="h-5 w-5" />
                              <span className="font-medium">{threat.threatType}</span>
                              <Badge className="capitalize">{threat.threatLevel}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {threat.threatType} detected
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{((threat.confidenceScore || 0) * 100).toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">confidence</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            Investigate
                          </Button>
                          <Button variant="ghost" size="sm">
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-500">{totalMentions}</p>
              <p className="text-sm text-muted-foreground">Dark Web Mentions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{totalExposures}</p>
              <p className="text-sm text-muted-foreground">Exposed Credentials</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{typeof highThreats === 'number' ? highThreats : 0}</p>
              <p className="text-sm text-muted-foreground">Active Threats</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {typeof unresolvedExposures === 'number' && unresolvedExposures === 0 ? '✓' : '⚠'}
              </p>
              <p className="text-sm text-muted-foreground">Security Status</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
