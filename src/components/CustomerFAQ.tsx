import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Search, Phone, Mail, MessageCircle } from "lucide-react";

const CustomerFAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      category: "Project Timeline",
      questions: [
        {
          id: "timeline-1",
          question: "How long does a typical barndominium take to build?",
          answer: "A standard barndominium typically takes 12 months to complete, with our target goal of 6 months for efficient projects. Timeline depends on size, complexity, weather conditions, and permit approval times. We provide detailed project schedules and regular updates throughout construction."
        },
        {
          id: "timeline-2", 
          question: "What factors can delay my project?",
          answer: "Common factors that may impact timeline include: weather conditions (especially for concrete and roofing work), permit approval delays, change orders, material delivery delays, and site preparation challenges. We work proactively to minimize delays and keep you informed of any schedule changes."
        },
        {
          id: "timeline-3",
          question: "Can I make changes once construction has started?",
          answer: "Yes, changes can be made through our change order process. However, changes may impact timeline and budget. Early changes are typically easier to accommodate than those requested during later construction phases. We'll provide clear timelines and cost impacts for any requested changes."
        }
      ]
    },
    {
      category: "Payment & Budget",
      questions: [
        {
          id: "payment-1",
          question: "What is your payment schedule?",
          answer: "Our standard payment schedule is: 20% down payment at contract signing, 30% when foundation is complete, 25% when framing and roof are complete, and 25% final payment upon project completion. This schedule helps manage cash flow while ensuring quality at each milestone."
        },
        {
          id: "payment-2",
          question: "What payment methods do you accept?",
          answer: "We accept cash, checks, bank transfers, and credit cards. For large payments, we recommend bank transfers or certified checks. Credit card payments may have processing fees for amounts over $5,000."
        },
        {
          id: "payment-3",
          question: "How do you handle cost overruns?",
          answer: "We provide detailed estimates and track costs closely throughout construction. Any significant cost changes require your approval through our change order process. We maintain transparent communication about budget status and work with you to manage costs effectively."
        }
      ]
    },
    {
      category: "Materials & Finishes",
      questions: [
        {
          id: "materials-1",
          question: "What's the difference between 26ga and 29ga metal?",
          answer: "26ga metal is thicker and more premium, offering superior durability, dent resistance, and a 40-year warranty. 29ga metal is thinner but still high-quality, with a 25-year warranty. Both options provide excellent weather protection and come in various colors."
        },
        {
          id: "materials-2",
          question: "Can I supply my own materials?",
          answer: "While we prefer to supply materials to ensure quality and warranty coverage, we can work with customer-supplied materials on a case-by-case basis. Please note that we cannot warranty customer-supplied materials, and it may affect our overall project warranty."
        },
        {
          id: "materials-3",
          question: "When do I need to make my design selections?",
          answer: "Design selections should be finalized before construction begins, typically within 2 weeks of contract signing. This ensures materials can be ordered in time and prevents construction delays. Our design team will guide you through the selection process."
        }
      ]
    },
    {
      category: "Permits & Compliance",
      questions: [
        {
          id: "permits-1",
          question: "Do you handle all permits and inspections?",
          answer: "Yes, we manage all required permits and coordinate inspections throughout the project. This includes building permits, electrical permits, plumbing permits, and any special permits required by your local jurisdiction. Permit costs are included in your project quote."
        },
        {
          id: "permits-2",
          question: "How long does permit approval take?",
          answer: "Permit approval times vary by jurisdiction but typically take 2-6 weeks. Rural areas may be faster while urban areas may take longer. We submit permits early in the process and work with local officials to expedite approvals when possible."
        },
        {
          id: "permits-3",
          question: "What if my project doesn't pass an inspection?",
          answer: "If an inspection doesn't pass, we immediately address the issues and schedule a re-inspection. Most inspection issues are minor and quickly resolved. We stand behind our work and ensure all inspections pass before proceeding to the next phase."
        }
      ]
    },
    {
      category: "Warranty & Support",
      questions: [
        {
          id: "warranty-1",
          question: "What does your warranty cover?",
          answer: "We provide a comprehensive 5-year workmanship warranty covering all construction and installation work. Materials have separate manufacturer warranties (26ga metal: 40 years, 29ga metal: 25 years, windows: 20 years). Our warranty covers defects in workmanship but excludes normal wear, weather damage, and customer modifications."
        },
        {
          id: "warranty-2",
          question: "How do I file a warranty claim?",
          answer: "To file a warranty claim, contact us at info@titanbuildings.com or call (302) 722-6327. Provide photos of the issue, your project details, and a description of the problem. Most warranty issues are addressed within 48-72 hours of notification."
        },
        {
          id: "warranty-3",
          question: "What maintenance is required to keep my warranty valid?",
          answer: "Regular maintenance includes cleaning gutters, checking for loose fasteners, touching up paint scratches, and maintaining proper drainage around the building. We provide a maintenance guide with your completed project. Proper maintenance ensures warranty coverage and extends building life."
        }
      ]
    },
    {
      category: "Communication & Updates",
      questions: [
        {
          id: "communication-1",
          question: "How often will I receive project updates?",
          answer: "We provide weekly progress updates via email and our customer portal. You'll also receive notifications at each major milestone completion and before any scheduled inspections. Your project manager is available for questions throughout the process."
        },
        {
          id: "communication-2",
          question: "Can I visit the job site during construction?",
          answer: "Yes, we welcome customer visits! For safety, please coordinate visits with your project manager and always wear appropriate safety gear (hard hat, closed-toe shoes). We also provide scheduled walkthroughs at key milestones."
        },
        {
          id: "communication-3",
          question: "Who is my main point of contact?",
          answer: "You'll be assigned a dedicated project manager who serves as your primary contact throughout construction. They coordinate all aspects of your project and are available to answer questions, provide updates, and address any concerns."
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Frequently Asked Questions
          </CardTitle>
          <p className="text-muted-foreground">
            Find answers to common questions about your barndominium project
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      {filteredFAQs.map((category) => (
        <Card key={category.category}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {category.category}
              <Badge variant="secondary">{category.questions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {category.questions.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}

      {filteredFAQs.length === 0 && searchTerm && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No questions found matching "{searchTerm}"</p>
            <p className="text-sm text-muted-foreground">
              Try different keywords or contact us directly for assistance.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Still Have Questions?</CardTitle>
          <p className="text-muted-foreground">
            Our team is here to help with any questions not covered above
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Call Us</h4>
              <p className="text-sm text-muted-foreground mb-2">Mon-Fri: 8AM-5PM</p>
              <p className="text-sm font-medium">(555) 123-4567</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Email Support</h4>
              <p className="text-sm text-muted-foreground mb-2">Response within 24 hours</p>
              <p className="text-sm font-medium">support@titanbuildings.com</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Project Messages</h4>
              <p className="text-sm text-muted-foreground mb-2">Direct to your project manager</p>
              <p className="text-sm font-medium">Use Messages tab above</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerFAQ;