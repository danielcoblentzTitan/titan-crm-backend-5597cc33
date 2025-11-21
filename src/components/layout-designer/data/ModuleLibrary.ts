// Module data structure for premade room layouts
export interface Fixture {
  id: string;
  type: string;
  symbol: string;
  position: { x: number; y: number }; // inches from module origin
  dimensions: { width: number; height: number; depth?: number }; // in inches
  rotation: number; // degrees
  properties: Record<string, any>;
}

export interface Wall {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness: number; // inches
  type: 'interior' | 'exterior';
}

export interface ModuleVariant {
  id: string;
  name: string;
  description: string;
  fixtures: Fixture[];
  requiredSpace?: { width: number; height: number };
}

export interface ClearanceRule {
  fromFixture: string;
  toFixture: string;
  minimumDistance: number; // inches
  direction?: 'front' | 'back' | 'left' | 'right' | 'all';
}

export interface Module {
  id: string;
  name: string;
  category: 'bathroom' | 'bedroom' | 'kitchen' | 'building';
  thumbnail: string;
  fixtures: Fixture[];
  walls: Wall[];
  dimensions: { width: number; height: number }; // in inches
  variants: ModuleVariant[];
  clearances: ClearanceRule[];
  description: string;
}

// Premade bathroom layouts
export const bathroomModules: Module[] = [
  {
    id: 'powder_room',
    name: 'Powder Room',
    category: 'bathroom',
    thumbnail: '/api/placeholder/150/100',
    description: 'Compact half bath with toilet and sink',
    dimensions: { width: 60, height: 84 },
    fixtures: [
      {
        id: 'toilet_1',
        type: 'toilet',
        symbol: 'bathroom_toilet',
        position: { x: 15, y: 30 },
        dimensions: { width: 30, height: 42 },
        rotation: 0,
        properties: { model: 'standard' }
      },
      {
        id: 'sink_1',
        type: 'sink',
        symbol: 'bathroom_sink',
        position: { x: 18, y: 6 },
        dimensions: { width: 24, height: 18 },
        rotation: 0,
        properties: { style: 'pedestal' }
      }
    ],
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 60, y: 0 }, thickness: 6, type: 'interior' },
      { id: 'w2', start: { x: 60, y: 0 }, end: { x: 60, y: 84 }, thickness: 6, type: 'interior' },
      { id: 'w3', start: { x: 60, y: 84 }, end: { x: 0, y: 84 }, thickness: 6, type: 'interior' },
      { id: 'w4', start: { x: 0, y: 84 }, end: { x: 0, y: 0 }, thickness: 6, type: 'interior' }
    ],
    variants: [
      {
        id: 'powder_compact',
        name: 'Compact',
        description: 'Wall-mounted sink for tighter spaces',
        fixtures: [
          {
            id: 'toilet_1',
            type: 'toilet',
            symbol: 'bathroom_toilet',
            position: { x: 15, y: 30 },
            dimensions: { width: 30, height: 42 },
            rotation: 0,
            properties: { model: 'compact' }
          },
          {
            id: 'sink_1',
            type: 'sink',
            symbol: 'bathroom_sink',
            position: { x: 18, y: 6 },
            dimensions: { width: 20, height: 16 },
            rotation: 0,
            properties: { style: 'wall-mounted' }
          }
        ],
        requiredSpace: { width: 54, height: 84 }
      }
    ],
    clearances: [
      { fromFixture: 'toilet', toFixture: 'sink', minimumDistance: 15, direction: 'all' },
      { fromFixture: 'toilet', toFixture: 'wall', minimumDistance: 15, direction: 'front' }
    ]
  },

  {
    id: 'full_bath',
    name: 'Full Bath',
    category: 'bathroom',
    thumbnail: '/api/placeholder/150/100',
    description: 'Standard full bathroom with tub/shower combo',
    dimensions: { width: 96, height: 108 },
    fixtures: [
      {
        id: 'bathtub_1',
        type: 'bathtub',
        symbol: 'bathroom_bathtub',
        position: { x: 6, y: 6 },
        dimensions: { width: 60, height: 30 },
        rotation: 0,
        properties: { type: 'alcove', hasShower: true }
      },
      {
        id: 'toilet_1',
        type: 'toilet',
        symbol: 'bathroom_toilet',
        position: { x: 18, y: 60 },
        dimensions: { width: 30, height: 42 },
        rotation: 0,
        properties: { model: 'standard' }
      },
      {
        id: 'vanity_1',
        type: 'vanity',
        symbol: 'bathroom_vanity',
        position: { x: 54, y: 60 },
        dimensions: { width: 36, height: 22 },
        rotation: 0,
        properties: { sinks: 1, style: 'standard' }
      }
    ],
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 96, y: 0 }, thickness: 6, type: 'interior' },
      { id: 'w2', start: { x: 96, y: 0 }, end: { x: 96, y: 108 }, thickness: 6, type: 'interior' },
      { id: 'w3', start: { x: 96, y: 108 }, end: { x: 0, y: 108 }, thickness: 6, type: 'interior' },
      { id: 'w4', start: { x: 0, y: 108 }, end: { x: 0, y: 0 }, thickness: 6, type: 'interior' }
    ],
    variants: [
      {
        id: 'full_bath_shower',
        name: 'Shower Only',
        description: 'Replace tub with standalone shower',
        fixtures: [
          {
            id: 'shower_1',
            type: 'shower',
            symbol: 'bathroom_shower',
            position: { x: 6, y: 6 },
            dimensions: { width: 36, height: 36 },
            rotation: 0,
            properties: { type: 'corner' }
          },
          {
            id: 'toilet_1',
            type: 'toilet',
            symbol: 'bathroom_toilet',
            position: { x: 18, y: 60 },
            dimensions: { width: 30, height: 42 },
            rotation: 0,
            properties: { model: 'standard' }
          },
          {
            id: 'vanity_1',
            type: 'vanity',
            symbol: 'bathroom_vanity',
            position: { x: 54, y: 60 },
            dimensions: { width: 36, height: 22 },
            rotation: 0,
            properties: { sinks: 1, style: 'standard' }
          }
        ]
      }
    ],
    clearances: [
      { fromFixture: 'toilet', toFixture: 'vanity', minimumDistance: 15, direction: 'all' },
      { fromFixture: 'bathtub', toFixture: 'toilet', minimumDistance: 24, direction: 'all' }
    ]
  },

  {
    id: 'master_bath',
    name: 'Master Bath',
    category: 'bathroom',
    thumbnail: '/api/placeholder/150/100',
    description: 'Luxury master bathroom with double vanity and separate shower',
    dimensions: { width: 144, height: 120 },
    fixtures: [
      {
        id: 'vanity_1',
        type: 'vanity',
        symbol: 'bathroom_vanity',
        position: { x: 6, y: 90 },
        dimensions: { width: 72, height: 24 },
        rotation: 0,
        properties: { sinks: 2, style: 'double' }
      },
      {
        id: 'shower_1',
        type: 'shower',
        symbol: 'bathroom_shower',
        position: { x: 96, y: 6 },
        dimensions: { width: 42, height: 48 },
        rotation: 0,
        properties: { type: 'walk-in' }
      },
      {
        id: 'bathtub_1',
        type: 'bathtub',
        symbol: 'bathroom_bathtub',
        position: { x: 6, y: 6 },
        dimensions: { width: 72, height: 36 },
        rotation: 0,
        properties: { type: 'freestanding' }
      },
      {
        id: 'toilet_1',
        type: 'toilet',
        symbol: 'bathroom_toilet',
        position: { x: 96, y: 66 },
        dimensions: { width: 30, height: 42 },
        rotation: 0,
        properties: { model: 'comfort-height' }
      }
    ],
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 144, y: 0 }, thickness: 6, type: 'interior' },
      { id: 'w2', start: { x: 144, y: 0 }, end: { x: 144, y: 120 }, thickness: 6, type: 'interior' },
      { id: 'w3', start: { x: 144, y: 120 }, end: { x: 0, y: 120 }, thickness: 6, type: 'interior' },
      { id: 'w4', start: { x: 0, y: 120 }, end: { x: 0, y: 0 }, thickness: 6, type: 'interior' }
    ],
    variants: [
      {
        id: 'master_bath_his_hers',
        name: 'His & Hers',
        description: 'Separate vanities for each person',
        fixtures: [
          {
            id: 'vanity_1',
            type: 'vanity',
            symbol: 'bathroom_vanity',
            position: { x: 6, y: 90 },
            dimensions: { width: 36, height: 24 },
            rotation: 0,
            properties: { sinks: 1, style: 'his' }
          },
          {
            id: 'vanity_2',
            type: 'vanity',
            symbol: 'bathroom_vanity',
            position: { x: 54, y: 90 },
            dimensions: { width: 36, height: 24 },
            rotation: 0,
            properties: { sinks: 1, style: 'hers' }
          },
          {
            id: 'shower_1',
            type: 'shower',
            symbol: 'bathroom_shower',
            position: { x: 96, y: 6 },
            dimensions: { width: 42, height: 48 },
            rotation: 0,
            properties: { type: 'walk-in' }
          },
          {
            id: 'bathtub_1',
            type: 'bathtub',
            symbol: 'bathroom_bathtub',
            position: { x: 6, y: 6 },
            dimensions: { width: 72, height: 36 },
            rotation: 0,
            properties: { type: 'freestanding' }
          },
          {
            id: 'toilet_1',
            type: 'toilet',
            symbol: 'bathroom_toilet',
            position: { x: 96, y: 66 },
            dimensions: { width: 30, height: 42 },
            rotation: 0,
            properties: { model: 'comfort-height' }
          }
        ]
      }
    ],
    clearances: []
  }
];

