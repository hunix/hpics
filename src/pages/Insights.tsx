import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, TrendingUp, Users, Lightbulb, Zap } from 'lucide-react';

export default function Insights() {
  return (
    <AppLayout title="AI Insights">
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">AI-Powered Relationship Intelligence</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get deep insights into your relationships with personality profiling, sentiment analysis, 
            and personalized recommendations powered by AI.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Personality Profiling</CardTitle>
              </div>
              <CardDescription>
                Understand communication styles and personality traits based on interaction patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Sentiment Analysis</CardTitle>
              </div>
              <CardDescription>
                Track emotional trends and relationship health over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Social Playbook</CardTitle>
              </div>
              <CardDescription>
                Get personalized briefings and conversation starters before meetings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Relationship Scoring</CardTitle>
              </div>
              <CardDescription>
                AI-calculated health scores with actionable improvement suggestions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-pink-500" />
                <CardTitle className="text-lg">Pattern Detection</CardTitle>
              </div>
              <CardDescription>
                Identify communication patterns and optimal times to connect.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Smart Suggestions</CardTitle>
              </div>
              <CardDescription>
                Get AI-powered recommendations for strengthening relationships.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                <Sparkles className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/50">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground">
              AI features require communication data. Start logging your interactions to unlock these insights!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
