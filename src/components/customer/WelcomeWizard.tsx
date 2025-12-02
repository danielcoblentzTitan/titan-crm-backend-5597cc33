import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Home, MessageCircle, Calendar, Camera, Building, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WelcomeWizardProps {
  projectId: string;
  customerName: string;
  project: any;
  onComplete: () => void;
}

interface OnboardingData {
  welcome_completed: boolean;
  timeline_viewed: boolean;
  communication_setup: boolean;
  dashboard_configured: boolean;
  onboarding_step: number;
}

const steps = [
  {
    id: 1,
    title: 'Welcome to Your Project Portal',
    description: 'Get familiar with your personalized construction dashboard',
    icon: Home,
    content: 'welcome'
  },
  {
    id: 2,
    title: 'Explore Your Project Timeline',
    description: 'See your construction phases and important milestones',
    icon: Building,
    content: 'timeline'
  },
  {
    id: 3,
    title: 'Set Up Communication',
    description: 'Connect with your builder team and schedule calls',
    icon: MessageCircle,
    content: 'communication'
  },
  {
    id: 4,
    title: 'Photo Sharing & Updates',
    description: 'Learn how to share photos and get project updates',
    icon: Camera,
    content: 'photos'
  }
];

export const WelcomeWizard = ({ projectId, customerName, project, onComplete }: WelcomeWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    welcome_completed: false,
    timeline_viewed: false,
    communication_setup: false,
    dashboard_configured: false,
    onboarding_step: 1
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOnboardingData();
  }, [projectId]);

  const loadOnboardingData = async () => {
    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!customer) return;

      const { data: onboarding } = await supabase
        .from('customer_onboarding')
        .select('*')
        .eq('project_id', projectId)
        .eq('customer_id', customer.id)
        .maybeSingle();

      if (onboarding) {
        setOnboardingData(onboarding);
        setCurrentStep(onboarding.onboarding_step);
      } else {
        // Create initial onboarding record
        await supabase
          .from('customer_onboarding')
          .insert({
            project_id: projectId,
            customer_id: customer.id,
            onboarding_step: 1
          });
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    }
  };

  const updateOnboardingStep = async (step: number, updates: Partial<OnboardingData>) => {
    try {
      setLoading(true);
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!customer) return;

      await supabase
        .from('customer_onboarding')
        .update({
          onboarding_step: step,
          ...updates
        })
        .eq('project_id', projectId)
        .eq('customer_id', customer.id);

      setOnboardingData(prev => ({ ...prev, ...updates, onboarding_step: step }));
    } catch (error) {
      console.error('Error updating onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    const nextStep = currentStep + 1;
    let updates: Partial<OnboardingData> = {};

    switch (currentStep) {
      case 1:
        updates.welcome_completed = true;
        break;
      case 2:
        updates.timeline_viewed = true;
        break;
      case 3:
        updates.communication_setup = true;
        break;
      case 4:
        updates.dashboard_configured = true;
        break;
    }

    if (nextStep > steps.length) {
      completeOnboarding();
    } else {
      setCurrentStep(nextStep);
      updateOnboardingStep(nextStep, updates);
    }
  };

  const completeOnboarding = async () => {
    try {
      await updateOnboardingStep(5, {
        dashboard_configured: true,
        welcome_completed: true,
        timeline_viewed: true,
        communication_setup: true
      });

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (customer) {
        await supabase
          .from('customer_onboarding')
          .update({ completed_at: new Date().toISOString() })
          .eq('project_id', projectId)
          .eq('customer_id', customer.id);
      }

      toast({
        title: 'Welcome Complete!',
        description: 'You\'re all set up. Enjoy your project portal experience!'
      });

      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep - 1];
    
    switch (step.content) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary-variant rounded-full flex items-center justify-center">
                <Star className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome to your {project?.name || 'Project'} Portal!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Hi {customerName}! This is your personal portal where you can track progress, 
                communicate with your builder, and stay updated on every aspect of your construction project.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-accent/20">
                <Building className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Real-time Progress</h3>
                <p className="text-sm text-muted-foreground">Track your project phases and milestones</p>
              </div>
              <div className="p-4 border rounded-lg bg-accent/20">
                <MessageCircle className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Direct Communication</h3>
                <p className="text-sm text-muted-foreground">Chat directly with your builder team</p>
              </div>
              <div className="p-4 border rounded-lg bg-accent/20">
                <Calendar className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Schedule Calls</h3>
                <p className="text-sm text-muted-foreground">Book video calls with your project manager</p>
              </div>
              <div className="p-4 border rounded-lg bg-accent/20">
                <Camera className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold">Photo Updates</h3>
                <p className="text-sm text-muted-foreground">See daily progress photos and share your own</p>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-center">Your Project Timeline</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-success/10 border-success/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">Planning & Permits</span>
                  </div>
                  <Badge variant="secondary" className="bg-success/20 text-success">Completed</Badge>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-primary/10 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 rounded-full bg-primary animate-pulse" />
                    <span className="font-medium">Foundation & Site Prep</span>
                  </div>
                  <Badge className="bg-primary/20 text-primary">In Progress</Badge>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    <span className="font-medium">Framing</span>
                  </div>
                  <Badge variant="outline">Upcoming</Badge>
                </div>
              </div>
            </div>
            
            <div className="bg-accent/20 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> You'll receive notifications when each phase begins and when milestones are reached. 
                Click on any phase in your main portal to see detailed progress and photos.
              </p>
            </div>
          </div>
        );

      case 'communication':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-center">Stay Connected</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold">Real-time Chat</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Send messages directly to your builder team. Get quick answers to questions and updates on progress.
                </p>
                <Button variant="outline" size="sm">Try Chat Now</Button>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold">Video Calls</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Schedule video calls with your project manager for detailed discussions and virtual site tours.
                </p>
                <Button variant="outline" size="sm">Schedule Call</Button>
              </div>
            </div>
          </div>
        );

      case 'photos':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-center">Photo Sharing & Updates</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Daily Progress Photos</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your builder will share photos of daily progress so you can see how your project is developing.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square bg-muted rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="aspect-square bg-muted rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="aspect-square bg-muted rounded border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Share Your Own Photos</h3>
                <p className="text-sm text-muted-foreground">
                  Got questions about specific areas? Upload photos and tag them to get detailed responses from your builder.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">Step {currentStep} of {steps.length}</Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onComplete}
              className="text-muted-foreground hover:text-foreground"
            >
              Skip Tour
            </Button>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle className="flex items-center justify-center space-x-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "h-6 w-6 text-primary" })}
            <span>{steps[currentStep - 1].title}</span>
          </CardTitle>
          <p className="text-muted-foreground">{steps[currentStep - 1].description}</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {currentStep === steps.length ? 'Complete Setup' : 'Next'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};