// Premade kitchen layouts
export const kitchenModules: Module[] = [
  {
    id: 'galley_kitchen',
    name: 'Galley Kitchen',
    category: 'kitchen',
    thumbnail: '/api/placeholder/150/100',
    description: 'Efficient galley-style kitchen layout',
    dimensions: { width: 96, height: 144 },
    fixtures: [
      {
        id: 'refrigerator_1',
        type: 'refrigerator',
        symbol: 'kitchen_refrigerator',
        position: { x: 6, y: 6 },
        dimensions: { width: 36, height: 24 },
        rotation: 0,
        properties: { size: 'standard' }
      },
      {
        id: 'stove_1',
        type: 'stove',
        symbol: 'kitchen_stove',
        position: { x: 54, y: 6 },
        dimensions: { width: 30, height: 24 },
        rotation: 0,
        properties: { type: 'electric' }
      },
      {
        id: 'sink_1',
        type: 'kitchen_sink',
        symbol: 'kitchen_kitchenSink',
        position: { x: 54, y: 114 },
        dimensions: { width: 33, height: 24 },
        rotation: 0,
        properties: { bowls: 2 }
      },
      {
        id: 'dishwasher_1',
        type: 'dishwasher',
        symbol: 'kitchen_dishwasher',
        position: { x: 6, y: 114 },
        dimensions: { width: 24, height: 24 },
        rotation: 0,
        properties: { type: 'built-in' }
      }
    ],
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 96, y: 0 }, thickness: 6, type: 'interior' },
      { id: 'w2', start: { x: 96, y: 0 }, end: { x: 96, y: 144 }, thickness: 6, type: 'interior' },
      { id: 'w3', start: { x: 96, y: 144 }, end: { x: 0, y: 144 }, thickness: 6, type: 'interior' },
      { id: 'w4', start: { x: 0, y: 144 }, end: { x: 0, y: 0 }, thickness: 6, type: 'interior' }
    ],
    variants: [
      {
        id: 'galley_gas',
        name: 'Gas Range',
        description: 'Replace electric stove with gas range',
        fixtures: [
          {
            id: 'refrigerator_1',
            type: 'refrigerator',
            symbol: 'kitchen_refrigerator',
            position: { x: 6, y: 6 },
            dimensions: { width: 36, height: 24 },
            rotation: 0,
            properties: { size: 'standard' }
          },
          {
            id: 'stove_1',
            type: 'stove',
            symbol: 'kitchen_stove',
            position: { x: 54, y: 6 },
            dimensions: { width: 30, height: 24 },
            rotation: 0,
            properties: { type: 'gas' }
          },
          {
            id: 'sink_1',
            type: 'kitchen_sink',
            symbol: 'kitchen_kitchenSink',
            position: { x: 54, y: 114 },
            dimensions: { width: 33, height: 24 },
            rotation: 0,
            properties: { bowls: 2 }
          },
          {
            id: 'dishwasher_1',
            type: 'dishwasher',
            symbol: 'kitchen_dishwasher',
            position: { x: 6, y: 114 },
            dimensions: { width: 24, height: 24 },
            rotation: 0,
            properties: { type: 'built-in' }
          }
        ]
      }
    ],
    clearances: [
      { fromFixture: 'refrigerator', toFixture: 'stove', minimumDistance: 12, direction: 'all' },
      { fromFixture: 'sink', toFixture: 'dishwasher', minimumDistance: 6, direction: 'all' }
    ]
  },

  {
    id: 'l_shape_kitchen',
    name: 'L-Shape Kitchen',
    category: 'kitchen',
    thumbnail: '/api/placeholder/150/100',
    description: 'Popular L-shaped kitchen with island option',
    dimensions: { width: 168, height: 144 },
    fixtures: [
      {
        id: 'refrigerator_1',
        type: 'refrigerator',
        symbol: 'kitchen_refrigerator',
        position: { x: 6, y: 6 },
        dimensions: { width: 36, height: 24 },
        rotation: 0,
        properties: { size: 'standard' }
      },
      {
        id: 'stove_1',
        type: 'stove',
        symbol: 'kitchen_stove',
        position: { x: 78, y: 6 },
        dimensions: { width: 30, height: 24 },
        rotation: 0,
        properties: { type: 'electric' }
      },
      {
        id: 'sink_1',
        type: 'kitchen_sink',
        symbol: 'kitchen_kitchenSink',
        position: { x: 6, y: 84 },
        dimensions: { width: 33, height: 24 },
        rotation: 90,
        properties: { bowls: 2 }
      },
      {
        id: 'dishwasher_1',
        type: 'dishwasher',
        symbol: 'kitchen_dishwasher',
        position: { x: 6, y: 54 },
        dimensions: { width: 24, height: 24 },
        rotation: 90,
        properties: { type: 'built-in' }
      }
    ],
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 168, y: 0 }, thickness: 6, type: 'interior' },
      { id: 'w2', start: { x: 168, y: 0 }, end: { x: 168, y: 144 }, thickness: 6, type: 'interior' },
      { id: 'w3', start: { x: 168, y: 144 }, end: { x: 0, y: 144 }, thickness: 6, type: 'interior' },
      { id: 'w4', start: { x: 0, y: 144 }, end: { x: 0, y: 0 }, thickness: 6, type: 'interior' }
    ],
    variants: [],
    clearances: []
  }
];

