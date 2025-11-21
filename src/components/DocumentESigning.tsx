import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { FileText, PenTool, Clock, CheckCircle, Download, Eye, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentESigningProps {
  projectId: string;
  customerName: string;
}

interface SignableDocument {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'signed' | 'expired';
  dueDate: string;
  signedDate?: string;
  documentUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

const DocumentESigning = ({ projectId, customerName }: DocumentESigningProps) => {
  const [documents, setDocuments] = useState<SignableDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSignableDocuments();
  }, [projectId]);

  const loadSignableDocuments = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - in real implementation, this would come from your database
      const mockDocuments: SignableDocument[] = [
        {
          id: '1',
          title: 'Construction Contract',
          description: 'Main construction agreement outlining scope, timeline, and terms',
          status: 'signed',
          dueDate: '2024-01-15',
          signedDate: '2024-01-12',
          priority: 'high'
        },
        {
          id: '2', 
          title: 'Change Order #001',
          description: 'Addition of covered patio and electrical outlets',
          status: 'pending',
          dueDate: '2024-01-20',
          priority: 'high'
        },
        {
          id: '3',
          title: 'Material Selection Approval',
          description: 'Final approval of selected materials and finishes',
          status: 'pending',
          dueDate: '2024-01-25',
          priority: 'medium'
        },
        {
          id: '4',
          title: 'Final Inspection Waiver',
          description: 'Customer acknowledgment of project completion',
          status: 'pending',
          dueDate: '2024-03-01',
          priority: 'low'
        }
      ];

      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error loading signable documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents for signing",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async (documentId: string) => {
    try {
      // In a real implementation, this would integrate with DocuSign, HelloSign, or similar
      toast({
        title: "Opening Document",
        description: "Redirecting to secure signing platform...",
      });
      
      // Mock signing process
      setTimeout(() => {
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'signed' as const, signedDate: new Date().toISOString() }
            : doc
        ));
        
        toast({
          title: "Document Signed",
          description: "Thank you! The document has been successfully signed.",
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error signing document:', error);
      toast({
        title: "Error",
        description: "Failed to process document signing",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string, priority: string) => {
    if (status === 'signed') return 'bg-green-100 text-green-800';
    if (status === 'expired') return 'bg-red-100 text-red-800';
    if (priority === 'high') return 'bg-orange-100 text-orange-800';
    if (priority === 'medium') return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-orange-600" />;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'High Priority';
      case 'medium': return 'Medium Priority';
      case 'low': return 'Low Priority';
      default: return 'Normal';
    }
  };

  const getCompletionPercentage = () => {
    const signed = documents.filter(doc => doc.status === 'signed').length;
    return documents.length > 0 ? Math.round((signed / documents.length) * 100) : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-6 w-6 text-primary" />
            Document Signing Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {documents.filter(doc => doc.status === 'signed').length} of {documents.length} completed
              </span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {documents.filter(doc => doc.status === 'signed').length}
                </div>
                <div className="text-xs text-green-600">Signed</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {documents.filter(doc => doc.status === 'pending').length}
                </div>
                <div className="text-xs text-orange-600">Pending</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {documents.filter(doc => doc.status === 'expired').length}
                </div>
                <div className="text-xs text-red-600">Expired</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((document, index) => (
          <Card key={document.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {getStatusIcon(document.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{document.title}</h4>
                      <Badge className={getStatusColor(document.status, document.priority)}>
                        {document.status === 'signed' ? 'Signed' : getPriorityText(document.priority)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{document.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">Due: </span>
                        <span>{new Date(document.dueDate).toLocaleDateString()}</span>
                      </div>
                      {document.signedDate && (
                        <div>
                          <span className="font-medium">Signed: </span>
                          <span>{new Date(document.signedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {document.documentUrl && (
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  )}
                  
                  {document.status === 'signed' ? (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => handleSign(document.id)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      Sign Now
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {documents.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">No documents available for signing at this time.</p>
          </CardContent>
        </Card>
      )}

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>All documents are legally binding once signed electronically</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>You'll receive email confirmations for all signed documents</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>High priority documents may delay project progress if not signed by due date</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>Questions about any document? Contact your project manager</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentESigning;