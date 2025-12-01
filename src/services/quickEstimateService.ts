import { supabase } from "@/integrations/supabase/client";

export interface QuickEstimateSettings {
  shell_rate_low: number;
  shell_rate_high: number;
  dried_in_rate_low: number;
  dried_in_rate_high: number;
  turnkey_rate_low: number;
  turnkey_rate_high: number;
  custom_rate_low: number;
  custom_rate_high: number;
  shop_rate: number;
  site_utilities_low: number;
  site_utilities_high: number;
  maryland_sprinkler_low: number;
  maryland_sprinkler_high: number;
  maryland_tax_rate: number;
}

export interface QuickEstimateInput {
  leadId?: string;
  leadName: string;
  buildType: 'Shell Only' | 'Dried-In' | 'Turnkey' | 'Custom';
  stories: 'Single Story' | '2 Story';
  livingSqft: number;
  shopSqft: number;
  includeSiteUtilities: boolean;
  state?: 'Maryland' | 'Delaware';
}

export interface QuickEstimateResult {
  buildingLow: number;
  buildingHigh: number;
  shopCost: number;
  siteUtilitiesLow: number;
  siteUtilitiesHigh: number;
  sprinklerLow?: number;
  sprinklerHigh?: number;
  taxAmount?: number;
  totalLow: number;
  totalHigh: number;
}

export class QuickEstimateService {
  private settings: QuickEstimateSettings | null = null;

  async loadSettings(): Promise<QuickEstimateSettings> {
    const { data, error } = await supabase
      .from('quick_estimate_settings')
      .select('setting_key, setting_value');

    if (error) throw error;

    const settings: any = {};
    data?.forEach((item) => {
      settings[item.setting_key] = Number(item.setting_value);
    });

    this.settings = settings as QuickEstimateSettings;
    return this.settings;
  }

  async updateSetting(key: string, value: number): Promise<void> {
    const { error } = await supabase
      .from('quick_estimate_settings')
      .update({ 
        setting_value: value,
        updated_by: (await supabase.auth.getUser()).data.user?.id 
      })
      .eq('setting_key', key);

    if (error) throw error;
  }

  calculateEstimate(input: QuickEstimateInput): QuickEstimateResult {
    if (!this.settings) {
      throw new Error('Settings not loaded. Call loadSettings() first.');
    }

    const buildTypeKey = input.buildType.toLowerCase().replace(/[- ]/g, '_');
    const rateLow = this.settings[`${buildTypeKey}_rate_low` as keyof QuickEstimateSettings];
    const rateHigh = this.settings[`${buildTypeKey}_rate_high` as keyof QuickEstimateSettings];

    const buildingLow = input.livingSqft * rateLow;
    const buildingHigh = input.livingSqft * rateHigh;
    const shopCost = input.shopSqft * this.settings.shop_rate;
    const siteUtilitiesLow = input.includeSiteUtilities ? this.settings.site_utilities_low : 0;
    const siteUtilitiesHigh = input.includeSiteUtilities ? this.settings.site_utilities_high : 0;

    // Maryland-specific costs
    const isMaryland = input.state === 'Maryland';
    const sprinklerLow = isMaryland ? this.settings.maryland_sprinkler_low : 0;
    const sprinklerHigh = isMaryland ? this.settings.maryland_sprinkler_high : 0;
    
    // Calculate subtotal before tax
    const subtotalLow = buildingLow + shopCost + siteUtilitiesLow + sprinklerLow;
    const subtotalHigh = buildingHigh + shopCost + siteUtilitiesHigh + sprinklerHigh;
    
    // Maryland 6% tax applied to total
    const taxAmountLow = isMaryland ? subtotalLow * this.settings.maryland_tax_rate : 0;
    const taxAmountHigh = isMaryland ? subtotalHigh * this.settings.maryland_tax_rate : 0;

    return {
      buildingLow,
      buildingHigh,
      shopCost,
      siteUtilitiesLow,
      siteUtilitiesHigh,
      sprinklerLow: isMaryland ? sprinklerLow : undefined,
      sprinklerHigh: isMaryland ? sprinklerHigh : undefined,
      taxAmount: isMaryland ? taxAmountHigh : undefined, // Use high tax for display
      totalLow: subtotalLow + taxAmountLow,
      totalHigh: subtotalHigh + taxAmountHigh,
    };
  }

  async saveEstimate(input: QuickEstimateInput, result: QuickEstimateResult): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    
    const { data, error } = await supabase
      .from('quick_estimates')
      .insert([{
        lead_id: input.leadId || null,
        lead_name: input.leadName,
        build_type: input.buildType,
        stories: input.stories,
        living_sqft: input.livingSqft,
        shop_sqft: input.shopSqft || 0,
        include_site_utilities: input.includeSiteUtilities,
        estimated_low: result.totalLow,
        estimated_high: result.totalHigh,
        breakdown_data: result as any,
        created_by: user?.id || null,
      }])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  generateSummaryText(input: QuickEstimateInput, result: QuickEstimateResult): string {
    return `Quick Estimate for ${input.leadName}

Build Type: ${input.buildType} Barndominium
State: ${input.state || 'Delaware'}
Stories: ${input.stories}
Living Area: ${input.livingSqft.toLocaleString()} sq ft
${input.shopSqft > 0 ? `Shop/Garage: ${input.shopSqft.toLocaleString()} sq ft` : ''}
${input.includeSiteUtilities ? 'Site & Utilities: Included' : ''}

Estimated Range: ${this.formatCurrency(result.totalLow)} - ${this.formatCurrency(result.totalHigh)}

Breakdown:
- Building: ${this.formatCurrency(result.buildingLow)} - ${this.formatCurrency(result.buildingHigh)}
${input.shopSqft > 0 ? `- Shop: ${this.formatCurrency(result.shopCost)}` : ''}
${input.includeSiteUtilities ? `- Site/Utilities: ${this.formatCurrency(result.siteUtilitiesLow)} - ${this.formatCurrency(result.siteUtilitiesHigh)}` : ''}
${result.sprinklerLow && result.sprinklerHigh ? `- Sprinkler System (MD Required): ${this.formatCurrency(result.sprinklerLow)} - ${this.formatCurrency(result.sprinklerHigh)}` : ''}
${result.taxAmount ? `- Maryland Tax (6%): ${this.formatCurrency(result.taxAmount)}` : ''}

Next Steps: Schedule a site visit and detailed design consultation.
Contact Titan Buildings to move forward.`;
  }
}

export const quickEstimateService = new QuickEstimateService();
