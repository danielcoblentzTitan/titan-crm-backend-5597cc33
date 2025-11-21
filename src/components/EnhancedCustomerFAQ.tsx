import React, { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";
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
}

export const EnhancedCustomerFAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [relatedQuestions, setRelatedQuestions] = useState<Record<string, FAQItem[]>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      const { data: faqs, error } = await supabase
        .from('faq_items')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('question', { ascending: true });

      if (error) throw error;

      setFaqItems(faqs || []);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(faqs?.map(faq => faq.category) || []));
      setCategories(uniqueCategories);

      // Fetch related questions for each FAQ
      const relatedQuestionsMap: Record<string, FAQItem[]> = {};
      for (const faq of faqs || []) {
        if (faq.related_ids && faq.related_ids.length > 0) {
          const { data: related } = await supabase
            .from('faq_items')
            .select('*')
            .in('id', faq.related_ids)
            .eq('is_active', true)
            .limit(3);
          
          if (related) {
            relatedQuestionsMap[faq.id] = related;
          }
        }
      }
      setRelatedQuestions(relatedQuestionsMap);
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

  const handleFeedback = async (faqId: string, isHelpful: boolean) => {
    try {
      const column = isHelpful ? 'feedback_helpful' : 'feedback_not_helpful';
      
      // Get current count
      const { data: currentFaq } = await supabase
        .from('faq_items')
        .select(column)
        .eq('id', faqId)
        .single();

      if (currentFaq) {
        const newCount = (currentFaq[column] || 0) + 1;
        await supabase
          .from('faq_items')
          .update({ [column]: newCount })
          .eq('id', faqId);

        toast({
          title: "Thank you!",
          description: "Your feedback helps us improve our FAQs.",
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredFAQ = faqItems.filter(item => {
    const matchesSearch = !searchTerm || 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bot_short_answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bot_long_answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group filtered FAQs by category
  const groupedFAQs = filteredFAQ.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading FAQ...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions, answers, and keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
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

      {/* FAQ Content */}
      <div className="max-h-96 overflow-y-auto space-y-6">
        {Object.entries(groupedFAQs).map(([category, items]) => (
          <div key={category} className="space-y-4">
            <h3 className="font-semibold text-primary text-lg">{category}</h3>
            
            <div className="space-y-3">
              {items.map((faq) => (
                <div key={faq.id} className="border rounded-lg p-4 space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">{faq.question}</h4>
                    <p className="text-muted-foreground text-sm">{faq.bot_short_answer}</p>
                  </div>

                  {/* Show more/less for long answer */}
                  {faq.bot_long_answer && (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(faq.id)}
                        className="p-0 h-auto text-primary hover:text-primary/80"
                      >
                        {expandedItems.has(faq.id) ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Tell me more
                          </>
                        )}
                      </Button>
                      
                      {expandedItems.has(faq.id) && (
                        <div className="space-y-3 pt-2 border-t">
                          <p className="text-muted-foreground text-sm">{faq.bot_long_answer}</p>
                          
                          {/* Related Questions */}
                          {relatedQuestions[faq.id] && relatedQuestions[faq.id].length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-sm">Related Questions:</h5>
                              <div className="space-y-1">
                                {relatedQuestions[faq.id].map((related) => (
                                  <button
                                    key={related.id}
                                    className="text-primary hover:text-primary/80 text-sm block text-left"
                                    onClick={() => {
                                      setSearchTerm(related.question);
                                      setSelectedCategory("all");
                                    }}
                                  >
                                    • {related.question}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Feedback buttons */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Was this helpful?</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(faq.id, true)}
                        className="h-8 w-8 p-0"
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeedback(faq.id, false)}
                        className="h-8 w-8 p-0"
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFAQ.length === 0 && !loading && (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground">No FAQ items found matching your criteria.</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search terms or category filter.</p>
        </div>
      )}
    </div>
  );
};