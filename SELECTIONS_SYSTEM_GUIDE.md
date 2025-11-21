# Intelligent Room Setup + Master Selections System

## Overview

This system provides an intelligent, cascading selections engine that allows builders to:
- Define master default selections at the project level
- Auto-populate rooms with contextually appropriate selection items
- Override defaults on a room-by-room basis
- Apply bulk updates while respecting overrides
- Use pre-configured design packages for rapid setup

## Database Architecture

### Core Tables

**master_interior_selections**
- Stores default interior selections for the entire project
- Fields: flooring, paint colors, trim, doors, hardware, electrical
- One record per project

**master_exterior_selections**
- Stores default exterior selections for the building shell
- Fields: metal colors, doors/windows, porch, stone, concrete, lighting
- One record per project

**room_type_rules**
- Defines which selection items each room type should have
- JSON rules specify categories, labels, and whether items use master defaults
- Pre-seeded with rules for: bedroom, bathroom, kitchen, living, laundry

**selection_items** (enhanced)
- Added columns:
  - `uses_master_default` - Boolean flag
  - `master_field_name` - References which master field
  - `is_overridden` - Boolean flag when user customizes
  - `override_reason` - Optional explanation
  - `product_id` - References product catalogs
  - `product_type` - Type of product (flooring, metal_color, etc.)

### Product Catalog Tables

**flooring_products**
- 10 pre-seeded LVP products with room and texture images
- Fields: name, brand, images, material_type, color_family, price_tier

**metal_color_products**
- 26 Titan metal colors with hex codes
- Fields: color_name, product_code, hex_color, category, finish_type

**cabinet_products**
- Cabinet styles and finishes
- Fields: name, style, door_style, wood_species, finish_options

**tile_products**
- Tile products for floors, walls, backsplashes
- Fields: name, tile_type, size, material, color_family

**fixture_products**
- Plumbing and lighting fixtures
- Fields: name, fixture_type, brand, model, finish

**design_packages**
- Pre-configured design bundles
- JSON data includes interior and exterior selections
- 3 pre-seeded packages: Modern Farmhouse, Industrial Chic, Classic Traditional

## User Workflows

### 1. Create New Project
```
User creates project
  → System auto-creates master_interior_selections (empty)
  → System auto-creates master_exterior_selections (empty)
  → User sees MasterSelectionsHub on dashboard
```

### 2. Configure Master Selections
```
User clicks "Configure" on Master Interior Selections card
  → Opens InteriorDesignPage
  → User selects flooring from visual gallery
  → User enters paint colors, trim, door styles
  → User clicks "Save Master Selections"
  → PropagationDialog shows affected rooms
  → User confirms
  → All non-overridden rooms update automatically
```

### 3. Add New Room
```
User clicks "Add Room"
  → Selects room type (bedroom, bathroom, etc.)
  → System looks up room_type_rules
  → System creates selection_items based on rules
  → Items marked with uses_master_default automatically populate from master selections
  → Room is created with smart defaults
```

### 4. Override Room Selection
```
User views room selections
  → Sees item with "Master Default" badge
  → Clicks "Override" button
  → Edits the selection
  → Item marked as is_overridden=true
  → Future master selection updates won't affect this item
```

### 5. Reset to Default
```
User views overridden selection
  → Sees "Custom Selection" badge
  → Clicks "Reset to Default" button
  → System sets is_overridden=false
  → Item syncs with current master selection
```

### 6. Apply Design Package
```
User navigates to Design Packages page
  → Views pre-configured design bundles
  → Clicks "Apply This Package"
  → System updates both master_interior and master_exterior
  → PropagationDialog shows affected rooms
  → All non-overridden rooms update
```

## Design Pages

### Interior Design Page (`/design/interior/:projectId`)
- Visual flooring gallery with 10 LVP products
- Paint color configuration
- Trim and door settings
- Electrical fixture colors
- Saves with bulk propagation

### Exterior Design Page (`/design/exterior/:projectId`)
- Metal color picker with 26 Titan colors (visual swatches)
- Door and window color configuration
- Porch and entry settings
- Stone and concrete options
- Exterior lighting

### Kitchen Design Page (`/design/kitchen/:projectId`)
- Cabinet styles (ready for visual gallery expansion)
- Countertop selections
- Backsplash tile
- Plumbing fixtures
- Appliance packages

### Bathroom Design Page (`/design/bathroom/:projectId`)
- Tile selections (floor, shower, backsplash)
- Vanity configuration
- Plumbing fixtures (sink, faucet, shower, toilet)
- Lighting fixtures

### Design Packages Page (`/design/packages/:projectId`)
- Pre-configured design bundles
- One-click application of complete design schemes
- Includes interior and exterior selections

## Components

### Visual Selection Components

**ProductCard**
- Reusable card for any visual product
- Hover effect to show texture images
- Price tier badges
- "Master Default" indicator
- Select/Selected states

**FlooringGallery**
- Grid of flooring products
- Search and filter by material type, price tier
- Shows room installation images
- Hover to see texture closeups

**MetalColorPicker**
- Grid of color swatches with actual hex colors
- Filter by category (standard, premium)
- Search by color name or product code
- Visual color preview

**ProductComparison**
- Side-by-side comparison of 2-4 products
- Shows images, details, price tiers
- "Select This One" button for each
- Removable comparison items

**PropagationDialog**
- Shows which rooms will be affected by master selection changes
- Lists room names with item counts
- Only updates non-overridden selections
- Confirms before applying

**DesignPackages**
- Displays available design package templates
- Shows included items
- One-click application

**MasterSelectionsHub**
- Dashboard widget showing current master selections
- Visual previews of configured items
- Quick links to all design areas
- Shows configuration status

### SelectionItemCard (Enhanced)
- Shows "Master Default" badge for inherited items
- Shows "Custom Selection" badge for overridden items
- "Override" button to customize master defaults
- "Reset to Default" button for overridden items
- Visual border for master default items

## Services

### roomInitializationService
**Key Functions:**
- `getRoomTypeRules(roomType)` - Fetches JSON rules for room type
- `getMasterInteriorDefaults(projectId)` - Gets interior master selections
- `getMasterExteriorDefaults(projectId)` - Gets exterior master selections
- `getFlooringProduct(productId)` - Fetches flooring product details
- `initializeRoomSelections(projectId, roomId, roomType, categoryMap)` - Creates selection items with master defaults applied

### masterSelectionsService
**Key Functions:**
- `createMasterSelectionsForProject(projectId)` - Auto-creates master selections on project creation
- `updateMasterInterior(projectId, data)` - Updates interior master selections
- `updateMasterExterior(projectId, data)` - Updates exterior master selections
- `propagateDefaultsToRooms(projectId, options)` - Applies master selections to non-overridden room items

## Migration Utilities

### backfillMasterSelections(projectId)
Creates master selections for existing projects that don't have them

### backfillAllProjects()
Batch creates master selections for all projects

### convertSelectionsToMasterDefaults(projectId, roomId)
Converts existing selection items to use master defaults based on room type rules

### analyzeProjectForStandardization(projectId)
Analyzes existing selections to suggest which items could be standardized as master defaults

## Room Type Rules

Each room type has a JSON structure defining:
- `category` - Which category the item belongs to
- `label` - Display name of the selection item
- `uses_master_default` - Whether to pull from master selections
- `master_field` - Which master selection field to use
- `master_source` - "interior" or "exterior"
- `visual_selector` - Which visual component to use (e.g., "flooring_gallery")
- `type` - Data type (boolean, select, text)
- `options` - Array of choices for select fields

**Example Bedroom Rules:**
```json
{
  "default_items": [
    {
      "category": "Flooring",
      "label": "Flooring",
      "uses_master_default": true,
      "master_field": "default_flooring_product_id",
      "master_source": "interior",
      "visual_selector": "flooring_gallery"
    },
    {
      "category": "Paint",
      "label": "Wall Paint",
      "uses_master_default": true,
      "master_field": "default_wall_paint_color",
      "master_source": "interior"
    }
  ]
}
```

## Design Tokens and Styling

All components use semantic tokens from the design system:
- Use `--background`, `--foreground`, `--primary`, etc.
- No direct color values in components
- Everything themed via `index.css` and `tailwind.config.ts`
- Responsive by default with mobile-first approach

## Future Enhancements

### Phase 6+ Features (Not Yet Implemented)
- Room visualizer (upload photo, overlay selections)
- Client approval workflow with PDF generation
- Advanced comparison tools (4+ products side-by-side)
- Design package import/export
- Template library for common room types
- AI-powered design suggestions based on room dimensions
- Material cost tracking and budget management per room
- Supplier integration for real-time pricing
- Mobile app for on-site selection verification

## Best Practices

1. **Always use master defaults for consistency**
   - Configure master selections before adding many rooms
   - Only override when truly necessary

2. **Room type rules are the foundation**
   - Update room_type_rules table to add new room types
   - Keep rules consistent with master selection fields

3. **Visual product catalogs drive the experience**
   - Add high-quality room installation images
   - Include texture closeups for hover effects
   - Maintain consistent image aspect ratios

4. **Respect overrides during propagation**
   - Never overwrite user customizations
   - PropagationDialog shows what will change
   - Users can always reset to defaults later

5. **Design packages for rapid project setup**
   - Create packages for common design styles
   - Include all interior and exterior selections
   - Test packages on real projects before deploying

## Navigation Structure

```
Dashboard
├── Master Selections Hub
│   ├── Master Interior Selections → /design/interior/:projectId
│   ├── Master Exterior Selections → /design/exterior/:projectId
│   └── Design Center
│       ├── Packages → /design/packages/:projectId
│       ├── Interior → /design/interior/:projectId
│       ├── Exterior → /design/exterior/:projectId
│       ├── Kitchen → /design/kitchen/:projectId
│       └── Bathroom → /design/bathroom/:projectId
└── Rooms & Selections
    └── Room → /projects/:projectId/room/:roomId
        └── Selection Item Cards (with override controls)
```

## Technical Notes

- All new tables have RLS policies matching existing patterns
- Admins can manage all data, authenticated users can view
- Product tables use sort_order for custom ordering
- JSON rules in room_type_rules allow flexible configuration without schema changes
- Migration helpers support gradual adoption for existing projects
- PropagationDialog prevents accidental overwrites
- Type safety maintained with TypeScript interfaces for new tables
