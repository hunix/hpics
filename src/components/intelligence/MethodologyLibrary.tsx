import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, Search, Brain, Users, Heart, Shield, 
  AlertTriangle, CheckCircle, Target
} from 'lucide-react';
import { useMethodologyLibrary } from '@/hooks/useInfluenceProfile';

interface MethodologyLibraryProps {
  onApplyToContact?: (methodologyId: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  persuasion: Target,
  rapport: Heart,
  influence: Brain,
  elicitation: Search,
  profiling: Users,
  conflict: Shield,
  trust: CheckCircle,
};

const difficultyColors: Record<string, string> = {
  basic: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function MethodologyLibrary({ onApplyToContact }: MethodologyLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: methodologies, isLoading } = useMethodologyLibrary();

  const categories = [...new Set(methodologies?.map(m => m.category) || [])];

  const filteredMethodologies = methodologies?.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Influence Methodology Library
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {methodologies?.length || 0} proven psychological techniques at your disposal
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search methodologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] || Brain;
                return (
                  <TabsTrigger key={cat} value={cat} className="text-xs capitalize">
                    <Icon className="h-3 w-3 mr-1" />
                    {cat}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Methodologies List */}
      <Card>
        <CardContent className="pt-6">
          <ScrollArea className="h-[600px] pr-4">
            {filteredMethodologies.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredMethodologies.map((methodology) => {
                  const CategoryIcon = categoryIcons[methodology.category] || Brain;
                  return (
                    <AccordionItem key={methodology.id} value={methodology.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <CategoryIcon className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{methodology.name}</p>
                              <Badge className={difficultyColors[methodology.difficulty_level || 'basic']} variant="outline">
                                {methodology.difficulty_level}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {methodology.description}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2 pl-8">
                          {/* Description */}
                          <div>
                            <p className="text-sm">{methodology.description}</p>
                          </div>

                          {/* Psychological Basis */}
                          {methodology.psychological_basis && (
                            <div>
                              <p className="font-medium text-sm mb-1">🧠 Psychological Basis</p>
                              <p className="text-sm text-muted-foreground">{methodology.psychological_basis}</p>
                            </div>
                          )}

                          {/* Technique Steps */}
                          {methodology.technique_steps && (
                            <div>
                              <p className="font-medium text-sm mb-2">📋 How to Apply</p>
                              <ol className="space-y-1.5 text-sm">
                                {((methodology.technique_steps as any)?.steps || []).map((step: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                                      {i + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Best For */}
                          {methodology.best_for && methodology.best_for.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-2">✅ Best For</p>
                              <div className="flex flex-wrap gap-1">
                                {methodology.best_for.map((item: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contraindications */}
                          {methodology.contraindications && methodology.contraindications.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                When NOT to Use
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {methodology.contraindications.map((item: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Success Indicators */}
                          {methodology.success_indicators && methodology.success_indicators.length > 0 && (
                            <div>
                              <p className="font-medium text-sm mb-2">🎯 Signs It's Working</p>
                              <ul className="space-y-1 text-sm">
                                {methodology.success_indicators.map((indicator: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                    {indicator}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Ethical Considerations */}
                          {methodology.ethical_considerations && (
                            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                              <p className="font-medium text-sm mb-1 flex items-center gap-1">
                                <Shield className="h-4 w-4" />
                                Ethical Considerations
                              </p>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                {methodology.ethical_considerations}
                              </p>
                            </div>
                          )}

                          {/* Apply Button */}
                          {onApplyToContact && (
                            <Button 
                              size="sm" 
                              onClick={() => onApplyToContact(methodology.id)}
                              className="mt-2"
                            >
                              <Target className="h-4 w-4 mr-1" />
                              Apply to This Contact
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No methodologies found matching your search.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
