import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FAQItem {
  id: string;
  question: string;
  bot_short_answer: string;
  bot_long_answer?: string;
  category: string;
  keywords: string[];
  related_ids: string[];
  escalation_hint?: string;
  is_active: boolean;
  feedback_helpful: number;
  feedback_not_helpful: number;
}

interface FAQFormData {
  question: string;
  bot_short_answer: string;
  bot_long_answer: string;
  category: string;
  keywords: string;
  escalation_hint: string;
  is_active: boolean;
}

export const FAQManagement = () => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FAQFormData>({
    question: "",
    bot_short_answer: "",
    bot_long_answer: "",
    category: "",
    keywords: "",
    escalation_hint: "",
    is_active: true,
  });

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      const { data: faqs, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('category', { ascending: true })
        .order('question', { ascending: true });

      if (error) throw error;

      setFaqItems(faqs || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(faqs?.map(faq => faq.category) || []));
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
      toast({
        title: "Error",
        description: "Failed to load FAQ data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.bot_short_answer.trim() || !formData.category.trim()) {
      toast({
        title: "Validation Error",
        description: "Question, short answer, and category are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);

      const faqData = {
        question: formData.question.trim(),
        bot_short_answer: formData.bot_short_answer.trim(),
        bot_long_answer: formData.bot_long_answer.trim() || null,
        category: formData.category.trim(),
        keywords,
        escalation_hint: formData.escalation_hint.trim() || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString().split('T')[0],
      };

      if (editingId) {
        // Update existing FAQ
        const { error } = await supabase
          .from('faq_items')
          .update(faqData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "FAQ item updated successfully.",
        });
      } else {
        // Create new FAQ
        const { error } = await supabase
          .from('faq_items')
          .insert([faqData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "FAQ item created successfully.",
        });
      }

      // Reset form and refresh data
      resetForm();
      fetchFAQData();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to save FAQ item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setFormData({
      question: faq.question,
      bot_short_answer: faq.bot_short_answer,
      bot_long_answer: faq.bot_long_answer || "",
      category: faq.category,
      keywords: faq.keywords.join(', '),
      escalation_hint: faq.escalation_hint || "",
      is_active: faq.is_active,
    });
    setEditingId(faq.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ item?")) return;

    try {
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "FAQ item deleted successfully.",
      });
      
      fetchFAQData();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      bot_short_answer: "",
      bot_long_answer: "",
      category: "",
      keywords: "",
      escalation_hint: "",
      is_active: true,
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bot_short_answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading FAQ management...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FAQ Management</h2>
          <p className="text-muted-foreground">Manage frequently asked questions for the AI bot and customer portal</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions, answers, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredFAQs.length} of {faqItems.length} FAQ items
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit FAQ Item' : 'Add New FAQ Item'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update the FAQ item details below' : 'Create a new FAQ item for the knowledge base'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question *</Label>
                  <Input
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the customer question"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Framing & Structure"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot_short_answer">Short Answer *</Label>
                <Textarea
                  id="bot_short_answer"
                  value={formData.bot_short_answer}
                  onChange={(e) => setFormData({ ...formData, bot_short_answer: e.target.value })}
                  placeholder="Brief answer for immediate response"
                  className="min-h-20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot_long_answer">Detailed Answer</Label>
                <Textarea
                  id="bot_long_answer"
                  value={formData.bot_long_answer}
                  onChange={(e) => setFormData({ ...formData, bot_long_answer: e.target.value })}
                  placeholder="Detailed explanation (optional)"
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="escalation_hint">Escalation Hint</Label>
                  <Input
                    id="escalation_hint"
                    value={formData.escalation_hint}
                    onChange={(e) => setFormData({ ...formData, escalation_hint: e.target.value })}
                    placeholder="When to escalate to PM"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update FAQ' : 'Create FAQ'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* FAQ Items List */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <Card key={faq.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{faq.category}</Badge>
                      {!faq.is_active && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.bot_short_answer}</p>
                    {faq.bot_long_answer && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-primary">View detailed answer</summary>
                        <p className="mt-2 text-muted-foreground">{faq.bot_long_answer}</p>
                      </details>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(faq)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Keywords and feedback stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Keywords:</span>
                    <div className="flex gap-1">
                      {faq.keywords.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>👍 {faq.feedback_helpful}</span>
                    <span>👎 {faq.feedback_not_helpful}</span>
                  </div>
                </div>

                {faq.escalation_hint && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    <strong>Escalation:</strong> {faq.escalation_hint}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No FAQ items found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};