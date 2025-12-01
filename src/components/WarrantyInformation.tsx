import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock, CheckCircle, FileText, Phone, Mail } from "lucide-react";

const WarrantyInformation = () => {
  const warrantyItems = [
    {
      category: "Metal Roofing & Siding",
      items: [
        {
          name: "26 Gauge Metal",
          coverage: "40 years",
          description: "Premium grade steel with superior corrosion resistance and paint warranty",
          details: "Covers fade, chalk, peel, and film integrity. Substrate warranty included."
        },
        {
          name: "29 Gauge Metal", 
          coverage: "25 years",
          description: "High-quality steel with excellent durability and paint warranty",
          details: "Covers fade, chalk, peel, and film integrity. Substrate warranty included."
        }
      ]
    },
    {
      category: "Garage Doors & Hardware",
      items: [
        {
          name: "Overhead Garage Doors",
          coverage: "10 years",
          description: "Complete door assembly including panels, tracks, springs, and hardware",
          details: "Covers manufacturing defects, spring tension, track alignment, and hardware failure."
        },
        {
          name: "Garage Door Openers",
          coverage: "5 years",
          description: "Motor, electronics, and remote controls",
          details: "Covers motor failure, electronic components, and safety features."
        }
      ]
    },
    {
      category: "Windows & Doors",
      items: [
        {
          name: "Window Units",
          coverage: "20 years",
          description: "Complete window assembly including frame, glass, and hardware",
          details: "Covers seal failure, hardware defects, and frame warpage. Glass breakage not included."
        },
        {
          name: "Entry Doors",
          coverage: "5 years",
          description: "Door slab, frame, and hardware",
          details: "Covers warpage, hardware failure, and weatherstrip integrity."
        }
      ]
    },
    {
      category: "Workmanship",
      items: [
        {
          name: "Construction Workmanship",
          coverage: "5 years",
          description: "All labor and installation work performed by Titan Buildings",
          details: "Covers defects in installation, assembly, and construction workmanship. Material defects covered under manufacturer warranties."
        },
        {
          name: "Foundation & Concrete",
          coverage: "2 years",
          description: "Concrete slab, footings, and foundation work",
          details: "Covers cracking, settling, and workmanship defects. Normal settling and minor surface cracks excluded."
        }
      ]
    },
    {
      category: "Additional Coverage",
      items: [
        {
          name: "Electrical Systems",
          coverage: "2 years",
          description: "All electrical work and components",
          details: "Covers wiring, outlets, switches, and electrical panels. Light bulbs and user damage excluded."
        },
        {
          name: "Plumbing Systems",
          coverage: "2 years", 
          description: "Rough plumbing and fixtures",
          details: "Covers pipe leaks, fixture defects, and installation issues. Clogs and user damage excluded."
        },
        {
          name: "HVAC Systems",
          coverage: "1 year",
          description: "Installation warranty on HVAC systems",
          details: "Covers installation defects and ductwork. Equipment covered under manufacturer warranty."
        }
      ]
    }
  ];

  const importantNotes = [
    "Warranty begins on the date of substantial completion",
    "All warranties are transferable to new owners with proper documentation",
    "Regular maintenance is required to maintain warranty coverage",
    "Damage from acts of nature, abuse, or normal wear excluded",
    "Warranty claims must be reported within 30 days of discovery",
    "Titan Buildings reserves the right to repair or replace at our discretion"
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Warranty Coverage Overview
          </CardTitle>
          <p className="text-muted-foreground">
            Comprehensive warranty protection for your investment
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-sm text-muted-foreground">Years Workmanship</div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">40</div>
              <div className="text-sm text-muted-foreground">Years Metal (26ga)</div>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">20</div>
              <div className="text-sm text-muted-foreground">Years Windows</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {warrantyItems.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="text-lg">{category.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {category.items.map((item, index) => (
                <div key={item.name}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.coverage}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{item.details}</p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600 mt-1 ml-4" />
                  </div>
                  {index < category.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Important Warranty Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {importantNotes.map((note, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <p className="text-sm text-muted-foreground">{note}</p>
              </div>
            ))}
          </div>
          
          <Separator className="my-6" />
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Warranty Claims & Support
            </h4>
            <div className="space-y-2 text-sm">
              <p>To file a warranty claim or get support:</p>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>(302) 722-6327</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span>info@titanbuildings.com</span>
              </div>
              <p className="text-muted-foreground mt-2">
                Have your project details and photos of the issue ready when contacting us.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarrantyInformation;