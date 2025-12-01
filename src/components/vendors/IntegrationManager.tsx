import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle, Link, Settings, RefreshCw, Globe, Zap, Database, Cloud } from "lucide-react";

export const IntegrationManager = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: "quickbooks",
      name: "QuickBooks",
      description: "Sync financial data and invoicing",
      status: "disconnected",
      lastSync: null,
      icon: Database
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Payment processing and financial tracking",
      status: "disconnected",
      lastSync: null,
      icon: Zap
    },
    {
      id: "gsuite",
      name: "Google Workspace",
      description: "Email integration and document sync",
      status: "disconnected",
      lastSync: null,
      icon: Globe
    },
    {
      id: "dropbox",
      name: "Dropbox",
      description: "Document storage and sharing",
      status: "disconnected",
      lastSync: null,
      icon: Cloud
    }
  ]);

  const [apiKeys, setApiKeys] = useState({
    quickbooks: "",
    stripe: "",
    gsuite: "",
    dropbox: ""
  });

  const [webhooks, setWebhooks] = useState([
    {
      id: "vendor-updates",
      name: "Vendor Profile Updates",
      url: "",
      status: "inactive",
      events: ["vendor.created", "vendor.updated", "vendor.deleted"]
    },
    {
      id: "invoice-notifications",
      name: "Invoice Notifications",
      url: "",
      status: "inactive",
      events: ["invoice.created", "invoice.paid", "invoice.overdue"]
    }
  ]);

  const handleSyncIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, lastSync: new Date().toLocaleString() }
        : integration
    ));
  };

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { 
            ...integration, 
            status: integration.status === "connected" ? "disconnected" : "connected",
            lastSync: integration.status === "disconnected" ? new Date().toLocaleString() : integration.lastSync
          }
        : integration
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Link className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Integration Manager</h1>
          <p className="text-muted-foreground">Connect and manage external services</p>
        </div>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="data-sync">Data Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4">
            {integrations.map((integration) => {
              const IconComponent = integration.icon;
              return (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">{integration.description}</p>
                          {integration.lastSync && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last sync: {integration.lastSync}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant={integration.status === "connected" ? "default" : "secondary"}
                          className="flex items-center space-x-1"
                        >
                          {integration.status === "connected" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          <span>{integration.status === "connected" ? "Connected" : "Disconnected"}</span>
                        </Badge>
                        {integration.status === "connected" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSyncIntegration(integration.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync
                          </Button>
                        )}
                        <Switch
                          checked={integration.status === "connected"}
                          onCheckedChange={() => handleToggleIntegration(integration.id)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(apiKeys).map(([service, key]) => (
              <Card key={service}>
                <CardHeader>
                  <CardTitle className="capitalize">{service} API Key</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${service}-key`}>API Key</Label>
                    <Input
                      id={`${service}-key`}
                      type="password"
                      value={key}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [service]: e.target.value }))}
                      placeholder="Enter API key..."
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    Test Connection
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
              <Button variant="outline">Add Webhook</Button>
            </div>
            <div className="grid gap-4">
              {webhooks.map((webhook) => (
                <Card key={webhook.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium">{webhook.name}</h4>
                        <p className="text-sm text-muted-foreground font-mono">{webhook.url}</p>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={webhook.status === "active" ? "default" : "secondary"}>
                          {webhook.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data-sync" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Automatic Sync Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sync Vendor Profiles</Label>
                    <p className="text-sm text-muted-foreground">Automatically sync vendor data with QuickBooks</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sync Financial Data</Label>
                    <p className="text-sm text-muted-foreground">Sync invoices and payments with accounting system</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sync Documents</Label>
                    <p className="text-sm text-muted-foreground">Sync documents with cloud storage</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No sync history available. Configure integrations above to begin tracking sync activities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};