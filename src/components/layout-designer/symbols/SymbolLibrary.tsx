import React from 'react';

// Professional SVG symbols for architectural elements
export const SymbolLibrary = {
  // Door symbols with proper swings
  doors: {
    singleDoor: (width: number = 36, swing: 'left' | 'right' = 'right') => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="6" fill="#000000" />
          <path d="M ${swing === 'right' ? width : 0} 3 A ${width} ${width} 0 0 ${swing === 'right' ? 1 : 0} ${swing === 'right' ? width/2 : width/2} ${swing === 'right' ? -width + 3 : width + 3}" 
                stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,3" fill="none" />
        </g>
      `,
      width,
      height: Math.max(width, 6),
      name: 'Single Door',
      category: 'doors'
    }),
    
    doubleDoor: (width: number = 72) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="6" fill="#000000" />
          <path d="M ${width/2} 3 A ${width/2} ${width/2} 0 0 1 ${width/4} ${-width/2 + 3}" 
                stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,3" fill="none" />
          <path d="M ${width/2} 3 A ${width/2} ${width/2} 0 0 0 ${3*width/4} ${-width/2 + 3}" 
                stroke="#9ca3af" stroke-width="1" stroke-dasharray="3,3" fill="none" />
        </g>
      `,
      width,
      height: Math.max(width/2, 6),
      name: 'Double Door',
      category: 'doors'
    }),

    slidingDoor: (width: number = 72) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="6" fill="#000000" />
          <rect x="4" y="-2" width="${width/2 - 4}" height="10" fill="none" stroke="#666666" stroke-width="1" />
          <rect x="${width/2}" y="-2" width="${width/2 - 4}" height="10" fill="none" stroke="#666666" stroke-width="1" />
          <path d="M 8 4 L 12 4" stroke="#666666" stroke-width="2" />
          <path d="M ${width/2 + 8} 4 L ${width/2 + 12} 4" stroke="#666666" stroke-width="2" />
        </g>
      `,
      width,
      height: 14,
      name: 'Sliding Door',
      category: 'doors'
    })
  },

  // Window symbols
  windows: {
    singleWindow: (width: number = 36, height: number = 48) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="3" />
          <line x1="${width/2}" y1="0" x2="${width/2}" y2="${height}" stroke="#000000" stroke-width="1" />
          <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="#000000" stroke-width="1" />
        </g>
      `,
      width,
      height,
      name: 'Single Window',
      category: 'windows'
    }),

    doubleWindow: (width: number = 72, height: number = 48) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="3" />
          <line x1="${width/2}" y1="0" x2="${width/2}" y2="${height}" stroke="#000000" stroke-width="2" />
          <line x1="${width/4}" y1="0" x2="${width/4}" y2="${height}" stroke="#000000" stroke-width="1" />
          <line x1="${3*width/4}" y1="0" x2="${3*width/4}" y2="${height}" stroke="#000000" stroke-width="1" />
          <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="#000000" stroke-width="1" />
        </g>
      `,
      width,
      height,
      name: 'Double Window',
      category: 'windows'
    })
  },

  // Bathroom fixtures
  bathroom: {
    toilet: () => ({
      element: `
        <g>
          <ellipse cx="15" cy="24" rx="12" ry="18" fill="none" stroke="#000000" stroke-width="2" />
          <rect x="8" y="6" width="14" height="12" rx="2" fill="none" stroke="#000000" stroke-width="2" />
          <text x="15" y="28" text-anchor="middle" font-size="8" font-family="Arial">WC</text>
        </g>
      `,
      width: 30,
      height: 42,
      name: 'Toilet',
      category: 'bathroom'
    }),

    sink: (width: number = 24) => ({
      element: `
        <g>
          <ellipse cx="${width/2}" cy="12" rx="${width/2 - 2}" ry="10" fill="none" stroke="#000000" stroke-width="2" />
          <circle cx="${width/2}" cy="12" r="2" fill="#000000" />
          <text x="${width/2}" y="18" text-anchor="middle" font-size="6" font-family="Arial">SINK</text>
        </g>
      `,
      width,
      height: 24,
      name: 'Sink',
      category: 'bathroom'
    }),

    bathtub: (width: number = 60, height: number = 30) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" rx="4" fill="none" stroke="#000000" stroke-width="3" />
          <rect x="4" y="4" width="${width-8}" height="${height-8}" rx="2" fill="none" stroke="#000000" stroke-width="1" />
          <circle cx="${width-10}" cy="10" r="3" fill="none" stroke="#000000" stroke-width="1" />
          <text x="${width/2}" y="${height/2 + 2}" text-anchor="middle" font-size="8" font-family="Arial">TUB</text>
        </g>
      `,
      width,
      height,
      name: 'Bathtub',
      category: 'bathroom'
    }),

    shower: (width: number = 36, height: number = 36) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="3" />
          <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="3,3" />
          <circle cx="6" cy="6" r="2" fill="#000000" />
          <text x="${width/2}" y="${height/2 + 2}" text-anchor="middle" font-size="8" font-family="Arial">SHOWER</text>
        </g>
      `,
      width,
      height,
      name: 'Shower',
      category: 'bathroom'
    }),

    vanity: (width: number = 48, height: number = 22) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="2" />
          <ellipse cx="${width/2}" cy="${height/2}" rx="${Math.min(width/3, 10)}" ry="8" fill="none" stroke="#000000" stroke-width="1" />
          <circle cx="${width/2}" cy="${height/2}" r="1" fill="#000000" />
          <text x="${width/2}" y="${height + 8}" text-anchor="middle" font-size="6" font-family="Arial">VANITY</text>
        </g>
      `,
      width,
      height,
      name: 'Vanity',
      category: 'bathroom'
    })
  },

  // Kitchen fixtures
  kitchen: {
    refrigerator: (width: number = 36, height: number = 24) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="2" />
          <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="#000000" stroke-width="1" />
          <rect x="2" y="2" width="4" height="6" fill="none" stroke="#000000" stroke-width="1" />
          <rect x="2" y="${height/2 + 2}" width="4" height="6" fill="none" stroke="#000000" stroke-width="1" />
          <text x="${width/2}" y="${height/2 + 2}" text-anchor="middle" font-size="6" font-family="Arial">REF</text>
        </g>
      `,
      width,
      height,
      name: 'Refrigerator',
      category: 'kitchen'
    }),

    stove: (width: number = 30, height: number = 24) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="2" />
          <circle cx="${width/4}" cy="${height/4}" r="3" fill="none" stroke="#000000" stroke-width="1" />
          <circle cx="${3*width/4}" cy="${height/4}" r="3" fill="none" stroke="#000000" stroke-width="1" />
          <circle cx="${width/4}" cy="${3*height/4}" r="3" fill="none" stroke="#000000" stroke-width="1" />
          <circle cx="${3*width/4}" cy="${3*height/4}" r="3" fill="none" stroke="#000000" stroke-width="1" />
          <text x="${width/2}" y="${height + 8}" text-anchor="middle" font-size="6" font-family="Arial">STOVE</text>
        </g>
      `,
      width,
      height,
      name: 'Stove',
      category: 'kitchen'
    }),

    dishwasher: (width: number = 24, height: number = 24) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="2" />
          <rect x="2" y="8" width="${width-4}" height="8" fill="none" stroke="#000000" stroke-width="1" />
          <circle cx="${width/2}" cy="4" r="1" fill="#000000" />
          <text x="${width/2}" y="${height + 8}" text-anchor="middle" font-size="6" font-family="Arial">DW</text>
        </g>
      `,
      width,
      height,
      name: 'Dishwasher',
      category: 'kitchen'
    }),

    kitchenSink: (width: number = 33) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="22" rx="2" fill="none" stroke="#000000" stroke-width="2" />
          <ellipse cx="${width/3}" cy="11" rx="8" ry="6" fill="none" stroke="#000000" stroke-width="1" />
          <ellipse cx="${2*width/3}" cy="11" rx="8" ry="6" fill="none" stroke="#000000" stroke-width="1" />
          <circle cx="${width/3}" cy="11" r="1" fill="#000000" />
          <circle cx="${2*width/3}" cy="11" r="1" fill="#000000" />
          <text x="${width/2}" y="28" text-anchor="middle" font-size="6" font-family="Arial">KITCHEN SINK</text>
        </g>
      `,
      width,
      height: 22,
      name: 'Kitchen Sink',
      category: 'kitchen'
    })
  },

  // Bedroom fixtures
  bedroom: {
    bed: (size: 'twin' | 'full' | 'queen' | 'king' = 'queen') => {
      const dimensions = {
        twin: { width: 39, height: 75 },
        full: { width: 54, height: 75 },
        queen: { width: 60, height: 80 },
        king: { width: 76, height: 80 }
      };
      const { width, height } = dimensions[size];
      
      return {
        element: `
          <g>
            <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="2" />
            <rect x="2" y="2" width="${width-4}" height="8" fill="none" stroke="#000000" stroke-width="1" />
            <rect x="4" y="12" width="${width-8}" height="${height-16}" fill="none" stroke="#000000" stroke-width="1" stroke-dasharray="2,2" />
            <text x="${width/2}" y="${height + 8}" text-anchor="middle" font-size="8" font-family="Arial">${size.toUpperCase()}</text>
          </g>
        `,
        width,
        height,
        name: `${size.charAt(0).toUpperCase() + size.slice(1)} Bed`,
        category: 'bedroom'
      };
    },

    dresser: (width: number = 60, height: number = 20) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="2" />
          <line x1="${width/3}" y1="0" x2="${width/3}" y2="${height}" stroke="#000000" stroke-width="1" />
          <line x1="${2*width/3}" y1="0" x2="${2*width/3}" y2="${height}" stroke="#000000" stroke-width="1" />
          <circle cx="${width/6}" cy="${height/2}" r="1" fill="#000000" />
          <circle cx="${width/2}" cy="${height/2}" r="1" fill="#000000" />
          <circle cx="${5*width/6}" cy="${height/2}" r="1" fill="#000000" />
          <text x="${width/2}" y="${height + 8}" text-anchor="middle" font-size="6" font-family="Arial">DRESSER</text>
        </g>
      `,
      width,
      height,
      name: 'Dresser',
      category: 'bedroom'
    }),

    closet: (width: number = 48, height: number = 24) => ({
      element: `
        <g>
          <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#000000" stroke-width="2" stroke-dasharray="5,5" />
          <line x1="6" y1="6" x2="${width-6}" y2="6" stroke="#000000" stroke-width="1" />
          <line x1="12" y1="6" x2="12" y2="${height-6}" stroke="#000000" stroke-width="1" />
          <line x1="18" y1="6" x2="18" y2="${height-6}" stroke="#000000" stroke-width="1" />
          <text x="${width/2}" y="${height/2 + 2}" text-anchor="middle" font-size="8" font-family="Arial">CLOSET</text>
        </g>
      `,
      width,
      height,
      name: 'Closet',
      category: 'bedroom'
    })
  }
};

// Helper function to get all symbols by category
export const getSymbolsByCategory = (category: string) => {
  const allSymbols: any[] = [];
  
  Object.entries(SymbolLibrary).forEach(([categoryName, symbols]) => {
    if (category === 'all' || categoryName === category) {
      Object.entries(symbols).forEach(([symbolName, symbolFunc]) => {
        const symbol = typeof symbolFunc === 'function' ? symbolFunc() : symbolFunc;
        allSymbols.push({
          id: `${categoryName}_${symbolName}`,
          ...symbol
        });
      });
    }
  });
  
  return allSymbols;
};

// Helper function to generate SVG for a symbol
export const generateSymbolSVG = (symbolId: string, width?: number, height?: number) => {
  const [category, symbolName] = symbolId.split('_');
  const symbolLibrary = SymbolLibrary[category as keyof typeof SymbolLibrary];
  
  if (!symbolLibrary) {
    return null;
  }
  
  const symbolFunc = (symbolLibrary as any)[symbolName];
  if (!symbolFunc) {
    return null;
  }
  
  const symbol = typeof symbolFunc === 'function' ? symbolFunc() : symbolFunc;
  
  const finalWidth = width || symbol.width;
  const finalHeight = height || symbol.height;
  
  return `
    <svg width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${symbol.width} ${symbol.height}" xmlns="http://www.w3.org/2000/svg">
      ${symbol.element}
    </svg>
  `;
};