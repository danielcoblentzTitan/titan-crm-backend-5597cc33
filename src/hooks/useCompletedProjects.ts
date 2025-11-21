import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  customer_name: string;
  building_type: string;
  budget: number;
  status: string;
  county: string;
  square_footage: number;
  start_date: string;
}

export const useCompletedProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Historical projects data from SalesAnalytics - completed projects only
        const completedProjects: Project[] = [
          // 2023 Completed Projects
          { id: '1', name: 'Andy Lohmeyer Project', customer_name: 'Andy Lohmeyer', building_type: 'Residential', budget: 15200, status: 'Completed', county: 'Sussex', square_footage: 2400, start_date: '2023-01-15' },
          { id: '2', name: 'Shawn Cramer Project', customer_name: 'Shawn Cramer', building_type: 'Residential', budget: 44350, status: 'Completed', county: 'Dorchester', square_footage: 2600, start_date: '2023-04-15' },
          { id: '3', name: 'David Czarnecki Project', customer_name: 'David Czarnecki', building_type: 'Residential', budget: 67555, status: 'Completed', county: 'Sussex', square_footage: 2200, start_date: '2023-04-10' },
          { id: '4', name: 'Nick Beaudet Project', customer_name: 'Nick Beaudet', building_type: 'Residential', budget: 28520, status: 'Completed', county: 'Kent', square_footage: 2800, start_date: '2023-04-25' },
          { id: '5', name: 'Merritt Burke Project', customer_name: 'Merritt Burke', building_type: 'Residential', budget: 96500, status: 'Completed', county: 'Sussex', square_footage: 2500, start_date: '2023-05-15' },
          { id: '6', name: 'Buddy Doll Project', customer_name: 'Buddy Doll', building_type: 'Residential', budget: 21800, status: 'Completed', county: 'Talbot', square_footage: 2300, start_date: '2023-05-10' },
          { id: '7', name: 'Mike Sturgill Project', customer_name: 'Mike Sturgill', building_type: 'Residential', budget: 55550, status: 'Completed', county: 'New Castle', square_footage: 2900, start_date: '2023-05-25' },
          { id: '8', name: 'Alan Mack Project', customer_name: 'Alan Mack', building_type: 'Residential', budget: 19400, status: 'Completed', county: 'Baltimore', square_footage: 2650, start_date: '2023-06-15' },
          { id: '9', name: 'Rachael Phillos Project', customer_name: 'Rachael Phillos', building_type: 'Residential', budget: 60850, status: 'Completed', county: 'Sussex', square_footage: 2750, start_date: '2023-06-10' },
          { id: '10', name: 'Larry Tawes Project', customer_name: 'Larry Tawes', building_type: 'Residential', budget: 134900, status: 'Completed', county: 'Worcester', square_footage: 2450, start_date: '2023-06-20' },
          { id: '11', name: 'Robert Burke Project', customer_name: 'Robert Burke', building_type: 'Residential', budget: 26950, status: 'Completed', county: 'Sussex', square_footage: 2850, start_date: '2023-07-15' },
          { id: '12', name: 'Brad Houston Project', customer_name: 'Brad Houston', building_type: 'Residential', budget: 24200, status: 'Completed', county: 'New Castle', square_footage: 2700, start_date: '2023-08-15' },
          { id: '13', name: 'Patriot Point- Hugh Middleton Project', customer_name: 'Hugh Middleton', building_type: 'Residential', budget: 152500, status: 'Completed', county: 'Dorchester', square_footage: 3100, start_date: '2023-08-10' },
          { id: '14', name: 'Norman Sugrue Project', customer_name: 'Norman Sugrue', building_type: 'Residential', budget: 123975, status: 'Completed', county: 'Sussex', square_footage: 2550, start_date: '2023-08-25' },
          { id: '15', name: 'Keith Mosher Project', customer_name: 'Keith Mosher', building_type: 'Residential', budget: 25550, status: 'Completed', county: 'Kent', square_footage: 2650, start_date: '2023-08-05' },
          { id: '17', name: 'Tyler McQueen Project', customer_name: 'Tyler McQueen', building_type: 'Residential', budget: 23000, status: 'Completed', county: 'New Castle', square_footage: 2500, start_date: '2023-10-25' },
          { id: '18', name: 'Chris Glover Project', customer_name: 'Chris Glover', building_type: 'Residential', budget: 130200, status: 'Completed', county: 'Kent', square_footage: 2750, start_date: '2023-10-05' },
          { id: '19', name: 'Chris Dawson Project', customer_name: 'Chris Dawson', building_type: 'Residential', budget: 72075, status: 'Completed', county: 'Kent', square_footage: 2850, start_date: '2023-11-15' },
          { id: '20', name: 'Nick Reverdito Project', customer_name: 'Nick Reverdito', building_type: 'Residential', budget: 32700, status: 'Completed', county: 'New Castle', square_footage: 2675, start_date: '2023-11-25' },
          { id: '21', name: 'Josh Pierce Project', customer_name: 'Josh Pierce', building_type: 'Residential', budget: 145000, status: 'Completed', county: 'Cecil', square_footage: 2775, start_date: '2023-11-05' },
          { id: '22', name: 'Michelle Gardner Project', customer_name: 'Michelle Gardner', building_type: 'Residential', budget: 60000, status: 'Completed', county: 'Kent', square_footage: 2825, start_date: '2023-12-15' },

          // 2023 Commercial
          { id: '24', name: 'Rick Tucker Project', customer_name: 'Rick Tucker', building_type: 'Commercial', budget: 321500, status: 'Completed', county: 'Sussex', square_footage: 6000, start_date: '2023-07-01' },
          { id: '25', name: 'Joe Gallo Project', customer_name: 'Joe Gallo', building_type: 'Commercial', budget: 187000, status: 'Completed', county: 'New Castle', square_footage: 4800, start_date: '2023-09-01' },
          { id: '26', name: 'Ryan Turner (Bryan & Sons) Project', customer_name: 'Ryan Turner', building_type: 'Commercial', budget: 305500, status: 'Completed', county: 'Sussex', square_footage: 5445, start_date: '2023-10-01' },
          { id: '27', name: 'Walter George (Annapolis Boat) Project', customer_name: 'Walter George', building_type: 'Commercial', budget: 700000, status: 'Completed', county: 'Queen Annes', square_footage: 8000, start_date: '2023-10-01' },
          { id: '28', name: 'Ryan Turner (Bryan & Sons) Reskin Project', customer_name: 'Ryan Turner', building_type: 'Commercial', budget: 39500, status: 'Completed', county: 'Sussex', square_footage: 2000, start_date: '2023-10-15' },

          // 2024 Projects
          { id: '29', name: 'Jeff Smith Project', customer_name: 'Jeff Smith', building_type: 'Residential', budget: 57000, status: 'Completed', county: 'Sussex', square_footage: 1600, start_date: '2024-01-15' },
          { id: '30', name: 'Heather Swyka Project', customer_name: 'Heather Swyka', building_type: 'Residential', budget: 55000, status: 'Completed', county: 'New Castle', square_footage: 1536, start_date: '2024-01-20' },
          { id: '32', name: 'Scott Plumley Project', customer_name: 'Scott Plumley', building_type: 'Residential', budget: 70000, status: 'Completed', county: 'Annapolis', square_footage: 3500, start_date: '2024-03-15' },
          { id: '33', name: 'Glenn Shelton Project', customer_name: 'Glenn Shelton', building_type: 'Residential', budget: 72400, status: 'Completed', county: 'Queen Annes', square_footage: 1740, start_date: '2024-04-10' },
          { id: '34', name: 'Ramsey Farah Project', customer_name: 'Ramsey Farah', building_type: 'Residential', budget: 168000, status: 'Completed', county: 'Dorchester', square_footage: 2400, start_date: '2024-05-05' },
          { id: '35', name: 'Matthew Fields Project', customer_name: 'Matthew Fields', building_type: 'Residential', budget: 110000, status: 'Completed', county: 'Wicomico', square_footage: 3200, start_date: '2024-05-10' },
          { id: '36', name: 'Patty Potter Project', customer_name: 'Patty Potter', building_type: 'Residential', budget: 31000, status: 'Completed', county: 'Kent', square_footage: 960, start_date: '2024-05-15' },
          { id: '37', name: 'Harry Whiteman Project', customer_name: 'Harry Whiteman', building_type: 'Residential', budget: 70000, status: 'Completed', county: 'Kent', square_footage: 1200, start_date: '2024-06-01' },
          { id: '39', name: 'Adam Project', customer_name: 'Adam', building_type: 'Residential', budget: 55000, status: 'Completed', county: 'Kent', square_footage: 2400, start_date: '2024-06-15' },
          { id: '40', name: 'Mike Sturgill (2) Project', customer_name: 'Mike Sturgill', building_type: 'Residential', budget: 27500, status: 'Completed', county: 'New Castle', square_footage: 528, start_date: '2024-06-20' },
          { id: '41', name: 'Willa Rodden Project', customer_name: 'Willa Rodden', building_type: 'Residential', budget: 30000, status: 'Completed', county: 'Kent', square_footage: 864, start_date: '2024-07-01' },
          { id: '42', name: 'Willa Rodden Deck Project', customer_name: 'Willa Rodden', building_type: 'Residential', budget: 25000, status: 'Completed', county: 'Kent', square_footage: 400, start_date: '2024-07-05' },
          { id: '43', name: 'Steve Besemann Project', customer_name: 'Steve Besemann', building_type: 'Residential', budget: 71500, status: 'Completed', county: 'Easton', square_footage: 1008, start_date: '2024-07-10' },
          { id: '44', name: 'Phil Brodeaur Project', customer_name: 'Phil Brodeaur', building_type: 'Residential', budget: 148850, status: 'Completed', county: 'Talbot', square_footage: 2400, start_date: '2024-07-15' },
          { id: '45', name: 'Pamela Howell-Paoli Project', customer_name: 'Pamela Howell-Paoli', building_type: 'Residential', budget: 57000, status: 'Completed', county: 'Kent', square_footage: 2400, start_date: '2024-09-01' },
          { id: '46', name: 'Chris Crocetti Project', customer_name: 'Chris Crocetti', building_type: 'Residential', budget: 115000, status: 'Completed', county: 'Sussex', square_footage: 1300, start_date: '2024-10-01' },
          { id: '47', name: 'Mandalakas Roof Replacement', customer_name: 'Mandalakas', building_type: 'Residential', budget: 13000, status: 'Completed', county: 'Kent', square_footage: 2000, start_date: '2024-10-10' },
          { id: '48', name: 'Aaron Cook Project', customer_name: 'Aaron Cook', building_type: 'Residential', budget: 125000, status: 'Completed', county: 'Kent', square_footage: 1920, start_date: '2024-11-01' },
          { id: '49', name: 'Quintin Richardson Project', customer_name: 'Quintin Richardson', building_type: 'Residential', budget: 79500, status: 'Completed', county: 'Kent', square_footage: 2400, start_date: '2024-12-01' },
          { id: '50', name: 'Patrick Gory Project', customer_name: 'Patrick Gory', building_type: 'Residential', budget: 57000, status: 'Completed', county: 'Kent', square_footage: 1200, start_date: '2024-12-15' },

          // 2024 Barndominium
          { id: '51', name: 'John Cope Barndo Project', customer_name: 'John Cope', building_type: 'Barndominium', budget: 170000, status: 'Completed', county: 'Sussex', square_footage: 2000, start_date: '2024-04-15' },
          { id: '52', name: 'Hannah Adkins Barndo Project', customer_name: 'Hannah Adkins', building_type: 'Barndominium', budget: 325000, status: 'Completed', county: 'Wicomico', square_footage: 3500, start_date: '2024-05-01' },

          // 2025 Barndominium  
          { id: '78', name: 'Nick Fulford Barndo Project', customer_name: 'Nick Fulford', building_type: 'Barndominium', budget: 557500, status: 'Completed', county: 'Sussex', square_footage: 4000, start_date: '2025-02-01' },
          { id: '79', name: 'Jimmy Martin Barndo Project', customer_name: 'Jimmy Martin', building_type: 'Barndominium', budget: 150000, status: 'Completed', county: 'Kent', square_footage: 2500, start_date: '2025-04-01' },
          { id: '80', name: 'Scott Saunders Barndo Project', customer_name: 'Scott Saunders', building_type: 'Barndominium', budget: 200000, status: 'Completed', county: 'Caroline', square_footage: 3000, start_date: '2025-05-01' },
          { id: '81', name: 'Joe Sopzy Barndo Project', customer_name: 'Joe Sopzy', building_type: 'Barndominium', budget: 185000, status: 'Completed', county: 'Sussex', square_footage: 2800, start_date: '2025-06-01' },
          { id: '82', name: 'Brock Adkins Barndo Project', customer_name: 'Brock Adkins', building_type: 'Barndominium', budget: 550000, status: 'Completed', county: 'Dorchester', square_footage: 4200, start_date: '2025-08-01' },
          { id: '83', name: 'Jake Sprout Barndo Shell Project', customer_name: 'Jake Sprout', building_type: 'Barndominium', budget: 105000, status: 'Completed', county: 'Sussex', square_footage: 2000, start_date: '2025-08-15' },

          // 2024 Commercial
          { id: '53', name: 'Rick Tucker Project', customer_name: 'Rick Tucker', building_type: 'Commercial', budget: 296300, status: 'Completed', county: 'Sussex', square_footage: 9600, start_date: '2024-02-01' },
          { id: '54', name: 'Bryan and Sons Addition', customer_name: 'Bryan and Sons', building_type: 'Commercial', budget: 130000, status: 'Completed', county: 'Sussex', square_footage: 1080, start_date: '2024-07-01' },
          { id: '55', name: 'Milford Historical Society Project', customer_name: 'Milford Historical Society', building_type: 'Commercial', budget: 250000, status: 'Completed', county: 'Sussex', square_footage: 5000, start_date: '2024-09-01' },
          { id: '56', name: 'EDIS Project', customer_name: 'EDIS', building_type: 'Commercial', budget: 217600, status: 'Completed', county: 'New Castle', square_footage: 6000, start_date: '2024-09-15' },
          { id: '57', name: 'Maddox Reroof Project', customer_name: 'Maddox', building_type: 'Commercial', budget: 23000, status: 'Completed', county: 'New Castle', square_footage: 2000, start_date: '2024-10-01' },
          { id: '58', name: 'Holly Oak - Alycia Reroof', customer_name: 'Holly Oak - Alycia', building_type: 'Commercial', budget: 90800, status: 'Completed', county: 'New Castle', square_footage: 3000, start_date: '2024-11-01' },
          { id: '59', name: 'Taylor Marine Pavilion', customer_name: 'Taylor Marine', building_type: 'Commercial', budget: 45000, status: 'Completed', county: 'Wicomico', square_footage: 1500, start_date: '2024-12-01' },

          // 2025 Projects
          { id: '63', name: 'Johnathon Vanho Project', customer_name: 'Johnathon Vanho', building_type: 'Residential', budget: 68000, status: 'Completed', county: 'Kent', square_footage: 2400, start_date: '2025-01-15' },
          { id: '64', name: 'Alyson and Brad Hudson Garage/Living Space', customer_name: 'Alyson and Brad Hudson', building_type: 'Residential', budget: 65000, status: 'Completed', county: 'Sussex', square_footage: 1500, start_date: '2025-02-10' },
          { id: '65', name: 'Mike McGinnis Project', customer_name: 'Mike McGinnis', building_type: 'Residential', budget: 57000, status: 'Completed', county: 'Somerset', square_footage: 768, start_date: '2025-03-01' },
          { id: '66', name: 'Parker Palmer Equestrian Project', customer_name: 'Parker Palmer', building_type: 'Residential', budget: 70000, status: 'Completed', county: 'Sussex', square_footage: 2400, start_date: '2025-03-05' },
          { id: '67', name: 'Rich Fix Project', customer_name: 'Rich Fix', building_type: 'Residential', budget: 219000, status: 'Completed', county: 'Sussex', square_footage: 1800, start_date: '2025-03-10' },
          { id: '68', name: 'Tracey Wessell Project', customer_name: 'Tracey Wessell', building_type: 'Residential', budget: 57600, status: 'Completed', county: 'Sussex', square_footage: 1600, start_date: '2025-03-15' },
          { id: '69', name: 'John Womack Project', customer_name: 'John Womack', building_type: 'Residential', budget: 42000, status: 'Completed', county: 'Somerset', square_footage: 1200, start_date: '2025-03-20' },
          { id: '70', name: 'Jen & Doug Hamilton Project', customer_name: 'Jen & Doug Hamilton', building_type: 'Residential', budget: 52000, status: 'Completed', county: 'Sussex', square_footage: 864, start_date: '2025-05-01' },
          { id: '72', name: 'Deanna Debrosse Project', customer_name: 'Deanna Debrosse', building_type: 'Residential', budget: 58700, status: 'Completed', county: 'Kent', square_footage: 1200, start_date: '2025-05-15' },
          { id: '74', name: 'Jon Muse Horse Barn Project', customer_name: 'Jon Muse', building_type: 'Residential', budget: 89000, status: 'Completed', county: 'Sussex', square_footage: 1200, start_date: '2025-06-01' },
          { id: '75', name: 'Matt Grason Project', customer_name: 'Matt Grason', building_type: 'Residential', budget: 31000, status: 'Completed', county: 'Kent', square_footage: 864, start_date: '2025-07-01' },
          { id: '76', name: 'JMMC Airplane Hangar', customer_name: 'JMMC', building_type: 'Commercial', budget: 156000, status: 'Completed', county: 'Sussex', square_footage: 5600, start_date: '2025-07-01' },
          { id: '77', name: 'Gary Morris Project', customer_name: 'Gary Morris', building_type: 'Residential', budget: 55000, status: 'Completed', county: 'Kent', square_footage: 2400, start_date: '2025-07-15' }
        ];

        setProjects(completedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return { projects, loading };
};