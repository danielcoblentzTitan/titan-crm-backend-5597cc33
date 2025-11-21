export interface PostCalculationInputs {
  building_width: number;
  building_length: number;
  building_height: number;
  roof_pitch: number; // in x/12 format (e.g., 4 for 4/12)
}

export interface PostBreakdown {
  gable_post_breakdown: string;
  gable_post_total: number;
  gable_post_total_lf: number;
  eave_post_length: number;
  eave_post_total: number;
  eave_post_total_lf: number;
  corner_post_length: number;
  corner_post_total: number;
  corner_post_total_lf: number;
  all_post_total: number;
  all_post_total_lf: number;
  calculated_post_size: '3ply_2x6' | '3ply_2x8' | '4ply_2x6' | '4ply_2x8';
}

export interface PostCalculationResult {
  breakdown: PostBreakdown;
  requiredPostSize: '3ply_2x6' | '3ply_2x8' | '4ply_2x6' | '4ply_2x8';
  isUpgrade: boolean;
  upgradeCostPerLF?: number;
}

export class PostCalculationService {
  /**
   * Calculate post requirements based on building dimensions
   */
  static calculatePostRequirements(inputs: PostCalculationInputs): PostBreakdown {
    const width = inputs.building_width;
    const length = inputs.building_length;
    const height = inputs.building_height;
    const pitch = inputs.roof_pitch / 12;

    // GABLE POSTS - Dynamic calculation based on structural requirements
    const postSizes: Record<number, number> = {};
    let gableLF_one = 0;
    const extra_length = 6; // For gable posts
    const eave_extra_length = 4; // For eave posts

    // Universal post calculation: place posts every 8' from one side until last increment < 8'
    const maxSpacing = 8;
    const postPositions: number[] = [];
    
    for (let position = maxSpacing; position < width; position += maxSpacing) {
      postPositions.push(position);
    }
    
    const postCountPerGable = postPositions.length;
    
    // Calculate gable post heights for each position
    const gablePostHeights: number[] = [];
    
    for (const postPosition of postPositions) {
      
      // Calculate distance from center for pitch calculation
      const distanceFromCenter = Math.abs(postPosition - width / 2);
      
      // Calculate rise based on pitch and distance from center
      const rise = distanceFromCenter * pitch;
      
      // Base height = wall height + rise + extra length for embedment
      const rawHeight = height + rise + extra_length;
      
      // Round to nearest even number for standard lumber sizing
      const roundedHeight = Math.ceil(rawHeight / 2) * 2;
      
      gablePostHeights.push(roundedHeight);
    }

    // Count posts by height and calculate total LF for one gable
    gablePostHeights.forEach(postHeight => {
      postSizes[postHeight] = (postSizes[postHeight] || 0) + 1;
      gableLF_one += postHeight;
    });

    // Create breakdown showing total posts across both gables (interior posts only)
    const gablePostBreakdown = Object.entries(postSizes)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([size, qty]) => `x${qty * 2} ${size}'`)
      .join(", ");

    const gable_post_total = gablePostHeights.length * 2;
    const gable_post_total_lf = gableLF_one * 2;

    // EAVE POSTS - Enhanced calculation for any building length
    const eavePostHeight = Math.ceil((height + eave_extra_length) / 2) * 2;
    
    // Calculate eave post count based on 8-foot maximum spacing rule
    // Number of spaces = ceil(dimension / 8), Number of posts = spaces + 1
    const eaveSpacesNeeded = Math.ceil(length / maxSpacing);
    const postsPerEaveSide = eaveSpacesNeeded + 1;
    
    // Eave posts include all posts along the length, including corner posts
    // Total eave posts: postsPerEaveSide * 2 (both eave sides)
    const eave_post_total = postsPerEaveSide * 2;
    const eave_post_total_lf = eavePostHeight * eave_post_total;

    // CORNER POSTS (removed - no longer calculated)
    const corner_post_total = 0;
    const corner_post_total_lf = 0;

    // COMBINED TOTALS
    const all_post_total = gable_post_total + eave_post_total;
    const all_post_total_lf = gable_post_total_lf + eave_post_total_lf;

    // DETERMINE REQUIRED POST SIZE
    const calculated_post_size = this.determineRequiredPostSizeFromChart(
      height, 
      width
    );

