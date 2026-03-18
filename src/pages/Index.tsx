import React, { useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, Loader2 } from 'lucide-react';

const Index = forwardRef<HTMLDivElement>(function Index(_props, ref) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary">
          <Users className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">HPICS</h1>
        <p className="text-xl text-muted-foreground">
          Hyper-Personal Intelligence CRM System
        </p>
        <p className="text-muted-foreground">
          Enterprise-grade intelligence platform with 400+ AI tools, 22 AGIS phases, 
          autonomous workflows, and HoC Republic integration.
        </p>
        <Button size="lg" onClick={() => navigate('/auth')}>
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
});

export default Index;
