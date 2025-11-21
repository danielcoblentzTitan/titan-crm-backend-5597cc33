import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedCustomerFAQ } from "./EnhancedCustomerFAQ";
import { CustomerAIChatbot } from "./CustomerAIChatbot";

interface CustomerSupportTabProps {
  projectId: string;
  customerName?: string;
}

export const CustomerSupportTab = ({ projectId, customerName }: CustomerSupportTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* FAQ Section */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Frequently Asked Questions</span>
          </CardTitle>
          <CardDescription>
            Find answers to common questions about your building project
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <EnhancedCustomerFAQ />
        </CardContent>
      </Card>

      {/* AI Chat Section */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>AI Assistant</span>
          </CardTitle>
          <CardDescription>
            Chat with our AI assistant for instant answers about your project
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <CustomerAIChatbot projectId={projectId} customerName={customerName} />
        </CardContent>
      </Card>
    </div>
  );
};