// Premade bedroom layouts
export const bedroomModules: Module[] = [
  {
    id: 'small_bedroom',
    name: 'Small Bedroom',
    category: 'bedroom',
    thumbnail: '/api/placeholder/150/100',
    description: 'Compact bedroom with essential furniture',
    dimensions: { width: 120, height: 144 },
    fixtures: [
      {
        id: 'bed_1',
        type: 'bed',
        symbol: 'bedroom_bed',
        position: { x: 30, y: 30 },
        dimensions: { width: 60, height: 80 },
        rotation: 0,
        properties: { size: 'queen' }
      },
      {
        id: 'dresser_1',
        type: 'dresser',
        symbol: 'bedroom_dresser',
        position: { x: 30, y: 120 },
        dimensions: { width: 60, height: 18 },
        rotation: 0,
        properties: { drawers: 6 }
      },
      {
        id: 'closet_1',
        type: 'closet',
        symbol: 'bedroom_closet',
        position: { x: 96, y: 30 },
        dimensions: { width: 18, height: 72 },
        rotation: 0,
        properties: { type: 'reach-in' }
      }
    ],
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 120, y: 0 }, thickness: 6, type: 'interior' },
      { id: 'w2', start: { x: 120, y: 0 }, end: { x: 120, y: 144 }, thickness: 6, type: 'interior' },
      { id: 'w3', start: { x: 120, y: 144 }, end: { x: 0, y: 144 }, thickness: 6, type: 'interior' },
      { id: 'w4', start: { x: 0, y: 144 }, end: { x: 0, y: 0 }, thickness: 6, type: 'interior' }
    ],
    variants: [
      {
        id: 'small_bedroom_full',
        name: 'Full Bed',
        description: 'Replace queen bed with full size',
        fixtures: [
          {
            id: 'bed_1',
            type: 'bed',
            symbol: 'bedroom_bed',
            position: { x: 33, y: 30 },
            dimensions: { width: 54, height: 75 },
            rotation: 0,
            properties: { size: 'full' }
          },
          {
            id: 'dresser_1',
            type: 'dresser',
            symbol: 'bedroom_dresser',
            position: { x: 30, y: 120 },
            dimensions: { width: 60, height: 18 },
            rotation: 0,
            properties: { drawers: 6 }
          },
          {
            id: 'closet_1',
            type: 'closet',
            symbol: 'bedroom_closet',
            position: { x: 96, y: 30 },
            dimensions: { width: 18, height: 72 },
            rotation: 0,
            properties: { type: 'reach-in' }
          }
        ]
      }
    ],
    clearances: [
      { fromFixture: 'bed', toFixture: 'dresser', minimumDistance: 36, direction: 'all' },
      { fromFixture: 'bed', toFixture: 'closet', minimumDistance: 24, direction: 'all' }
    ]
  },

  {
    id: 'master_bedroom',
    name: 'Master Bedroom',
    category: 'bedroom',
    thumbnail: '/api/placeholder/150/100',
    description: 'Spacious master bedroom with walk-in closet',
    dimensions: { width: 192, height: 168 },
    fixtures: [
      {
        id: 'bed_1',
        type: 'bed',
        symbol: 'bedroom_bed',
        position: { x: 58, y: 44 },
        dimensions: { width: 76, height: 80 },
        rotation: 0,
        properties: { size: 'king' }
      },
      {
        id: 'dresser_1',
        type: 'dresser',
        symbol: 'bedroom_dresser',
        position: { x: 12, y: 44 },
        dimensions: { width: 20, height: 60 },
        rotation: 90,
        properties: { drawers: 6 }
      },
      {
        id: 'dresser_2',
        type: 'dresser',
        symbol: 'bedroom_dresser',
        position: { x: 150, y: 44 },
        dimensions: { width: 20, height: 60 },
        rotation: 90,
        properties: { drawers: 6 }
      },
      {
        id: 'closet_1',
        type: 'closet',
        symbol: 'bedroom_closet',
        position: { x: 12, y: 132 },
        dimensions: { width: 168, height: 30 },
        rotation: 0,
        properties: { type: 'walk-in' }
      }
    ],
    walls: [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 192, y: 0 }, thickness: 6, type: 'interior' },
      { id: 'w2', start: { x: 192, y: 0 }, end: { x: 192, y: 168 }, thickness: 6, type: 'interior' },
      { id: 'w3', start: { x: 192, y: 168 }, end: { x: 0, y: 168 }, thickness: 6, type: 'interior' },
      { id: 'w4', start: { x: 0, y: 168 }, end: { x: 0, y: 0 }, thickness: 6, type: 'interior' }
    ],
    variants: [],
    clearances: []
  }
];

