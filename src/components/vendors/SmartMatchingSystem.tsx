import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, 
  Search, 
  Zap, 
  Target, 
  Users,
  Building,
  Clock,
  Star,
  Filter,
  Map,
  Navigation,
  Compass
} from 'lucide-react';
import { useVendors } from '@/integrations/supabase/hooks/useVendors';

interface SmartMatchingProps {
  projectDescription?: string;
}

interface MatchCriteria {
  projectDescription: string;
  skills: string[];
  location: string;
  timeline: string;
  budget: string;
  complexity: 'low' | 'medium' | 'high';
}

interface VendorMatch {
  vendorId: string;
  vendor: any;
  matchScore: number;
  matchReasons: string[];
  skillMatches: string[];
  locationScore: number;
  availabilityScore: number;
  experienceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export const SmartMatchingSystem: React.FC<SmartMatchingProps> = ({ projectDescription }) => {
  const { data: vendors = [] } = useVendors();
  const [criteria, setCriteria] = useState<MatchCriteria>({
    projectDescription: projectDescription || '',
    skills: [],
    location: '',
    timeline: '',
    budget: '',
    complexity: 'medium'
  });
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  // Basic skill extraction from project description
  const extractSkillsFromDescription = (description: string): string[] => {
    const skillKeywords = {
      'steel': ['Steel Work'],
      'concrete': ['Concrete Work'],
      'roofing': ['Roofing'],
      'electrical': ['Electrical Work'],
      'plumbing': ['Plumbing'],
      'hvac': ['HVAC'],
      'framing': ['Framing'],
      'insulation': ['Insulation'],
      'drywall': ['Drywall'],
      'flooring': ['Flooring'],
      'painting': ['Painting'],
      'excavation': ['Excavation']
    };

    const extractedSkills: string[] = [];
    const lowerDescription = description.toLowerCase();

    Object.entries(skillKeywords).forEach(([keyword, skills]) => {
      if (lowerDescription.includes(keyword)) {
        extractedSkills.push(...skills);
      }
    });

    return [...new Set(extractedSkills)];
  };

  // Basic vendor matching algorithm using available data only
  const calculateVendorMatch = (vendor: any): VendorMatch => {
    let matchScore = 0;
    const matchReasons: string[] = [];
    const skillMatches: string[] = [];

    // Extract skills from description
    const projectSkills = extractSkillsFromDescription(criteria.projectDescription);
    
    // Skill matching (50% weight)
    const vendorSkills = [vendor.trade, ...(vendor.specializations || [])].filter(Boolean);
    const matchingSkills = projectSkills.filter(skill => 
      vendorSkills.some(vendorSkill => 
        vendorSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(vendorSkill.toLowerCase())
      )
    );
    
    skillMatches.push(...matchingSkills);
    const skillScore = matchingSkills.length > 0 ? 
      (matchingSkills.length / Math.max(projectSkills.length, 1)) * 100 : 0;
    matchScore += skillScore * 0.5;
    
    if (matchingSkills.length > 0) {
      matchReasons.push(`Matches ${matchingSkills.length} required skills`);
    }

    // Location proximity (30% weight)
    let locationScore = 0;
    if (criteria.location && vendor.regions) {
      const locationMatch = vendor.regions.some((region: string) =>
        region.toLowerCase().includes(criteria.location.toLowerCase()) ||
        criteria.location.toLowerCase().includes(region.toLowerCase())
      );
      locationScore = locationMatch ? 100 : 0;
      matchScore += locationScore * 0.3;
      
      if (locationMatch) {
        matchReasons.push(`Services ${criteria.location} area`);
      }
    }

    // Availability (10% weight)
    const availabilityScore = vendor.status === 'Active' ? 100 : 0;
    matchScore += availabilityScore * 0.1;
    
    if (vendor.status === 'Active') {
      matchReasons.push('Currently active and available');
    }

    // Basic rating (10% weight)
    const experienceScore = (vendor.rating / 5) * 100;
    matchScore += experienceScore * 0.1;
    
    if (vendor.rating >= 4.5) {
      matchReasons.push('Highly rated vendor (4.5+ stars)');
    }

    // Determine confidence level based on available data
    let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
    if (matchScore >= 70 && skillMatches.length >= 1) confidenceLevel = 'high';
    else if (matchScore >= 40) confidenceLevel = 'medium';

    return {
      vendorId: vendor.id,
      vendor,
      matchScore: Math.min(100, Math.max(0, matchScore)),
      matchReasons: matchReasons.slice(0, 3), // Top 3 reasons
      skillMatches,
      locationScore,
      availabilityScore,
      experienceScore,
      confidenceLevel
    };
  };

  // Generate matches when criteria changes
  const vendorMatches = useMemo(() => {
    if (!criteria.projectDescription.trim()) return [];
    
    const skills = extractSkillsFromDescription(criteria.projectDescription);
    setExtractedSkills(skills);

    return vendors
      .filter(vendor => vendor.status !== 'Blacklisted')
      .map(calculateVendorMatch)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 15);
  }, [vendors, criteria]);

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getConfidenceBadge = (level: string) => {
    switch (level) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Smart Matching Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <span>AI Smart Matching System</span>
            <Badge variant="outline">
              <Target className="h-3 w-3 mr-1" />
              Intelligent Pairing
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Project Description</label>
            <Textarea
              placeholder="Describe your project in detail. Include materials, scope, timeline, and any specific requirements..."
              value={criteria.projectDescription}
              onChange={(e) => setCriteria(prev => ({ ...prev, projectDescription: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                placeholder="Project location..."
                value={criteria.location}
                onChange={(e) => setCriteria(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Timeline</label>
              <Input
                placeholder="e.g., 3 months, Q2 2024..."
                value={criteria.timeline}
                onChange={(e) => setCriteria(prev => ({ ...prev, timeline: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Complexity</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={criteria.complexity}
                onChange={(e) => setCriteria(prev => ({ 
                  ...prev, 
                  complexity: e.target.value as 'low' | 'medium' | 'high' 
                }))}
              >
                <option value="low">Low Complexity</option>
                <option value="medium">Medium Complexity</option>
                <option value="high">High Complexity</option>
              </select>
            </div>
          </div>

          {/* Extracted Skills */}
          {extractedSkills.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">AI-Detected Skills & Requirements</label>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matching Results */}
      {vendorMatches.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Smart Matches Found ({vendorMatches.length})
            </h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                AI Confidence: {vendorMatches.filter(m => m.confidenceLevel === 'high').length} High
              </Badge>
            </div>
          </div>

          {vendorMatches.map((match, index) => (
            <Card key={match.vendorId} className={
              match.confidenceLevel === 'high' ? 'ring-2 ring-green-200' : 
              match.confidenceLevel === 'medium' ? 'ring-1 ring-yellow-200' : ''
            }>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {index < 3 && (
                        <Badge className={
                          index === 0 ? 'bg-green-600' : 
                          index === 1 ? 'bg-blue-600' : 
                          'bg-purple-600'
                        }>
                          #{index + 1} Match
                        </Badge>
                      )}
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">{match.vendor.name}</h3>
                      </div>
                      <Badge variant="outline">{match.vendor.code}</Badge>
                      {match.vendor.trade && (
                        <Badge variant="secondary">{match.vendor.trade}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Skill Matches</h4>
                        <div className="space-y-1">
                          {match.skillMatches.slice(0, 3).map((skill, idx) => (
                            <div key={idx} className="flex items-center space-x-1 text-xs">
                              <Target className="h-3 w-3 text-green-600" />
                              <span>{skill}</span>
                            </div>
                          ))}
                          {match.skillMatches.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{match.skillMatches.length - 3} more matches
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Match Scores</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Location:</span>
                            <span className={getMatchScoreColor(match.locationScore)}>
                              {match.locationScore.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Availability:</span>
                            <span className={getMatchScoreColor(match.availabilityScore)}>
                              {match.availabilityScore.toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Experience:</span>
                            <span className={getMatchScoreColor(match.experienceScore)}>
                              {match.experienceScore.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Why Matched</h4>
                        <div className="space-y-1">
                          {match.matchReasons.slice(0, 3).map((reason, idx) => (
                            <div key={idx} className="flex items-center space-x-1 text-xs">
                              <Compass className="h-3 w-3 text-blue-600" />
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span>{match.vendor.rating}/5</span>
                      </div>
                      <Badge variant={match.vendor.status === 'Active' ? 'default' : 'secondary'}>
                        {match.vendor.status}
                      </Badge>
                      {match.vendor.regions && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{match.vendor.regions.slice(0, 2).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-2">
                    <div>
                      <div className={`text-2xl font-bold ${getMatchScoreColor(match.matchScore)}`}>
                        {match.matchScore.toFixed(0)}%
                      </div>
                      <Badge variant={getConfidenceBadge(match.confidenceLevel)}>
                        <span className={getConfidenceColor(match.confidenceLevel)}>
                          {match.confidenceLevel} confidence
                        </span>
                      </Badge>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <Button size="sm">
                        View Profile
                      </Button>
                      <Button variant="outline" size="sm">
                        Send RFQ
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">AI Matching Ready</h3>
            <p className="text-muted-foreground mb-4">
              Describe your project above to get intelligent vendor recommendations based on skills, location, and requirements
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};