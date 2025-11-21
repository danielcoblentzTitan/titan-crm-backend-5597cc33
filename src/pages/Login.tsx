
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Building, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inviteToken = searchParams.get('invite');
  const loginType = searchParams.get('type') || 'client';

  // Form states
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  useEffect(() => {
    // Only redirect if user is already logged in AND they're on the login page
    // This prevents redirects when refreshing other pages
    if (user && window.location.pathname === '/login') {
      if (user.user_metadata?.role === 'builder') {
        navigate('/dashboard');
      } else {
        navigate('/customer-portal');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    // If there's an invite token, redirect to invite signup page
    if (inviteToken) {
      navigate(`/invite-signup?invite=${inviteToken}`);
    }
  }, [inviteToken, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await signIn(loginData.email, loginData.password);

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (signupData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const role = loginType === 'team' ? 'builder' : 'customer';
      
      await signUp(
        signupData.email,
        signupData.password,
        {
          full_name: signupData.fullName,
          role: role
        }
      );

      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to verify your account.",
      });
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

  const getLoginTypeInfo = () => {
    if (loginType === 'team') {
      return {
        title: 'Team Member Login',
        subtitle: 'Access the builder dashboard and management tools',
        icon: Building,
        color: 'bg-[#003562]'
      };
    }
    return {
      title: 'Client Portal Login',
      subtitle: 'Track your project progress and access documents',
      icon: Users,
      color: 'bg-blue-600'
    };
  };

  const typeInfo = getLoginTypeInfo();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center space-y-2 pb-4 sm:pb-6">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="flex items-center gap-1">
              <typeInfo.icon className="h-3 w-3" />
              {loginType === 'team' ? 'Team' : 'Client'}
            </Badge>
          </div>
          <typeInfo.icon className={`h-8 w-8 mx-auto ${typeInfo.color} text-white rounded-lg p-1.5`} />
          <CardTitle className="text-xl sm:text-2xl">{typeInfo.title}</CardTitle>
          <p className="text-sm text-gray-600">{typeInfo.subtitle}</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="login" className="text-sm">Login</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="h-10 sm:h-11"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="h-10 sm:h-11 pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full ${typeInfo.color} hover:${typeInfo.color}/90 h-10 sm:h-11 text-sm sm:text-base`}
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                    className="h-10 sm:h-11"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    className="h-10 sm:h-11"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      minLength={6}
                      className="h-10 sm:h-11 pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      className="h-10 sm:h-11 pr-10"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className={`w-full ${typeInfo.color} hover:${typeInfo.color}/90 h-10 sm:h-11 text-sm sm:text-base`}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate(`/login?type=${loginType === 'team' ? 'client' : 'team'}`)}
              className="text-xs text-gray-600"
            >
              Switch to {loginType === 'team' ? 'Client' : 'Team'} Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
