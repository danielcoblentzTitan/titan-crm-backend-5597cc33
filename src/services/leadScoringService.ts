import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./supabaseService";

export interface LeadScore {
  id: string;
  lead_id: string;
  total_score: number;
  demographic_score: number;
  behavioral_score: number;
  engagement_score: number;
  qualification_score: number;
  last_calculated: string;
  score_breakdown: {
    factors: Array<{
      factor: string;
      points: number;
      reason: string;
    }>;
  };
}

export interface ScoringCriteria {
  demographic: {
    hasEmail: number;
    hasPhone: number;
    hasAddress: number;
    hasCompany: number;
    estimatedValueRange: { [key: string]: number };
    buildingTypePreference: { [key: string]: number };
  };
  behavioral: {
    responseSpeed: { [key: string]: number };
    followUpCompliance: number;
    documentRequests: number;
    estimateRequests: number;
  };
  engagement: {
    emailOpens: number;
    emailClicks: number;
    websiteVisits: number;
    socialMediaInteraction: number;
  };
  qualification: {
    budgetConfirmed: number;
    timelineConfirmed: number;
    decisionMakerContact: number;
    competitorMentioned: number;
  };
}

const DEFAULT_SCORING_CRITERIA: ScoringCriteria = {
  demographic: {
    hasEmail: 10,
    hasPhone: 15,
    hasAddress: 20,
    hasCompany: 10,
    estimatedValueRange: {
      'under_50k': 5,
      '50k_100k': 15,
      '100k_200k': 25,
      '200k_plus': 35
    },
    buildingTypePreference: {
      'Residential': 10,
      'Commercial': 20,
      'Barndominium': 15
    }
  },
  behavioral: {
    responseSpeed: {
      'immediate': 25,
      'same_day': 20,
      'next_day': 15,
      'week': 10,
      'slow': 5
    },
    followUpCompliance: 15,
    documentRequests: 10,
    estimateRequests: 20
  },
  engagement: {
    emailOpens: 5,
    emailClicks: 10,
    websiteVisits: 8,
    socialMediaInteraction: 5
  },
  qualification: {
    budgetConfirmed: 30,
    timelineConfirmed: 25,
    decisionMakerContact: 20,
    competitorMentioned: -10
  }
};

export class LeadScoringService {
  // Calculate comprehensive lead score
  static async calculateLeadScore(lead: Lead): Promise<LeadScore> {
    const demographicScore = this.calculateDemographicScore(lead);
    const behavioralScore = await this.calculateBehavioralScore(lead);
    const engagementScore = await this.calculateEngagementScore(lead);
    const qualificationScore = await this.calculateQualificationScore(lead);

    const totalScore = demographicScore + behavioralScore + engagementScore + qualificationScore;

    const scoreBreakdown = {
      factors: [
        { factor: 'Demographics', points: demographicScore, reason: 'Contact completeness and value potential' },
        { factor: 'Behavior', points: behavioralScore, reason: 'Response patterns and interaction quality' },
        { factor: 'Engagement', points: engagementScore, reason: 'Digital engagement and interest level' },
        { factor: 'Qualification', points: qualificationScore, reason: 'Budget, timeline, and decision authority' }
      ]
    };

    const leadScore: LeadScore = {
      id: `score_${lead.id}`,
      lead_id: lead.id,
      total_score: Math.max(0, Math.min(100, totalScore)),
      demographic_score: demographicScore,
      behavioral_score: behavioralScore,
      engagement_score: engagementScore,
      qualification_score: qualificationScore,
      last_calculated: new Date().toISOString(),
      score_breakdown: scoreBreakdown
    };

    // Store the score in database
    await this.saveLeadScore(leadScore);
    
    return leadScore;
  }

  // Calculate demographic score based on lead data completeness and value
  private static calculateDemographicScore(lead: Lead): number {
    const criteria = DEFAULT_SCORING_CRITERIA.demographic;
    let score = 0;

    // Contact completeness
    if (lead.email) score += criteria.hasEmail;
    if (lead.phone) score += criteria.hasPhone;
    if (lead.address) score += criteria.hasAddress;
    if (lead.company) score += criteria.hasCompany;

    // Estimated value scoring
    const estimatedValue = lead.estimated_value || 0;
    if (estimatedValue >= 200000) {
      score += criteria.estimatedValueRange['200k_plus'];
    } else if (estimatedValue >= 100000) {
      score += criteria.estimatedValueRange['100k_200k'];
    } else if (estimatedValue >= 50000) {
      score += criteria.estimatedValueRange['50k_100k'];
    } else if (estimatedValue > 0) {
      score += criteria.estimatedValueRange['under_50k'];
    }

    // Building type preference
    if (lead.building_type && criteria.buildingTypePreference[lead.building_type]) {
      score += criteria.buildingTypePreference[lead.building_type];
    }

    return score;
  }

