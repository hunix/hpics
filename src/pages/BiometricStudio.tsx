import { useState } from "react";
import {
  Fingerprint, Eye, Mic, Shield, Settings, BarChart3,
  Upload, Search, Layers, Lock, Unlock, Activity, CheckCircle2,
  XCircle, AlertTriangle, Database
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useBiometricStudio,
  type BiometricEmbedding,
  type BiometricPrivacy,
} from "@/hooks/intelligence/useBiometricGallery";
import { useContacts } from "@/hooks/useContacts";

// ─────────────────────────────────────── Modality Icons ──────────────────────

const MODALITY_META: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  face: { icon: Eye, color: "text-blue-400", label: "Face" },
  voice: { icon: Mic, color: "text-violet-400", label: "Voice" },
  gait: { icon: Activity, color: "text-emerald-400", label: "Gait" },
  typing: { icon: Fingerprint, color: "text-amber-400", label: "Typing" },
};

// ─────────────────────────────────────── Gallery Card ────────────────────────

function GalleryCard({ enrollment }: { enrollment: BiometricEmbedding }) {
  const meta = MODALITY_META[enrollment.modality] ?? MODALITY_META.face;
  const Icon = meta.icon;

  return (
    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
      <div className="flex items-center gap-2.5 mb-2">
        <Icon className={cn("w-4 h-4", meta.color)} />
        <span className="text-sm font-medium text-white">{meta.label}</span>
        <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 ml-auto">
          {enrollment.source_type}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Confidence</div>
          <Progress value={enrollment.confidence * 100} className="h-1" />
          <span className="text-[10px] text-slate-400">{Math.round(enrollment.confidence * 100)}%</span>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Quality</div>
          <Progress value={enrollment.quality_score * 100} className="h-1" />
          <span className="text-[10px] text-slate-400">{Math.round(enrollment.quality_score * 100)}%</span>
        </div>
        <div>
          <div className="text-[10px] text-slate-500 mb-0.5">Updates</div>
          <span className="text-xs text-white font-mono">{enrollment.update_count}</span>
        </div>
      </div>
      <div className="text-[10px] text-slate-600 mt-2">
        Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────── Privacy Panel ───────────────────────

function PrivacyPanel({
  privacy,
  onUpdate,
}: {
  privacy: BiometricPrivacy | undefined;
  onUpdate: (settings: Partial<BiometricPrivacy>) => void;
}) {
  if (!privacy) return <div className="text-slate-500 text-sm p-4">Loading privacy settings…</div>;

  const toggles: Array<{ key: keyof BiometricPrivacy; label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = [
    { key: "face_enrollment_consent", label: "Face Enrollment", icon: Eye, description: "Allow enrolling facial biometric templates" },
    { key: "voice_enrollment_consent", label: "Voice Enrollment", icon: Mic, description: "Allow enrolling voice biometric templates" },
    { key: "ambient_detection_consent", label: "Ambient Detection", icon: Fingerprint, description: "Passive contact detection when camera/mic active" },
    { key: "federated_learning_consent", label: "Federated Learning", icon: Database, description: "Contribute anonymized gradients to improve models" },
    { key: "ambient_detection_enabled", label: "Ambient Mode Active", icon: Activity, description: "Enable real-time ambient biometric scanning" },
  ];

  return (
    <div className="space-y-3">
      {toggles.map(({ key, label, icon: Icon, description }) => (
        <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
          <div className="flex items-center gap-2.5">
            <Icon className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-sm text-white">{label}</p>
              <p className="text-[10px] text-slate-500">{description}</p>
            </div>
          </div>
          <Switch
            checked={!!privacy[key]}
            onCheckedChange={(checked) => onUpdate({ [key]: checked })}
          />
        </div>
      ))}

      <Separator className="bg-slate-700/50" />

      {/* Privacy Budget */}
      <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-white">Privacy Budget (ε)</span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={(privacy.current_privacy_spent / privacy.max_privacy_epsilon) * 100} className="h-2 flex-1" />
          <span className="text-xs text-slate-400 font-mono">
            {privacy.current_privacy_spent.toFixed(1)} / {privacy.max_privacy_epsilon}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Differential privacy budget — limits information leakage from federated learning
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────── Main Page ───────────────────────────

export default function BiometricStudio() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
  const { data: contacts } = useContacts();

  const {
    audit, privacy, gallery, isLoading,
    enroll, identify, fusion, updatePrivacy,
  } = useBiometricStudio(selectedProfileId);

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* Header */}
      <div className="border-b border-slate-800/60 bg-[#0d1421]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <Fingerprint className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-semibold">Biometric Studio</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">Phase 4</Badge>
          <div className="flex-1" />

          <select
            value={selectedProfileId ?? ""}
            onChange={(e) => setSelectedProfileId(e.target.value || undefined)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
          >
            <option value="">Select contact…</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Stats + Quick Actions */}
          <div className="space-y-4">
            {/* Audit Summary */}
            <Card className="bg-[#0d1421] border-slate-800/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  Gallery Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-800/40 text-center">
                    <div className="text-lg font-bold text-white">{audit?.total_embeddings ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Templates</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-800/40 text-center">
                    <div className="text-lg font-bold text-violet-400">{audit?.recent_identifications ?? 0}</div>
                    <div className="text-[10px] text-slate-500">Recent IDs</div>
                  </div>
                </div>

                {audit?.embeddings_by_modality && (
                  <div className="space-y-1.5">
                    {Object.entries(audit.embeddings_by_modality).map(([mod, count]) => {
                      const meta = MODALITY_META[mod] ?? MODALITY_META.face;
                      const Icon = meta.icon;
                      return (
                        <div key={mod} className="flex items-center gap-2">
                          <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                          <span className="text-xs text-slate-300 flex-1">{meta.label}</span>
                          <span className="text-xs text-white font-mono">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multi-Modal Fusion */}
            {selectedProfileId && (
              <Card className="bg-[#0d1421] border-slate-800/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    Multi-Modal Fusion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-slate-400">
                    Combines Face (40%) + Voice (35%) + Behavioral (25%) for composite identity confidence.
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["face", "voice", "behavioral"].map((mod) => {
                      const enrolled = gallery.some((g) => g.modality === mod);
                      return (
                        <div key={mod} className={cn(
                          "p-2 rounded-lg text-center text-[10px]",
                          enrolled ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300" : "bg-slate-800/40 text-slate-500"
                        )}>
                          {enrolled ? <CheckCircle2 className="w-3 h-3 mx-auto mb-0.5" /> : <XCircle className="w-3 h-3 mx-auto mb-0.5" />}
                          {mod}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main: Tabs */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="gallery">
              <TabsList className="bg-slate-800/60 border border-slate-700/50">
                <TabsTrigger value="gallery">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />Gallery
                </TabsTrigger>
                <TabsTrigger value="identify">
                  <Search className="w-3.5 h-3.5 mr-1.5" />Identify
                </TabsTrigger>
                <TabsTrigger value="privacy">
                  <Shield className="w-3.5 h-3.5 mr-1.5" />Privacy
                </TabsTrigger>
              </TabsList>

              {/* Gallery */}
              <TabsContent value="gallery" className="mt-4">
                {!selectedProfileId ? (
                  <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                    Select a contact to view their biometric gallery
                  </div>
                ) : gallery.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Fingerprint className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No biometric templates enrolled</p>
                      <p className="text-xs mt-1">Enroll face or voice templates to begin</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gallery.map((enrollment) => (
                      <GalleryCard key={enrollment.id} enrollment={enrollment} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Identify */}
              <TabsContent value="identify" className="mt-4">
                <Card className="bg-[#0d1421] border-slate-800/60">
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                      <p className="text-sm text-slate-400">
                        Identification requires a biometric probe (face image or voice sample).
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the Chrome Extension or Desktop App to capture biometric data,
                        then probe against the gallery here.
                      </p>
                      <div className="flex justify-center gap-3 mt-4">
                        <Button
                          variant="outline"
                          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                          disabled
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Face Probe
                        </Button>
                        <Button
                          variant="outline"
                          className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                          disabled
                        >
                          <Mic className="w-4 h-4 mr-2" />
                          Voice Probe
                        </Button>
                      </div>
                    </div>

                    {/* Recent Identifications */}
                    {(audit?.identifications?.length ?? 0) > 0 && (
                      <>
                        <Separator className="bg-slate-700/50" />
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Recent Identifications</p>
                        <ScrollArea className="h-48">
                          <div className="space-y-2 pr-4">
                            {audit!.identifications.map((id, i) => (
                              <div key={i} className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 flex items-center gap-3">
                                <Badge variant="outline" className="text-[10px]">{String(id.query_modality)}</Badge>
                                <span className="text-xs text-white flex-1">
                                  {id.best_match_profile_id ? `Match: ${Math.round((id.best_match_confidence as number ?? 0) * 100)}%` : "No match"}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(String(id.identified_at)).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Privacy */}
              <TabsContent value="privacy" className="mt-4">
                <PrivacyPanel
                  privacy={privacy}
                  onUpdate={(settings) => updatePrivacy.mutate(settings)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
