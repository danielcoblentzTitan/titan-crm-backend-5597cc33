
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CustomerPortalHeader = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/f96a4cb4-93ac-4358-83c6-a6ccdd7526dd.png" 
              alt="Titan Buildings" 
              className="h-6 sm:h-8 w-auto"
            />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-xs sm:text-sm"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="w-full text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default CustomerPortalHeader;
