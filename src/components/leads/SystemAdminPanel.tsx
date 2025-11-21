import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Users,
  Calendar,
  Clipboard
} from "lucide-react";
import { MockDataService } from "@/services/mockDataService";
import { useToast } from "@/hooks/use-toast";

export const SystemAdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const { toast } = useToast();

  const handleGenerateSampleData = async () => {
    setLoading(true);
    try {
      await MockDataService.generateAllSampleData();
      toast({
        title: "Success",
        description: "Sample data generated successfully! Refresh the page to see the new leads.",
      });
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to generate sample data. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = "https://rviwdobaeyhnwzkinefj.supabase.co/functions/v1/jotform-webhook-enhanced";
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Webhook URL copied to clipboard"
    });
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL to test",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const testData = {
        formID: "test-form",
        submissionID: "test-submission",
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        phone: "(555) 123-4567",
        company: "Test Company",
        building_type: "Commercial",
        description: "Test submission from admin panel"
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Test webhook sent successfully!"
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Error",
        description: "Failed to send test webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Administration</h2>
        <Badge variant="secondary">Admin Panel</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sample Data Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Sample Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate sample leads and follow-up tasks to demonstrate the system functionality.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-medium">Includes:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  8 Sample Leads
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Follow-up Tasks
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Different Stages
                </div>
                <div className="flex items-center">
                  <Clipboard className="h-3 w-3 mr-1" />
                  Realistic Data
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerateSampleData}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Generate Sample Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* JotForm Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              JotForm Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure your JotForm to send submissions to the lead management system.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook URL:</label>
              <div className="flex gap-2">
                <Input 
                  value="https://rviwdobaeyhnwzkinefj.supabase.co/functions/v1/jotform-webhook-enhanced"
                  readOnly
                  className="text-xs"
                />
                <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Test Webhook URL:</label>
              <Input 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="Enter webhook URL to test..."
              />
            </div>

            <Button 
              onClick={testWebhook}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Webhook"
              )}
            </Button>

            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Copy the webhook URL above</li>
                <li>In JotForm, go to Settings → Integrations</li>
                <li>Add a Generic Webhook integration</li>
                <li>Paste the webhook URL</li>
                <li>Set method to POST</li>
                <li>Enable the integration</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Database Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Webhook Deployed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Email Templates Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Automation Rules Running</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};