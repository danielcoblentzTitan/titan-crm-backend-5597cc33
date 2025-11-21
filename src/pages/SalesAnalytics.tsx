import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SalesMetricCards } from '@/components/analytics/SalesMetricCards';
import { SalesTable } from '@/components/analytics/SalesTable';
import { MonthlyBreakdown } from '@/components/analytics/MonthlyBreakdown';
import { supabaseService } from '@/services/supabaseService';
import type { Project } from '@/services/supabaseService';

const SalesAnalytics = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || new Date().getFullYear().toString());
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = ['All Time']; // Add All Time as first option
    for (let year = 2023; year <= currentYear; year++) {
      years.push(year.toString());
    }
    return years;
  };

  useEffect(() => {
    fetchProjects();
  }, [selectedYear]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Real project data from your business records - 2023 corrected data
      const historicalProjects = {
        '2023': [
          // 2023 Residential projects - corrected with proper months and counties
          { id: '1', name: 'Andy Lohmeyer Project', customer_name: 'Andy Lohmeyer', building_type: 'Residential', budget: 15200, estimated_profit: 3040, start_date: '2023-01-15', status: 'Completed', county: '', square_footage: 2400 },
          { id: '2', name: 'Shawn Cramer Project', customer_name: 'Shawn Cramer', building_type: 'Residential', budget: 44350, estimated_profit: 8870, start_date: '2023-04-15', status: 'Completed', county: 'Dorchester', square_footage: 2600 },
          { id: '3', name: 'David Czarnecki Project', customer_name: 'David Czarnecki', building_type: 'Residential', budget: 67555, estimated_profit: 13511, start_date: '2023-04-10', status: 'Completed', county: 'Sussex', square_footage: 2200 },
          { id: '4', name: 'Nick Beaudet Project', customer_name: 'Nick Beaudet', building_type: 'Residential', budget: 28520, estimated_profit: 5704, start_date: '2023-04-25', status: 'Completed', county: 'Kent', square_footage: 2800 },
          { id: '5', name: 'Merritt Burke Project', customer_name: 'Merritt Burke', building_type: 'Residential', budget: 96500, estimated_profit: 19300, start_date: '2023-05-15', status: 'Completed', county: 'Sussex', square_footage: 2500 },
          { id: '6', name: 'Buddy Doll Project', customer_name: 'Buddy Doll', building_type: 'Residential', budget: 21800, estimated_profit: 4360, start_date: '2023-05-10', status: 'Completed', county: 'Talbot', square_footage: 2300 },
          { id: '7', name: 'Mike Sturgill Project', customer_name: 'Mike Sturgill', building_type: 'Residential', budget: 55550, estimated_profit: 11110, start_date: '2023-05-25', status: 'Completed', county: 'New Castle', square_footage: 2900 },
          { id: '8', name: 'Alan Mack Project', customer_name: 'Alan Mack', building_type: 'Residential', budget: 19400, estimated_profit: 3880, start_date: '2023-06-15', status: 'Completed', county: 'Baltimore', square_footage: 2650 },
          { id: '9', name: 'Rachael Phillos Project', customer_name: 'Rachael Phillos', building_type: 'Residential', budget: 60850, estimated_profit: 12170, start_date: '2023-06-10', status: 'Completed', county: 'Sussex', square_footage: 2750 },
          { id: '10', name: 'Larry Tawes Project', customer_name: 'Larry Tawes', building_type: 'Residential', budget: 134900, estimated_profit: 26980, start_date: '2023-06-20', status: 'Completed', county: 'Worcester', square_footage: 2450 },
          { id: '11', name: 'Robert Burke Project', customer_name: 'Robert Burke', building_type: 'Residential', budget: 26950, estimated_profit: 5390, start_date: '2023-07-15', status: 'Completed', county: 'Sussex', square_footage: 2850 },
          { id: '12', name: 'Brad Houston Project', customer_name: 'Brad Houston', building_type: 'Residential', budget: 24200, estimated_profit: 4840, start_date: '2023-08-15', status: 'Completed', county: 'New Castle', square_footage: 2700 },
          { id: '13', name: 'Patriot Point- Hugh Middleton Project', customer_name: 'Hugh Middleton', building_type: 'Residential', budget: 152500, estimated_profit: 30500, start_date: '2023-08-10', status: 'Completed', county: 'Dorchester', square_footage: 3100 },
          { id: '14', name: 'Norman Sugrue Project', customer_name: 'Norman Sugrue', building_type: 'Residential', budget: 123975, estimated_profit: 24795, start_date: '2023-08-25', status: 'Completed', county: 'Sussex', square_footage: 2550 },
          { id: '15', name: 'Keith Mosher Project', customer_name: 'Keith Mosher', building_type: 'Residential', budget: 25550, estimated_profit: 5110, start_date: '2023-08-05', status: 'Completed', county: 'Kent', square_footage: 2650 },
          { id: '16', name: 'David Jones Project (CANCELLED)', customer_name: 'David Jones', building_type: 'Residential', budget: 50000, estimated_profit: 0, start_date: '2023-09-15', status: 'Cancelled', county: 'Kent', square_footage: 2800 },
          { id: '17', name: 'Tyler McQueen Project', customer_name: 'Tyler McQueen', building_type: 'Residential', budget: 23000, estimated_profit: 4600, start_date: '2023-10-25', status: 'Completed', county: 'New Castle', square_footage: 2500 },
          { id: '18', name: 'Chris Glover Project', customer_name: 'Chris Glover', building_type: 'Residential', budget: 130200, estimated_profit: 26040, start_date: '2023-10-05', status: 'Completed', county: 'Kent', square_footage: 2750 },
          { id: '19', name: 'Chris Dawson Project', customer_name: 'Chris Dawson', building_type: 'Residential', budget: 72075, estimated_profit: 14415, start_date: '2023-11-15', status: 'Completed', county: 'Kent', square_footage: 2850 },
          { id: '20', name: 'Nick Reverdito Project', customer_name: 'Nick Reverdito', building_type: 'Residential', budget: 32700, estimated_profit: 6540, start_date: '2023-11-25', status: 'Completed', county: 'New Castle', square_footage: 2675 },
          { id: '21', name: 'Josh Pierce Project', customer_name: 'Josh Pierce', building_type: 'Residential', budget: 145000, estimated_profit: 29000, start_date: '2023-11-05', status: 'Completed', county: 'Cecil', square_footage: 2775 },
           { id: '22', name: 'Michelle Gardner Project', customer_name: 'Michelle Gardner', building_type: 'Residential', budget: 60000, estimated_profit: 12000, start_date: '2023-12-15', status: 'Completed', county: 'Kent', square_footage: 2825 },
           { id: '23', name: 'Larry Tawes House Project (CANCELLED)', customer_name: 'Larry Tawes', building_type: 'Residential', budget: 150000, estimated_profit: 0, start_date: '2023-07-01', status: 'Cancelled', county: 'Worcester', square_footage: 3000 },
           
           // 2023 Commercial projects
           { id: '24', name: 'Rick Tucker Project', customer_name: 'Rick Tucker', building_type: 'Commercial', budget: 321500, estimated_profit: 56899, start_date: '2023-07-01', status: 'Completed', county: 'Sussex', square_footage: 6000 },
           { id: '25', name: 'Joe Gallo Project', customer_name: 'Joe Gallo', building_type: 'Commercial', budget: 187000, estimated_profit: 55000, start_date: '2023-09-01', status: 'Completed', county: 'New Castle', square_footage: 4800 },
           { id: '26', name: 'Ryan Turner (Bryan & Sons) Project', customer_name: 'Ryan Turner', building_type: 'Commercial', budget: 305500, estimated_profit: 76375, start_date: '2023-10-01', status: 'Completed', county: 'Sussex', square_footage: 5445 },
           { id: '27', name: 'Walter George (Annapolis Boat) Project', customer_name: 'Walter George', building_type: 'Commercial', budget: 700000, estimated_profit: 140000, start_date: '2023-10-01', status: 'Completed', county: 'Queen Annes', square_footage: 8000 },
           { id: '28', name: 'Ryan Turner (Bryan & Sons) Reskin Project', customer_name: 'Ryan Turner', building_type: 'Commercial', budget: 39500, estimated_profit: 11778, start_date: '2023-10-15', status: 'Completed', county: 'Sussex', square_footage: 2000 }
        ],
        '2024': [
          // 2024 Residential projects
          { id: '29', name: 'Jeff Smith Project', customer_name: 'Jeff Smith', building_type: 'Residential', budget: 57000, estimated_profit: 11400, start_date: '2024-01-15', status: 'Completed', county: 'Sussex', square_footage: 1600 },
          { id: '30', name: 'Heather Swyka Project', customer_name: 'Heather Swyka', building_type: 'Residential', budget: 55000, estimated_profit: 11000, start_date: '2024-01-20', status: 'Completed', county: 'New Castle', square_footage: 1536 },
          { id: '31', name: 'Don Whitaker Project (CANCELLED)', customer_name: 'Don Whitaker', building_type: 'Residential', budget: 0, estimated_profit: 0, start_date: '2024-03-01', status: 'Cancelled', county: 'New Castle', square_footage: 0 },
          { id: '32', name: 'Scott Plumley Project', customer_name: 'Scott Plumley', building_type: 'Residential', budget: 70000, estimated_profit: 14000, start_date: '2024-03-15', status: 'Completed', county: 'Annapolis', square_footage: 3500 },
          { id: '33', name: 'Glenn Shelton Project', customer_name: 'Glenn Shelton', building_type: 'Residential', budget: 72400, estimated_profit: 14480, start_date: '2024-04-10', status: 'Completed', county: 'Queen Annes', square_footage: 1740 },
          { id: '34', name: 'Ramsey Farah Project', customer_name: 'Ramsey Farah', building_type: 'Residential', budget: 168000, estimated_profit: 33600, start_date: '2024-05-05', status: 'Completed', county: 'Dorchester', square_footage: 2400 },
          { id: '35', name: 'Matthew Fields Project', customer_name: 'Matthew Fields', building_type: 'Residential', budget: 110000, estimated_profit: 22000, start_date: '2024-05-10', status: 'Completed', county: 'Wicomico', square_footage: 3200 },
          { id: '36', name: 'Patty Potter Project', customer_name: 'Patty Potter', building_type: 'Residential', budget: 31000, estimated_profit: 6200, start_date: '2024-05-15', status: 'Completed', county: 'Kent', square_footage: 960 },
          { id: '37', name: 'Harry Whiteman Project', customer_name: 'Harry Whiteman', building_type: 'Residential', budget: 70000, estimated_profit: 14000, start_date: '2024-06-01', status: 'Completed', county: 'Kent', square_footage: 1200 },
          { id: '38', name: 'Paul Ciatolla Project (CANCELLED)', customer_name: 'Paul Ciatolla', building_type: 'Residential', budget: 0, estimated_profit: 0, start_date: '2024-06-10', status: 'Cancelled', county: 'Caroline', square_footage: 0 },
          { id: '39', name: 'Adam Project', customer_name: 'Adam', building_type: 'Residential', budget: 55000, estimated_profit: 11000, start_date: '2024-06-15', status: 'Completed', county: 'Kent', square_footage: 2400 },
          { id: '40', name: 'Mike Sturgill (2) Project', customer_name: 'Mike Sturgill', building_type: 'Residential', budget: 27500, estimated_profit: 5500, start_date: '2024-06-20', status: 'Completed', county: 'New Castle', square_footage: 528 },
          { id: '41', name: 'Willa Rodden Project', customer_name: 'Willa Rodden', building_type: 'Residential', budget: 30000, estimated_profit: 6000, start_date: '2024-07-01', status: 'Completed', county: 'Kent', square_footage: 864 },
          { id: '42', name: 'Willa Rodden Deck Project', customer_name: 'Willa Rodden', building_type: 'Residential', budget: 25000, estimated_profit: 5000, start_date: '2024-07-05', status: 'Completed', county: 'Kent', square_footage: 400 },
          { id: '43', name: 'Steve Besemann Project', customer_name: 'Steve Besemann', building_type: 'Residential', budget: 71500, estimated_profit: 14300, start_date: '2024-07-10', status: 'Completed', county: 'Easton', square_footage: 1008 },
          { id: '44', name: 'Phil Brodeaur Project', customer_name: 'Phil Brodeaur', building_type: 'Residential', budget: 148850, estimated_profit: 29770, start_date: '2024-07-15', status: 'Completed', county: 'Talbot', square_footage: 2400 },
          { id: '45', name: 'Pamela Howell-Paoli Project', customer_name: 'Pamela Howell-Paoli', building_type: 'Residential', budget: 57000, estimated_profit: 11400, start_date: '2024-09-01', status: 'Completed', county: 'Kent', square_footage: 2400 },
          { id: '46', name: 'Chris Crocetti Project', customer_name: 'Chris Crocetti', building_type: 'Residential', budget: 115000, estimated_profit: 23000, start_date: '2024-10-01', status: 'Completed', county: 'Sussex', square_footage: 1300 },
          { id: '47', name: 'Mandalakas Roof Replacement', customer_name: 'Mandalakas', building_type: 'Residential', budget: 13000, estimated_profit: 2600, start_date: '2024-10-10', status: 'Completed', county: 'Kent', square_footage: 2000 },
          { id: '48', name: 'Aaron Cook Project', customer_name: 'Aaron Cook', building_type: 'Residential', budget: 125000, estimated_profit: 25000, start_date: '2024-11-01', status: 'Completed', county: 'Kent', square_footage: 1920 },
          { id: '49', name: 'Quintin Richardson Project', customer_name: 'Quintin Richardson', building_type: 'Residential', budget: 79500, estimated_profit: 15900, start_date: '2024-12-01', status: 'Completed', county: 'Kent', square_footage: 2400 },
          { id: '50', name: 'Patrick Gory Project', customer_name: 'Patrick Gory', building_type: 'Residential', budget: 57000, estimated_profit: 11400, start_date: '2024-12-15', status: 'Completed', county: 'Kent', square_footage: 1200 },
          
          // 2024 Barndominium projects
          { id: '51', name: 'John Cope Barndo Project', customer_name: 'John Cope', building_type: 'Barndominium', budget: 170000, estimated_profit: 34000, start_date: '2024-04-15', status: 'Completed', county: 'Sussex', square_footage: 2000 },
          { id: '52', name: 'Hannah Adkins Barndo Project', customer_name: 'Hannah Adkins', building_type: 'Barndominium', budget: 325000, estimated_profit: 65000, start_date: '2024-05-01', status: 'Completed', county: 'Wicomico', square_footage: 3500 },
          
          // 2024 Commercial projects
          { id: '53', name: 'Rick Tucker Project', customer_name: 'Rick Tucker', building_type: 'Commercial', budget: 296300, estimated_profit: 59260, start_date: '2024-02-01', status: 'Completed', county: 'Sussex', square_footage: 9600 },
          { id: '54', name: 'Bryan and Sons Addition', customer_name: 'Bryan and Sons', building_type: 'Commercial', budget: 130000, estimated_profit: 26000, start_date: '2024-07-01', status: 'Completed', county: 'Sussex', square_footage: 1080 },
          { id: '55', name: 'Milford Historical Society Project', customer_name: 'Milford Historical Society', building_type: 'Commercial', budget: 250000, estimated_profit: 50000, start_date: '2024-09-01', status: 'Completed', county: 'Sussex', square_footage: 5000 },
          { id: '56', name: 'EDIS Project', customer_name: 'EDIS', building_type: 'Commercial', budget: 217600, estimated_profit: 43520, start_date: '2024-09-15', status: 'Completed', county: 'New Castle', square_footage: 6000 },
          { id: '57', name: 'Maddox Reroof Project', customer_name: 'Maddox', building_type: 'Commercial', budget: 23000, estimated_profit: 4600, start_date: '2024-10-01', status: 'Completed', county: 'New Castle', square_footage: 2000 },
          { id: '58', name: 'Holly Oak - Alycia Reroof', customer_name: 'Holly Oak - Alycia', building_type: 'Commercial', budget: 90800, estimated_profit: 18160, start_date: '2024-11-01', status: 'Completed', county: 'New Castle', square_footage: 3000 },
          { id: '59', name: 'Taylor Marine Pavilion', customer_name: 'Taylor Marine', building_type: 'Commercial', budget: 45000, estimated_profit: 9000, start_date: '2024-12-01', status: 'Completed', county: 'Wicomico', square_footage: 1500 }
        ],
        '2025': [
          // 2025 Residential projects (YTD)
          { id: '63', name: 'Johnathon Vanho Project', customer_name: 'Johnathon Vanho', building_type: 'Residential', budget: 68000, estimated_profit: 13600, start_date: '2025-01-15', status: 'Completed', county: 'Kent', square_footage: 2400 },
          { id: '64', name: 'Alyson and Brad Hudson Garage/Living Space', customer_name: 'Alyson and Brad Hudson', building_type: 'Residential', budget: 65000, estimated_profit: 13000, start_date: '2025-02-10', status: 'Completed', county: 'Sussex', square_footage: 1500 },
          { id: '65', name: 'Mike McGinnis Project', customer_name: 'Mike McGinnis', building_type: 'Residential', budget: 57000, estimated_profit: 11400, start_date: '2025-03-01', status: 'Completed', county: 'Somerset', square_footage: 768 },
          { id: '66', name: 'Parker Palmer Equestrian Project', customer_name: 'Parker Palmer', building_type: 'Residential', budget: 70000, estimated_profit: 14000, start_date: '2025-03-05', status: 'Completed', county: 'Sussex', square_footage: 2400 },
          { id: '67', name: 'Rich Fix Project', customer_name: 'Rich Fix', building_type: 'Residential', budget: 219000, estimated_profit: 43800, start_date: '2025-03-10', status: 'Completed', county: 'Sussex', square_footage: 1800 },
          { id: '68', name: 'Tracey Wessell Project', customer_name: 'Tracey Wessell', building_type: 'Residential', budget: 57600, estimated_profit: 11520, start_date: '2025-03-15', status: 'Completed', county: 'Sussex', square_footage: 1600 },
          { id: '69', name: 'John Womack Project', customer_name: 'John Womack', building_type: 'Residential', budget: 42000, estimated_profit: 8400, start_date: '2025-03-20', status: 'Completed', county: 'Somerset', square_footage: 1200 },
          { id: '70', name: 'Jen & Doug Hamilton Project', customer_name: 'Jen & Doug Hamilton', building_type: 'Residential', budget: 52000, estimated_profit: 10400, start_date: '2025-05-01', status: 'Completed', county: 'Sussex', square_footage: 864 },
          { id: '71', name: 'Sharon Dove Project (CANCELLED)', customer_name: 'Sharon Dove', building_type: 'Residential', budget: 50000, estimated_profit: 0, start_date: '2025-05-10', status: 'Cancelled', county: 'Caroline', square_footage: 0 },
          { id: '72', name: 'Deanna Debrosse Project', customer_name: 'Deanna Debrosse', building_type: 'Residential', budget: 58700, estimated_profit: 11740, start_date: '2025-05-15', status: 'Completed', county: 'Kent', square_footage: 1200 },
          { id: '73', name: 'Martin Batze Project (CANCELLED)', customer_name: 'Martin Batze', building_type: 'Residential', budget: 400000, estimated_profit: 0, start_date: '2025-06-01', status: 'Cancelled', county: 'Somerset', square_footage: 0 },
          { id: '74', name: 'Andrew Ra Project', customer_name: 'Andrew Ra', building_type: 'Residential', budget: 81500, estimated_profit: 16300, start_date: '2025-07-01', status: 'Completed', county: 'Sussex', square_footage: 750 },
          { id: '75', name: 'Connor Weaver Project', customer_name: 'Connor Weaver', building_type: 'Residential', budget: 51800, estimated_profit: 10360, start_date: '2025-07-15', status: 'Completed', county: 'Kent', square_footage: 1440 },
          
          // 2025 Barndominium projects (YTD)
          { id: '76', name: 'Nick Fulford Barndo Project', customer_name: 'Nick Fulford', building_type: 'Barndominium', budget: 557500, estimated_profit: 111500, start_date: '2025-02-01', status: 'Completed', county: 'Sussex', square_footage: 4000 },
          { id: '77', name: 'Jimmy Martin Barndo Project', customer_name: 'Jimmy Martin', building_type: 'Barndominium', budget: 150000, estimated_profit: 30000, start_date: '2025-04-01', status: 'Completed', county: 'Kent', square_footage: 2500 },
          { id: '78', name: 'Scott Saunders Barndo Project', customer_name: 'Scott Saunders', building_type: 'Barndominium', budget: 200000, estimated_profit: 40000, start_date: '2025-05-01', status: 'Completed', county: 'Caroline', square_footage: 3000 },
          { id: '79', name: 'Joe Sopzy Barndo Project', customer_name: 'Joe Sopzy', building_type: 'Barndominium', budget: 185000, estimated_profit: 37000, start_date: '2025-06-01', status: 'Completed', county: 'Sussex', square_footage: 2800 },
          { id: '80', name: 'Brock Adkins Barndo Project', customer_name: 'Brock Adkins', building_type: 'Barndominium', budget: 550000, estimated_profit: 110000, start_date: '2025-08-01', status: 'Completed', county: 'Dorchester', square_footage: 4200 },
          { id: '81', name: 'Jake Sprout Barndo Shell Project', customer_name: 'Jake Sprout', building_type: 'Barndominium', budget: 105000, estimated_profit: 21000, start_date: '2025-08-15', status: 'Completed', county: 'Sussex', square_footage: 2000 },
          
          // 2025 Commercial projects (YTD)
          { id: '60', name: 'Rick Tucker Project', customer_name: 'Rick Tucker', building_type: 'Commercial', budget: 295000, estimated_profit: 59000, start_date: '2025-04-01', status: 'Completed', county: 'Sussex', square_footage: 9600 },
          { id: '61', name: 'ZS Technologies - Scott Hemphill Project', customer_name: 'Scott Hemphill', building_type: 'Commercial', budget: 58000, estimated_profit: 11600, start_date: '2025-04-15', status: 'Completed', county: 'New Castle', square_footage: 2000 },
          { id: '62', name: 'Doug Melson Project', customer_name: 'Doug Melson', building_type: 'Commercial', budget: 132500, estimated_profit: 26500, start_date: '2025-05-01', status: 'Completed', county: 'Sussex', square_footage: 1344 }
        ]
      };

      if (selectedYear === 'All Time') {
        // Combine all years for All Time view
        const allProjects = [
          ...historicalProjects['2023'],
          ...historicalProjects['2024'],
          ...historicalProjects['2025']
        ];
        setProjects(allProjects as any[]);
      } else {
        const yearProjects = historicalProjects[selectedYear as keyof typeof historicalProjects] || [];
        setProjects(yearProjects as any[]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const categorizeProjects = () => {
    const residential = projects.filter(p => 
      p.building_type === 'Residential' && 
      p.status !== 'Cancelled' && 
      !p.is_cancelled
    );
    
    const barndominium = projects.filter(p => 
      p.building_type === 'Barndominium' && 
      p.status !== 'Cancelled' && 
      !p.is_cancelled
    );
    
    const commercial = projects.filter(p => 
      p.building_type === 'Commercial' && 
      p.status !== 'Cancelled' && 
      !p.is_cancelled
    );
    
    const cancelled = projects.filter(p => 
      p.status === 'Cancelled' || p.is_cancelled
    );

    return { residential, barndominium, commercial, cancelled };
  };

  const { residential, barndominium, commercial, cancelled } = categorizeProjects();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sales Analytics</h1>
              <p className="text-muted-foreground">Comprehensive sales data and insights</p>
            </div>
          </div>
          
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getAvailableYears().map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg text-muted-foreground">Loading analytics data...</div>
          </div>
        ) : (
          <>
            {/* Metrics Cards */}
            <SalesMetricCards 
              residential={residential}
              barndominium={barndominium}
              commercial={commercial}
              cancelled={cancelled}
              year={selectedYear}
            />

            {/* Monthly Breakdown Chart */}
            <MonthlyBreakdown projects={projects} year={selectedYear} />

            {/* Data Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesTable 
                title="Residential Projects"
                projects={residential}
                type="residential"
              />
              <SalesTable 
                title="Barndominium Projects"
                projects={barndominium}
                type="barndominium"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesTable 
                title="Commercial Projects"
                projects={commercial}
                type="commercial"
              />
              <SalesTable 
                title="Cancelled Projects"
                projects={cancelled}
                type="cancelled"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;