  // Calculate behavioral score based on interaction patterns
  private static async calculateBehavioralScore(lead: Lead): Promise<number> {
    const criteria = DEFAULT_SCORING_CRITERIA.behavioral;
    let score = 0;

    // Get lead activities to analyze behavior
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false });

    if (activities && activities.length > 0) {
      // Response speed analysis
      const responseActivities = activities.filter(a => a.activity_type === 'call' || a.activity_type === 'email_reply');
      if (responseActivities.length > 0) {
        const avgResponseTime = this.calculateAverageResponseTime(responseActivities);
        if (avgResponseTime <= 1) score += criteria.responseSpeed.immediate;
        else if (avgResponseTime <= 24) score += criteria.responseSpeed.same_day;
        else if (avgResponseTime <= 48) score += criteria.responseSpeed.next_day;
        else if (avgResponseTime <= 168) score += criteria.responseSpeed.week;
        else score += criteria.responseSpeed.slow;
      }

      // Document and estimate requests
      const documentRequests = activities.filter(a => a.activity_type === 'document_request').length;
      const estimateRequests = activities.filter(a => a.activity_type === 'estimate_request').length;
      
      score += documentRequests * criteria.documentRequests;
      score += estimateRequests * criteria.estimateRequests;
    }

    return score;
  }

  // Calculate engagement score based on digital interactions
  private static async calculateEngagementScore(lead: Lead): Promise<number> {
    // This would integrate with email tracking, website analytics, etc.
    // For now, return a baseline score
    return Math.floor(Math.random() * 20) + 10; // Placeholder implementation
  }

  // Calculate qualification score based on qualification criteria
  private static async calculateQualificationScore(lead: Lead): Promise<number> {
    const criteria = DEFAULT_SCORING_CRITERIA.qualification;
    let score = 0;

    // Check notes for qualification indicators
    const notes = lead.notes?.toLowerCase() || '';
    
    if (notes.includes('budget confirmed') || notes.includes('budget approved')) {
      score += criteria.budgetConfirmed;
    }
    
    if (notes.includes('timeline confirmed') || notes.includes('start date')) {
      score += criteria.timelineConfirmed;
    }
    
    if (notes.includes('decision maker') || notes.includes('owner') || notes.includes('ceo')) {
      score += criteria.decisionMakerContact;
    }
    
    if (notes.includes('competitor') || notes.includes('comparing')) {
      score += criteria.competitorMentioned;
    }

    return score;
  }

  // Helper method to calculate average response time
  private static calculateAverageResponseTime(activities: any[]): number {
    if (activities.length < 2) return 0;
    
    let totalHours = 0;
    let count = 0;
    
    for (let i = 0; i < activities.length - 1; i++) {
      const current = new Date(activities[i].created_at);
      const next = new Date(activities[i + 1].created_at);
      const diffHours = Math.abs(current.getTime() - next.getTime()) / (1000 * 60 * 60);
      
      totalHours += diffHours;
      count++;
    }
    
    return totalHours / count;
  }

  // Save lead score to database
  private static async saveLeadScore(leadScore: LeadScore): Promise<void> {
    // In a real implementation, this would save to a lead_scores table
    console.log('Lead score calculated:', leadScore);
  }

  // Get lead score from database
  static async getLeadScore(leadId: string): Promise<LeadScore | null> {
    // Placeholder - would query from database
    return null;
  }

  // Batch calculate scores for multiple leads
  static async batchCalculateScores(leads: Lead[]): Promise<LeadScore[]> {
    const scores = [];
    
    for (const lead of leads) {
      try {
        const score = await this.calculateLeadScore(lead);
        scores.push(score);
      } catch (error) {
        console.error(`Error calculating score for lead ${lead.id}:`, error);
      }
    }
    
    return scores;
  }

  // Get score interpretation
  static getScoreInterpretation(score: number): {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    label: string;
    color: string;
    description: string;
  } {
    if (score >= 80) {
      return {
        grade: 'A',
        label: 'Hot Lead',
        color: 'text-red-600 bg-red-100',
        description: 'High-priority, qualified lead with strong potential'
      };
    } else if (score >= 65) {
      return {
        grade: 'B',
        label: 'Warm Lead',
        color: 'text-orange-600 bg-orange-100',
        description: 'Good potential, needs nurturing'
      };
    } else if (score >= 50) {
      return {
        grade: 'C',
        label: 'Developing Lead',
        color: 'text-yellow-600 bg-yellow-100',
        description: 'Moderate potential, requires qualification'
      };
    } else if (score >= 35) {
      return {
        grade: 'D',
        label: 'Cold Lead',
        color: 'text-blue-600 bg-blue-100',
        description: 'Low engagement, long-term nurturing needed'
      };
    } else {
      return {
        grade: 'F',
        label: 'Poor Lead',
        color: 'text-gray-600 bg-gray-100',
        description: 'Very low potential, consider disqualifying'
      };
    }
  }
}