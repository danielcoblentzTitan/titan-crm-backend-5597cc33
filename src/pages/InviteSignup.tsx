
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabaseService } from '@/services/supabaseService';

const InviteSignup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    if (!inviteToken) {
      navigate('/login');
    }
  }, [inviteToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Sign up the user
      const result = await supabaseService.signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          role: 'customer'
        }
      );

      if (result.user && inviteToken) {
        // Accept the invite
        await supabaseService.acceptCustomerInvite(inviteToken, result.user.id);
        
        toast({
          title: "Success",
          description: "Account created successfully! You can now access your customer portal.",
        });

        // Redirect to customer portal
        navigate('/customer-portal');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!inviteToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center space-y-2 pb-4 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Create Your Customer Account</CardTitle>
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            You've been invited to join the customer portal. Create your account to get started.
          </p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                className="h-10 sm:h-11"
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-10 sm:h-11"
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="h-10 sm:h-11"
                placeholder="Enter your password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                minLength={6}
                className="h-10 sm:h-11"
                placeholder="Confirm your password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-[#003562] hover:bg-[#003562]/90 h-10 sm:h-11 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteSignup;