    return {
      gable_post_breakdown: gablePostBreakdown,
      gable_post_total,
      gable_post_total_lf,
      eave_post_length: eavePostHeight,
      eave_post_total,
      eave_post_total_lf,
      corner_post_length: eavePostHeight, // Set to eave height for backward compatibility
      corner_post_total,
      corner_post_total_lf,
      all_post_total,
      all_post_total_lf,
      calculated_post_size
    };
  }

  /**
   * Determine required post size based on chart lookup
   */
  private static determineRequiredPostSizeFromChart(
    wallHeight: number, 
    buildingWidth: number
  ): '3ply_2x6' | '3ply_2x8' | '4ply_2x6' | '4ply_2x8' {
    // Chart data: [height][width] = post_size
    const postSizeChart: Record<number, Record<number, string>> = {
      12: { 40: '3ply_2x6', 50: '3ply_2x6', 60: '3ply_2x6', 70: '3ply_2x8', 80: '3ply_2x8' },
      14: { 40: '3ply_2x6', 50: '3ply_2x6', 60: '3ply_2x8', 70: '3ply_2x8', 80: '4ply_2x6' },
      16: { 40: '3ply_2x6', 50: '3ply_2x8', 60: '3ply_2x8', 70: '4ply_2x6', 80: '4ply_2x6' },
      18: { 40: '3ply_2x8', 50: '3ply_2x8', 60: '4ply_2x6', 70: '4ply_2x6', 80: '4ply_2x8' },
      20: { 40: '3ply_2x8', 50: '4ply_2x6', 60: '4ply_2x6', 70: '4ply_2x8', 80: '4ply_2x8' },
      22: { 40: '4ply_2x6', 50: '4ply_2x6', 60: '4ply_2x8', 70: '4ply_2x8', 80: '4ply_2x8' },
      24: { 40: '4ply_2x6', 50: '4ply_2x8', 60: '4ply_2x8', 70: '4ply_2x8', 80: '4ply_2x8' }
    };

    // Round up to next chart height for safety
    const chartHeights = [12, 14, 16, 18, 20, 22, 24];
    const safeHeight = chartHeights.find(h => h >= wallHeight) || 24;

    // Round up to next chart width for safety
    const chartWidths = [40, 50, 60, 70, 80];
    const safeWidth = chartWidths.find(w => w >= buildingWidth) || 80;

    return postSizeChart[safeHeight]?.[safeWidth] as '3ply_2x6' | '3ply_2x8' | '4ply_2x6' | '4ply_2x8' || '3ply_2x6';
  }

  /**
   * Get post calculation result with upgrade information
   */
  static getPostCalculationResult(
    inputs: PostCalculationInputs,
    masterItems: any[]
  ): PostCalculationResult {
    const breakdown = this.calculatePostRequirements(inputs);
    const requiredPostSize = breakdown.calculated_post_size;
    const isUpgrade = requiredPostSize !== '3ply_2x6';

    let upgradeCostPerLF: number | undefined;

    if (isUpgrade) {
      // Convert post size format to match database naming
      const postSizeName = this.formatPostSizeForDatabase(requiredPostSize);
      
      // Find the upgrade cost in master pricing - look in Posts category
      const postUpgradeItem = masterItems.find(item => 
        item.category?.name?.toLowerCase() === 'posts' &&
        item.name === postSizeName
      );
      
      if (postUpgradeItem) {
        upgradeCostPerLF = postUpgradeItem.base_price;
      } else {
        console.warn(`Post upgrade item not found for size: ${postSizeName}`);
      }
    }

    return {
      breakdown,
      requiredPostSize,
      isUpgrade,
      upgradeCostPerLF
    };
  }

  /**
   * Calculate post upgrade cost for the estimate
   */
  static calculatePostUpgradeCost(
    postResult: PostCalculationResult
  ): { lineItem: any | null; totalUpgradeCost: number } {
    if (!postResult.isUpgrade || !postResult.upgradeCostPerLF) {
      return { lineItem: null, totalUpgradeCost: 0 };
    }

    const totalLF = postResult.breakdown.all_post_total_lf;
    const totalUpgradeCost = totalLF * postResult.upgradeCostPerLF;

    const lineItem = {
      id: `post_upgrade_${Date.now()}`,
      category: 'Building Shell Addons',
      name: `Post Upgrade to ${postResult.requiredPostSize.replace('_', ' ').toUpperCase()}`,
      quantity: totalLF,
      unit_price: postResult.upgradeCostPerLF,
      total: totalUpgradeCost,
      unit_type: 'linear ft',
      has_formula: true,
      formula_type: 'post_calculation'
    };

    return { lineItem, totalUpgradeCost };
  }

  /**
   * Convert post size format from internal format to database naming
   */
  private static formatPostSizeForDatabase(postSize: string): string {
    // Convert '3ply_2x8' to '3Ply 2x8'
    return postSize
      .replace('_', ' ')
      .replace(/(\d+)ply/i, '$1Ply')
      .replace(/(\d+)x(\d+)/, '$1x$2');
  }

  /**
   * Format post breakdown for display
   */
  static formatPostBreakdownForDisplay(breakdown: PostBreakdown): string {
    return [
      `Gable Posts: ${breakdown.gable_post_breakdown} (${breakdown.gable_post_total_lf} LF)`,
      `Eave Posts: x${breakdown.eave_post_total} ${breakdown.eave_post_length}' (${breakdown.eave_post_total_lf} LF)`,
      `Total: ${breakdown.all_post_total} posts, ${breakdown.all_post_total_lf} LF`,
      `Required Size: ${breakdown.calculated_post_size.replace('_', ' ').toUpperCase()}`
    ].join('\n');
  }
}