// Standard building footprints (dimensions in feet converted to inches)
export const buildingModules: Module[] = [
  {
    id: 'building_40x40',
    name: '40\' × 40\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Small shop or garage - 1,600 sq ft',
    dimensions: { width: 480, height: 480 }, // 40' × 40' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 480, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 480, y: 0 }, end: { x: 480, y: 480 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 480, y: 480 }, end: { x: 0, y: 480 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 480 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  },
  {
    id: 'building_40x50',
    name: '40\' × 50\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Medium residential or shop - 2,000 sq ft',
    dimensions: { width: 480, height: 600 }, // 40' × 50' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 480, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 480, y: 0 }, end: { x: 480, y: 600 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 480, y: 600 }, end: { x: 0, y: 600 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 600 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  },
  {
    id: 'building_40x60',
    name: '40\' × 60\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Large residential - 2,400 sq ft',
    dimensions: { width: 480, height: 720 }, // 40' × 60' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 480, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 480, y: 0 }, end: { x: 480, y: 720 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 480, y: 720 }, end: { x: 0, y: 720 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 720 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  },
  {
    id: 'building_50x50',
    name: '50\' × 50\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Square commercial - 2,500 sq ft',
    dimensions: { width: 600, height: 600 }, // 50' × 50' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 600, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 600, y: 0 }, end: { x: 600, y: 600 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 600, y: 600 }, end: { x: 0, y: 600 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 600 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  },
  {
    id: 'building_50x100',
    name: '50\' × 100\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Rectangular commercial - 5,000 sq ft',
    dimensions: { width: 600, height: 1200 }, // 50' × 100' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 600, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 600, y: 0 }, end: { x: 600, y: 1200 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 600, y: 1200 }, end: { x: 0, y: 1200 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 1200 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  },
  {
    id: 'building_50x120',
    name: '50\' × 120\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Large commercial - 6,000 sq ft',
    dimensions: { width: 600, height: 1440 }, // 50' × 120' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 600, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 600, y: 0 }, end: { x: 600, y: 1440 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 600, y: 1440 }, end: { x: 0, y: 1440 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 1440 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  },
  {
    id: 'building_60x100',
    name: '60\' × 100\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Wide commercial - 6,000 sq ft',
    dimensions: { width: 720, height: 1200 }, // 60' × 100' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 720, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 720, y: 0 }, end: { x: 720, y: 1200 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 720, y: 1200 }, end: { x: 0, y: 1200 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 1200 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  },
  {
    id: 'building_60x120',
    name: '60\' × 120\'',
    category: 'building',
    thumbnail: '/api/placeholder/150/100',
    description: 'Large warehouse - 7,200 sq ft',
    dimensions: { width: 720, height: 1440 }, // 60' × 120' in inches
    fixtures: [],
    walls: [
      { id: 'ext_w1', start: { x: 0, y: 0 }, end: { x: 720, y: 0 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w2', start: { x: 720, y: 0 }, end: { x: 720, y: 1440 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w3', start: { x: 720, y: 1440 }, end: { x: 0, y: 1440 }, thickness: 6, type: 'exterior' },
      { id: 'ext_w4', start: { x: 0, y: 1440 }, end: { x: 0, y: 0 }, thickness: 6, type: 'exterior' }
    ],
    variants: [],
    clearances: []
  }
];

// Export all modules
export const allModules = [
  ...bathroomModules,
  ...kitchenModules,
  ...bedroomModules,
  ...buildingModules
];

// Helper functions
export const getModulesByCategory = (category: string) => {
  return allModules.filter(module => module.category === category);
};

export const getModuleById = (id: string) => {
  return allModules.find(module => module.id === id);
};