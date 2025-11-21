
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, MessageSquare, Smartphone, Eye, Shield, Users, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Eye,
      title: "Real-Time Project Updates",
      description: "See exactly where your project stands with live progress updates and photo documentation"
    },
    {
      icon: Calendar,
      title: "Track Your Timeline",
      description: "View your project schedule, upcoming milestones, and estimated completion dates"
    },
    {
      icon: FileText,
      title: "Access All Documents",
      description: "Download contracts, permits, plans, and invoices anytime from your secure portal"
    },
    {
      icon: MessageSquare,
      title: "Direct Communication",
      description: "Message your project team directly and get instant notifications on important updates"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your project information is protected with bank-level security and encryption"
    },
    {
      icon: Smartphone,
      title: "Mobile Access",
      description: "Check your project status on-the-go from any device, anywhere, anytime"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/f96a4cb4-93ac-4358-83c6-a6ccdd7526dd.png" 
                alt="Titan Buildings" 
                className="h-8 sm:h-10 lg:h-12 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Welcome to Your
            <span className="text-[#003562] block">Customer Portal</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            As a valued Titan Buildings customer, you now have exclusive access to track your project's progress, 
            communicate with your team, and access all your important documents in one secure location.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/login?type=client")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg"
            >
              <Users className="h-5 w-5 mr-2" />
              Access Client Portal
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/login?type=team")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg"
            >
              <Building className="h-5 w-5 mr-2" />
              Team Member Login
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="container mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4">Why Use Your Customer Portal?</h2>
          <p className="text-gray-600 text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Your portal puts you in control of your building experience. Stay informed, engaged, and confident throughout your project.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3 sm:pb-4">
                  <benefit.icon className="h-8 w-8 sm:h-10 sm:w-10 text-[#003562] mb-2" />
                  <CardTitle className="text-lg sm:text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm sm:text-base leading-relaxed">{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You'll Find Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Everything You Need in One Place</h2>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#003562] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">Project Dashboard</h3>
                    <p className="text-gray-600 text-sm sm:text-base">See your project's current phase, completion percentage, and next steps</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#003562] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">Photo Gallery</h3>
                    <p className="text-gray-600 text-sm sm:text-base">View progress photos and documentation as your project develops</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#003562] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">Document Library</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Access contracts, permits, invoices, and all project documentation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#003562] rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">Communication Hub</h3>
                    <p className="text-gray-600 text-sm sm:text-base">Direct messaging with your project team and instant notifications</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
                <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Your account has been set up and you should have received login credentials via email. 
                  If you haven't received them or need assistance, please contact us.
                </p>
                <Button 
                  onClick={() => navigate("/login?type=client")} 
                  className="w-full py-3 text-base mb-3"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Login to Client Portal
                </Button>
                <Button 
                  onClick={() => navigate("/login?type=team")} 
                  variant="outline"
                  className="w-full py-3 text-base"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Team Member Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-[#003562] text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Stay Connected to Your Project</h2>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-3xl mx-auto">
            Don't miss a single update. Access your customer portal today and experience the Titan Buildings difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate("/login?type=client")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg"
            >
              <Users className="h-5 w-5 mr-2" />
              Access Client Portal Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/login?type=team")}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg border-white text-white hover:bg-white hover:text-[#003562]"
            >
              <Building className="h-5 w-5 mr-2" />
              Team Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-3 sm:mb-4">
            <img 
              src="/lovable-uploads/f96a4cb4-93ac-4358-83c6-a6ccdd7526dd.png" 
              alt="Titan Buildings" 
              className="h-6 sm:h-8 w-auto filter brightness-0 invert"
            />
          </div>
          <p className="text-gray-400 text-sm sm:text-base">Building Excellence, One Project at a Time</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
