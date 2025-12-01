export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  rating: number;
  notes?: string;
  createdAt: string;
}

export interface ProjectCosts {
  // COGS subcategories
  metal: number;
  lumber: number;
  doorsWindows: number;
  garageDoors: number;
  flooring: number;
  drywall: number;
  paint: number;
  fixtures: number;
  trim: number;
  // Subcontractor subcategories
  buildingCrew: number;
  concrete: number;
  electric: number;
  plumbing: number;
  hvac: number;
  drywallSub: number;
  painter: number;
  // Other categories
  additionalCogs: number;
  miscellaneous: number;
  materials: number;
  permits: number;
  equipment: number;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  progress: number;
  startDate: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  endDate: string;
  budget: number;
  phase: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  costs?: ProjectCosts;
  budgetCosts?: ProjectCosts;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  dueDate: string;
  createdAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
}

export interface Activity {
  id: string;
  type: 'milestone' | 'document' | 'task' | 'note' | 'invoice' | 'schedule';
  title: string;
  project: string;
  projectId: string;
  time: string;
  status: 'new' | 'completed' | 'pending';
  description?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  date: string;
  status: 'upcoming' | 'completed' | 'overdue';
  description?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  projectId?: string;
  projectName?: string;
  invoiceNumber: string;
  jobType: 'Residential' | 'Barndominium' | 'Commercial';
  issueDate: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export interface ProposalItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Proposal {
  id: string;
  projectName: string;
  customerId: string;
  customerName: string;
  jobType?: 'Residential' | 'Barndominium' | 'Commercial';
  title?: string;
  description?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  items: ProposalItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  proposalNumber?: string;
  createdAt: string;
  validUntil: string;
}

export interface POItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface DesignCategory {
  id: string;
  name: string;
  description?: string;
  required: boolean;
}

export interface DesignOption {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price?: number;
  supplier?: string;
  imageUrl?: string;
}

export interface DesignSelection {
  id: string;
  projectId: string;
  categoryId: string;
  categoryName: string;
  optionId?: string;
  optionName?: string;
  status: 'pending' | 'approved' | 'rejected';
  customerNotes?: string;
  builderNotes?: string;
  createdAt: string;
  updatedAt: string;
}

class DataService {
  private customers: Customer[] = [];
  private vendors: Vendor[] = [];
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private documents: Document[] = [];
  private activities: Activity[] = [];
  private milestones: Milestone[] = [];
  private invoices: Invoice[] = [];
  private proposals: Proposal[] = [];
  private designCategories: DesignCategory[] = [];
  private designOptions: DesignOption[] = [];
  private designSelections: DesignSelection[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      const customersData = localStorage.getItem('barndoBuilder_customers');
      const vendorsData = localStorage.getItem('barndoBuilder_vendors');
      const projectsData = localStorage.getItem('barndoBuilder_projects');
      const tasksData = localStorage.getItem('barndoBuilder_tasks');
      const documentsData = localStorage.getItem('barndoBuilder_documents');
      const activitiesData = localStorage.getItem('barndoBuilder_activities');
      const milestonesData = localStorage.getItem('barndoBuilder_milestones');
      const invoicesData = localStorage.getItem('barndoBuilder_invoices');
      const proposalsData = localStorage.getItem('barndoBuilder_proposals');
      const designCategoriesData = localStorage.getItem('barndoBuilder_designCategories');
      const designOptionsData = localStorage.getItem('barndoBuilder_designOptions');
      const designSelectionsData = localStorage.getItem('barndoBuilder_designSelections');

      if (customersData) this.customers = JSON.parse(customersData);
      if (vendorsData) this.vendors = JSON.parse(vendorsData);
      if (projectsData) this.projects = JSON.parse(projectsData);
      if (tasksData) this.tasks = JSON.parse(tasksData);
      if (documentsData) this.documents = JSON.parse(documentsData);
      if (activitiesData) this.activities = JSON.parse(activitiesData);
      if (milestonesData) this.milestones = JSON.parse(milestonesData);
      if (invoicesData) this.invoices = JSON.parse(invoicesData);
      if (proposalsData) this.proposals = JSON.parse(proposalsData);
      if (designCategoriesData) this.designCategories = JSON.parse(designCategoriesData);
      if (designOptionsData) this.designOptions = JSON.parse(designOptionsData);
      if (designSelectionsData) this.designSelections = JSON.parse(designSelectionsData);
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  private saveData() {
    try {
      localStorage.setItem('barndoBuilder_customers', JSON.stringify(this.customers));
      localStorage.setItem('barndoBuilder_vendors', JSON.stringify(this.vendors));
      localStorage.setItem('barndoBuilder_projects', JSON.stringify(this.projects));
      localStorage.setItem('barndoBuilder_tasks', JSON.stringify(this.tasks));
      localStorage.setItem('barndoBuilder_documents', JSON.stringify(this.documents));
      localStorage.setItem('barndoBuilder_activities', JSON.stringify(this.activities));
      localStorage.setItem('barndoBuilder_milestones', JSON.stringify(this.milestones));
      localStorage.setItem('barndoBuilder_invoices', JSON.stringify(this.invoices));
      localStorage.setItem('barndoBuilder_proposals', JSON.stringify(this.proposals));
      localStorage.setItem('barndoBuilder_designCategories', JSON.stringify(this.designCategories));
      localStorage.setItem('barndoBuilder_designOptions', JSON.stringify(this.designOptions));
      localStorage.setItem('barndoBuilder_designSelections', JSON.stringify(this.designSelections));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }

  initializeData() {
    if (this.customers.length === 0) {
      // Sample customers
      this.customers = [
        {
          id: '1',
          name: 'Mike & Sarah',
          email: 'mike.sarah@email.com',
          phone: '(555) 123-4567',
          address: '123 Ranch Road',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          notes: 'Looking for a 40x60 barndominium with modern finishes',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '(555) 987-6543',
          address: '456 Country Lane',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
          notes: 'Wants energy-efficient features and large workshop area',
          createdAt: new Date().toISOString()
        }
      ];

      // Sample vendors
      this.vendors = [
        {
          id: '1',
          name: 'Steel Pro Construction',
          category: 'Metal Building',
          email: 'info@steelpro.com',
          phone: '(555) 111-2222',
          address: '789 Industrial Blvd',
          city: 'Dallas',
          state: 'TX',
          zip: '75201',
          rating: 4.8,
          notes: 'Excellent steel frame work, reliable delivery',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Elite Concrete Services',
          category: 'Concrete',
          email: 'contact@eliteconcrete.com',
          phone: '(555) 333-4444',
          address: '321 Builder Ave',
          city: 'San Antonio',
          state: 'TX',
          zip: '78201',
          rating: 4.6,
          notes: 'Professional foundation and slab work',
          createdAt: new Date().toISOString()
        }
      ];

      // Sample projects
      this.projects = [
        {
          id: '1',
          name: 'Mike & Sarah Barndominium',
          customerId: '1',
          customerName: 'Mike & Sarah',
          status: 'In Progress',
          progress: 65,
          startDate: '2024-01-15',
          estimatedCompletion: '2024-06-15',
          endDate: '2024-06-15',
          budget: 250000,
          phase: 'Drywall',
          description: '40x60 barndominium with 3 bedrooms, 2 bathrooms, and workshop',
          address: '123 Ranch Road',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          costs: {
            metal: 45000,
            lumber: 25000,
            doorsWindows: 15000,
            garageDoors: 3000,
            flooring: 12000,
            drywall: 8000,
            paint: 4000,
            fixtures: 6000,
            trim: 5000,
            buildingCrew: 35000,
            concrete: 18000,
            electric: 12000,
            plumbing: 10000,
            hvac: 15000,
            drywallSub: 8000,
            painter: 5000,
            additionalCogs: 2000,
            miscellaneous: 3000,
            materials: 5000,
            permits: 2500,
            equipment: 1500
          }
        },
        {
          id: '2',
          name: 'Johnson Workshop Build',
          customerId: '2',
          customerName: 'Sarah Johnson',
          status: 'Planning',
          progress: 15,
          startDate: '2024-03-01',
          estimatedCompletion: '2024-08-01',
          endDate: '2024-08-01',
          budget: 180000,
          phase: 'Permitting',
          description: '30x50 workshop with living quarters',
          address: '456 Country Lane',
          city: 'Houston',
          state: 'TX',
          zip: '77001',
          costs: {
            metal: 0,
            lumber: 0,
            doorsWindows: 0,
            garageDoors: 0,
            flooring: 0,
            drywall: 0,
            paint: 0,
            fixtures: 0,
            trim: 0,
            buildingCrew: 0,
            concrete: 0,
            electric: 0,
            plumbing: 0,
            hvac: 0,
            drywallSub: 0,
            painter: 0,
            additionalCogs: 0,
            miscellaneous: 0,
            materials: 0,
            permits: 1200,
            equipment: 0
          }
        }
      ];

      // Sample invoices for Mike & Sarah - including the new $3,000 paid invoice
      this.invoices = [
        {
          id: '1',
          customerId: '1',
          customerName: 'Mike & Sarah',
          projectId: '1',
          projectName: 'Mike & Sarah Barndominium',
          invoiceNumber: 'INV-001',
          jobType: 'Barndominium',
          issueDate: '2024-01-15',
          dueDate: '2024-02-15',
          status: 'Paid',
          items: [
            {
              id: '1',
              description: 'Foundation and Site Preparation',
              quantity: 1,
              unitPrice: 25000,
              totalPrice: 25000
            }
          ],
          subtotal: 25000,
          tax: 2000,
          total: 27000,
          notes: 'Initial foundation work completed',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          customerId: '1',
          customerName: 'Mike & Sarah',
          projectId: '1',
          projectName: 'Mike & Sarah Barndominium',
          invoiceNumber: 'INV-002',
          jobType: 'Barndominium',
          issueDate: '2024-02-01',
          dueDate: '2024-03-01',
          status: 'Sent',
          items: [
            {
              id: '1',
              description: 'Steel Frame and Roofing',
              quantity: 1,
              unitPrice: 45000,
              totalPrice: 45000
            }
          ],
          subtotal: 45000,
          tax: 3600,
          total: 48600,
          notes: 'Frame installation and roofing materials',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          customerId: '1',
          customerName: 'Mike & Sarah',
          projectId: '1',
          projectName: 'Mike & Sarah Barndominium',
          invoiceNumber: 'INV-003',
          jobType: 'Barndominium',
          issueDate: '2024-02-15',
          dueDate: '2024-03-15',
          status: 'Paid',
          items: [
            {
              id: '1',
              description: 'Interior Framing and Electrical Rough-in',
              quantity: 1,
              unitPrice: 3000,
              totalPrice: 3000
            }
          ],
          subtotal: 3000,
          tax: 240,
          total: 3240,
          notes: 'Interior framing and electrical preparation',
          createdAt: new Date().toISOString()
        }
      ];

      // Sample activities
      this.activities = [
        {
          id: '1',
          type: 'milestone',
          title: 'Foundation completed',
          project: 'Mike & Sarah Barndominium',
          projectId: '1',
          time: '2 days ago',
          status: 'completed',
          description: 'Concrete foundation poured and cured successfully'
        },
        {
          id: '2',
          type: 'document',
          title: 'Permits approved',
          project: 'Johnson Workshop Build',
          projectId: '2',
          time: '1 week ago',
          status: 'completed',
          description: 'All building permits have been approved by the city'
        }
      ];

      this.saveData();
    }
  }

  initializeDesignData() {
    this.initializeData();
    
    // Initialize design categories if they don't exist
    if (this.designCategories.length === 0) {
      this.designCategories = [
        // Structural & Exterior
        { id: 'siding', name: 'Exterior Siding', description: 'Choose your exterior siding material and color', required: true },
        { id: 'roof', name: 'Roofing', description: 'Select roofing material and color', required: true },
        { id: 'garage-doors', name: 'Garage Doors', description: 'Choose garage door style and color', required: true },
        { id: 'entry-doors', name: 'Entry Doors', description: 'Select front and back door styles', required: true },
        { id: 'windows', name: 'Windows', description: 'Choose window styles and colors', required: true },
        
        // Interior Layout & Materials
        { id: 'ceiling-height', name: 'Ceiling Height', description: 'Select ceiling height for main areas', required: true },
        { id: 'interior-walls', name: 'Interior Walls', description: 'Choose interior wall finishes', required: true },
        { id: 'trim-doors', name: 'Trim & Interior Doors', description: 'Select trim style and interior door designs', required: true },
        
        // Flooring
        { id: 'main-flooring', name: 'Main Area Flooring', description: 'Choose flooring for living areas', required: true },
        { id: 'bedroom-flooring', name: 'Bedroom Flooring', description: 'Select bedroom flooring options', required: true },
        { id: 'bathroom-flooring', name: 'Bathroom Flooring', description: 'Choose bathroom flooring', required: true },
        
        // Kitchen
        { id: 'kitchen-cabinets', name: 'Kitchen Cabinets', description: 'Select cabinet style and finish', required: true },
        { id: 'countertops', name: 'Countertops', description: 'Choose countertop material and color', required: true },
        { id: 'backsplash', name: 'Kitchen Backsplash', description: 'Select backsplash tile and design', required: true },
        { id: 'kitchen-sink', name: 'Kitchen Sink & Faucet', description: 'Choose sink and faucet styles', required: true },
        { id: 'kitchen-lighting', name: 'Kitchen Lighting', description: 'Select kitchen lighting fixtures', required: true },
        
        // Bathrooms
        { id: 'bathroom-vanity', name: 'Bathroom Vanities', description: 'Choose vanity styles and finishes', required: true },
        { id: 'shower-tub', name: 'Shower & Tub', description: 'Select shower and tub options', required: true },
        { id: 'bathroom-fixtures', name: 'Bathroom Fixtures', description: 'Choose faucets, lighting, and accessories', required: true },
        
        // Other Spaces
        { id: 'fireplace', name: 'Fireplace', description: 'Choose fireplace style and surround', required: false },
        { id: 'outdoor-features', name: 'Outdoor Features', description: 'Select porch and patio options', required: false }
      ];

      // Initialize design options with updated flooring (LVP instead of hardwood)
      this.designOptions = [
        // Exterior Siding Options
        { id: '1', categoryId: 'siding', name: 'Metal Panel - Charcoal', description: 'Durable steel panels in charcoal gray', price: 8500, supplier: 'Steel Pro Construction' },
        { id: '2', categoryId: 'siding', name: 'Metal Panel - Barn Red', description: 'Classic barn red steel panels', price: 8500, supplier: 'Steel Pro Construction' },
        { id: '3', categoryId: 'siding', name: 'Metal Panel - Forest Green', description: 'Deep forest green steel panels', price: 8500, supplier: 'Steel Pro Construction' },
        
        // Roofing Options
        { id: '4', categoryId: 'roof', name: 'Standing Seam - Forest Green', description: 'Premium standing seam metal roof', price: 12000, supplier: 'Roofing Solutions' },
        { id: '5', categoryId: 'roof', name: 'Standing Seam - Galvanized', description: 'Galvanized standing seam metal roof', price: 11500, supplier: 'Roofing Solutions' },
        { id: '6', categoryId: 'roof', name: 'Standing Seam - Burgundy', description: 'Burgundy standing seam metal roof', price: 12000, supplier: 'Roofing Solutions' },
        
        // Windows & Doors Options
        { id: '7', categoryId: 'windows', name: 'Double-Hung Windows - White', description: 'Energy efficient double-hung windows', price: 15000, supplier: 'Window World' },
        { id: '8', categoryId: 'windows', name: 'Double-Hung Windows - Bronze', description: 'Energy efficient bronze-framed windows', price: 16000, supplier: 'Window World' },
        { id: '9', categoryId: 'entry-doors', name: 'Sliding Glass Doors', description: 'Large sliding glass patio doors', price: 3500, supplier: 'Door Depot' },
        { id: '10', categoryId: 'entry-doors', name: 'French Doors - Wood', description: 'Traditional wooden French doors', price: 4200, supplier: 'Door Depot' },
        
        // Main Area Flooring - LVP Options (replacing hardwood)
        { id: '11', categoryId: 'main-flooring', name: 'LVP - Weathered Oak', description: 'Luxury vinyl plank in weathered oak finish', price: 4500, supplier: 'Premium Floors' },
        { id: '12', categoryId: 'main-flooring', name: 'LVP - Smoky Gray', description: 'Luxury vinyl plank in smoky gray finish', price: 4500, supplier: 'Premium Floors' },
        { id: '13', categoryId: 'main-flooring', name: 'LVP - Rustic Barnwood', description: 'Luxury vinyl plank in rustic barnwood finish', price: 4800, supplier: 'Premium Floors' },
        { id: '14', categoryId: 'main-flooring', name: 'LVP - Natural Maple', description: 'Luxury vinyl plank in natural maple finish', price: 4600, supplier: 'Premium Floors' },
        { id: '15', categoryId: 'main-flooring', name: 'LVP - Charcoal Pine', description: 'Luxury vinyl plank in charcoal pine finish', price: 4700, supplier: 'Premium Floors' },
        
        // Bedroom Flooring
        { id: '16', categoryId: 'bedroom-flooring', name: 'Carpet - Neutral Beige', description: 'Soft carpet in neutral beige', price: 2800, supplier: 'Carpet Plus' },
        { id: '17', categoryId: 'bedroom-flooring', name: 'LVP - Light Oak', description: 'Luxury vinyl plank in light oak', price: 3200, supplier: 'Premium Floors' },
        
        // Bathroom Flooring
        { id: '18', categoryId: 'bathroom-flooring', name: 'Ceramic Tile - Gray', description: 'Water-resistant ceramic tile', price: 1800, supplier: 'Tile World' },
        { id: '19', categoryId: 'bathroom-flooring', name: 'Porcelain Tile - Wood-look', description: 'Wood-look porcelain tile', price: 2200, supplier: 'Tile World' },
        
        // Kitchen Options
        { id: '20', categoryId: 'kitchen-cabinets', name: 'Shaker Style - White', description: 'Classic white shaker cabinets', price: 12000, supplier: 'Cabinet Craft' },
        { id: '21', categoryId: 'kitchen-cabinets', name: 'Shaker Style - Espresso', description: 'Rich espresso shaker cabinets', price: 13000, supplier: 'Cabinet Craft' },
        { id: '22', categoryId: 'countertops', name: 'Quartz - Carrara White', description: 'Elegant white quartz countertops', price: 3500, supplier: 'Stone Solutions' },
        { id: '23', categoryId: 'countertops', name: 'Granite - Black Pearl', description: 'Classic black pearl granite', price: 3200, supplier: 'Stone Solutions' },
        
        // Bathroom Options
        { id: '24', categoryId: 'bathroom-vanity', name: 'Floating Vanity - White', description: 'Modern floating vanity in white', price: 1800, supplier: 'Bath Plus' },
        { id: '25', categoryId: 'bathroom-vanity', name: 'Traditional Vanity - Oak', description: 'Traditional oak vanity with storage', price: 2200, supplier: 'Bath Plus' }
      ];

      // Initialize design selections for Mike & Sarah's project
      this.designSelections = [
        // Structural & Exterior
        { id: '1', projectId: '1', categoryId: 'siding', categoryName: 'Exterior Siding', optionId: '1', optionName: 'Metal Panel - Charcoal', status: 'approved', customerNotes: 'Love the modern look of charcoal', builderNotes: 'Good choice, matches the roof color', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', projectId: '1', categoryId: 'roof', categoryName: 'Roofing', optionId: '4', optionName: 'Standing Seam - Forest Green', status: 'pending', customerNotes: 'Considering this or the galvanized option', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '3', projectId: '1', categoryId: 'windows', categoryName: 'Windows', status: 'pending', customerNotes: 'Still deciding between window styles', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '4', projectId: '1', categoryId: 'entry-doors', categoryName: 'Entry Doors', status: 'pending', customerNotes: 'Looking at both sliding glass and French door options', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        
        // Interior Layout & Materials
        { id: '5', projectId: '1', categoryId: 'ceiling-height', categoryName: 'Ceiling Height', status: 'pending', customerNotes: 'Considering 10ft or 12ft ceilings for main area', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        
        // Flooring - Updated with LVP options
        { id: '6', projectId: '1', categoryId: 'main-flooring', categoryName: 'Main Area Flooring', optionId: '11', optionName: 'LVP - Weathered Oak', status: 'approved', customerNotes: 'Perfect for our rustic modern style', builderNotes: 'Excellent choice, very durable', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '7', projectId: '1', categoryId: 'bedroom-flooring', categoryName: 'Bedroom Flooring', status: 'pending', customerNotes: 'Deciding between carpet and LVP for bedrooms', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '8', projectId: '1', categoryId: 'bathroom-flooring', categoryName: 'Bathroom Flooring', optionId: '19', optionName: 'Porcelain Tile - Wood-look', status: 'approved', customerNotes: 'Matches the main flooring perfectly', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        
        // Kitchen
        { id: '9', projectId: '1', categoryId: 'kitchen-cabinets', categoryName: 'Kitchen Cabinets', status: 'pending', customerNotes: 'Torn between white and espresso cabinets', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '10', projectId: '1', categoryId: 'countertops', categoryName: 'Countertops', optionId: '22', optionName: 'Quartz - Carrara White', status: 'approved', customerNotes: 'Beautiful white quartz will brighten the kitchen', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        
        // Bathrooms
        { id: '11', projectId: '1', categoryId: 'bathroom-vanity', categoryName: 'Bathroom Vanities', status: 'pending', customerNotes: 'Looking at modern floating vs traditional styles', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];

      this.saveData();
    }
  }

  // Customer methods
  getCustomers(): Customer[] {
    return this.customers;
  }

  getCustomer(id: string): Customer | undefined {
    return this.customers.find(c => c.id === id);
  }

  addCustomer(customer: Omit<Customer, 'id'>): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.customers.push(newCustomer);
    this.saveData();
    return newCustomer;
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const index = this.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.customers[index] = { ...this.customers[index], ...updates };
      this.saveData();
      return this.customers[index];
    }
    return null;
  }

  deleteCustomer(id: string): boolean {
    const index = this.customers.findIndex(c => c.id === id);
    if (index !== -1) {
      this.customers.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Vendor methods
  getVendors(): Vendor[] {
    return this.vendors;
  }

  getVendor(id: string): Vendor | undefined {
    return this.vendors.find(v => v.id === id);
  }

  addVendor(vendor: Omit<Vendor, 'id'>): Vendor {
    const newVendor: Vendor = {
      ...vendor,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.vendors.push(newVendor);
    this.saveData();
    return newVendor;
  }

  updateVendor(id: string, updates: Partial<Vendor>): Vendor | null {
    const index = this.vendors.findIndex(v => v.id === id);
    if (index !== -1) {
      this.vendors[index] = { ...this.vendors[index], ...updates };
      this.saveData();
      return this.vendors[index];
    }
    return null;
  }

  deleteVendor(id: string): boolean {
    const index = this.vendors.findIndex(v => v.id === id);
    if (index !== -1) {
      this.vendors.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Project methods
  getProjects(): Project[] {
    return this.projects;
  }

  getProject(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  addProject(project: Omit<Project, 'id'>): Project {
    const newProject: Project = {
      ...project,
      id: Date.now().toString()
    };
    this.projects.push(newProject);
    this.saveData();
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects[index] = { ...this.projects[index], ...updates };
      this.saveData();
      return this.projects[index];
    }
    return null;
  }

  updateProjectCosts(id: string, costs: ProjectCosts): Project | null {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects[index] = { ...this.projects[index], costs };
      this.saveData();
      return this.projects[index];
    }
    return null;
  }

  updateProjectBudgetCosts(id: string, budgetCosts: ProjectCosts): Project | null {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects[index] = { ...this.projects[index], budgetCosts };
      this.saveData();
      return this.projects[index];
    }
    return null;
  }

  deleteProject(id: string): boolean {
    const index = this.projects.findIndex(p => p.id === id);
    if (index !== -1) {
      this.projects.splice(index, 1);
      // Also delete related tasks, documents, and milestones
      this.tasks = this.tasks.filter(t => t.projectId !== id);
      this.documents = this.documents.filter(d => d.projectId !== id);
      this.milestones = this.milestones.filter(m => m.projectId !== id);
      this.saveData();
      return true;
    }
    return false;
  }

  // Task methods
  getTasks(projectId: string): Task[] {
    return this.tasks.filter(t => t.projectId === projectId);
  }

  addTask(task: Omit<Task, 'id'>): Task {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.saveData();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      this.saveData();
      return this.tasks[index];
    }
    return null;
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Document methods
  getDocuments(projectId: string): Document[] {
    return this.documents.filter(d => d.projectId === projectId);
  }

  addDocument(document: Omit<Document, 'id'>): Document {
    const newDocument: Document = {
      ...document,
      id: Date.now().toString(),
      uploadedAt: new Date().toISOString()
    };
    this.documents.push(newDocument);
    this.saveData();
    return newDocument;
  }

  deleteDocument(id: string): boolean {
    const index = this.documents.findIndex(d => d.id === id);
    if (index !== -1) {
      this.documents.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Activity methods
  getActivities(): Activity[] {
    return this.activities.sort((a, b) => {
      // Sort by time, most recent first
      const timeA = a.time === 'just now' || a.time === 'Just now' ? Date.now() : 
                   a.time.includes('ago') ? Date.now() - this.parseTimeAgo(a.time) : 0;
      const timeB = b.time === 'just now' || b.time === 'Just now' ? Date.now() : 
                   b.time.includes('ago') ? Date.now() - this.parseTimeAgo(b.time) : 0;
      return timeB - timeA;
    });
  }

  private parseTimeAgo(timeStr: string): number {
    const match = timeStr.match(/(\d+)\s+(minute|hour|day|week)s?\s+ago/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'minute': return value * 60 * 1000;
      case 'hour': return value * 60 * 60 * 1000;
      case 'day': return value * 24 * 60 * 60 * 1000;
      case 'week': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  }

  addActivity(activity: Omit<Activity, 'id'>): Activity {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString()
    };
    this.activities.push(newActivity);
    this.saveData();
    return newActivity;
  }

  // Milestone methods
  getMilestones(projectId?: string): Milestone[] {
    if (projectId) {
      return this.milestones.filter(m => m.projectId === projectId);
    }
    return this.milestones;
  }

  addMilestone(milestone: Omit<Milestone, 'id'>): Milestone {
    const newMilestone: Milestone = {
      ...milestone,
      id: Date.now().toString()
    };
    this.milestones.push(newMilestone);
    this.saveData();
    return newMilestone;
  }

  updateMilestone(id: string, updates: Partial<Milestone>): Milestone | null {
    const index = this.milestones.findIndex(m => m.id === id);
    if (index !== -1) {
      this.milestones[index] = { ...this.milestones[index], ...updates };
      this.saveData();
      return this.milestones[index];
    }
    return null;
  }

  deleteMilestone(id: string): boolean {
    const index = this.milestones.findIndex(m => m.id === id);
    if (index !== -1) {
      this.milestones.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Invoice methods
  getInvoices(): Invoice[] {
    return this.invoices;
  }

  addInvoice(invoice: Omit<Invoice, 'id'>): Invoice {
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.invoices.push(newInvoice);
    this.saveData();
    return newInvoice;
  }

  updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      this.invoices[index] = { ...this.invoices[index], ...updates };
      this.saveData();
      return this.invoices[index];
    }
    return null;
  }

  deleteInvoice(id: string): boolean {
    const index = this.invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      this.invoices.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  // Proposal methods
  getProposals(): Proposal[] {
    return this.proposals;
  }

  addProposal(proposal: Omit<Proposal, 'id'>): Proposal {
    const newProposal: Proposal = {
      ...proposal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.proposals.push(newProposal);
    this.saveData();
    return newProposal;
  }

  updateProposal(id: string, updates: Partial<Proposal>): Proposal | null {
    const index = this.proposals.findIndex(p => p.id === id);
    if (index !== -1) {
      this.proposals[index] = { ...this.proposals[index], ...updates };
      this.saveData();
      return this.proposals[index];
    }
    return null;
  }

  deleteProposal(id: string): boolean {
    const index = this.proposals.findIndex(p => p.id === id);
    if (index !== -1) {
      this.proposals.splice(index, 1);
      this.saveData();
      return true;
    }
    return false;
  }

  convertProposalToJob(proposalId: string): Project | null {
    const proposal = this.proposals.find(p => p.id === proposalId);
    if (!proposal) return null;

    const customer = this.customers.find(c => c.id === proposal.customerId);
    if (!customer) return null;

    const newProject: Project = {
      id: Date.now().toString(),
      name: proposal.projectName,
      customerId: proposal.customerId,
      customerName: proposal.customerName,
      status: 'Planning',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      estimatedCompletion: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: proposal.total,
      phase: 'Planning',
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      costs: {
        metal: 0, lumber: 0, doorsWindows: 0, garageDoors: 0, flooring: 0,
        drywall: 0, paint: 0, fixtures: 0, trim: 0, buildingCrew: 0,
        concrete: 0, electric: 0, plumbing: 0, hvac: 0, drywallSub: 0,
        painter: 0, additionalCogs: 0, miscellaneous: 0, materials: 0,
        permits: 0, equipment: 0
      }
    };

    this.projects.push(newProject);
    this.updateProposal(proposalId, { status: 'Accepted' });
    this.saveData();
    return newProject;
  }

  // Purchase Order methods
  addPurchaseOrder(po: any): any {
    // Placeholder implementation
    console.log('Purchase order created:', po);
    return po;
  }

  // Design methods
  getDesignCategories(): DesignCategory[] {
    return this.designCategories;
  }

  getDesignOptions(categoryId?: string): DesignOption[] {
    if (categoryId) {
      return this.designOptions.filter(o => o.categoryId === categoryId);
    }
    return this.designOptions;
  }

  getDesignSelections(projectId: string): DesignSelection[] {
    return this.designSelections.filter(s => s.projectId === projectId);
  }

  updateDesignSelection(selectionId: string, updates: Partial<DesignSelection>): DesignSelection | null {
    const index = this.designSelections.findIndex(s => s.id === selectionId);
    if (index !== -1) {
      this.designSelections[index] = { ...this.designSelections[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveData();
      return this.designSelections[index];
    }
    return null;
  }

  getFinancialSummary() {
    const projects = this.getProjects();
    const totalRevenue = projects.reduce((sum, project) => sum + project.budget, 0);
    const pendingRevenue = projects
      .filter(p => p.status === 'Planning' || p.status === 'In Progress')
      .reduce((sum, project) => sum + project.budget, 0);
    
    // Calculate total costs and profit
    const totalCosts = projects.reduce((sum, project) => {
      const costs = project.costs || {} as ProjectCosts;
      const projectCosts = (costs.metal || 0) + (costs.lumber || 0) + (costs.doorsWindows || 0) +
                          (costs.garageDoors || 0) + (costs.flooring || 0) + (costs.drywall || 0) +
                          (costs.paint || 0) + (costs.fixtures || 0) + (costs.trim || 0) +
                          (costs.buildingCrew || 0) + (costs.concrete || 0) + (costs.electric || 0) +
                          (costs.plumbing || 0) + (costs.hvac || 0) + (costs.drywallSub || 0) +
                          (costs.painter || 0) + (costs.additionalCogs || 0) + (costs.miscellaneous || 0) +
                          (costs.materials || 0) + (costs.permits || 0) + (costs.equipment || 0);
      return sum + projectCosts;
    }, 0);
    
    const totalProfit = totalRevenue - totalCosts;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      pendingRevenue,
      totalProfit,
      averageMargin
    };
  }
}

export const dataService = new DataService();
