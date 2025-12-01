import { useState, useEffect, useCallback } from 'react';
import { EstimateCalculator, type EstimateItem, type EstimateOptions, type BuildingDimensions } from '@/utils/estimateCalculations';
import { pricingService, type PricingItemWithCategory } from '@/services/pricingService';

export const useCentralizedPricing = () => {
  const [masterItems, setMasterItems] = useState<PricingItemWithCategory[]>([]);
  const [estimateItems, setEstimateItems] = useState<EstimateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load master pricing items
  useEffect(() => {
    const loadMasterItems = async () => {
      try {
        setLoading(true);
        const items = await pricingService.getItems();
        setMasterItems(items);
      } catch (error) {
        console.error('Error loading master items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMasterItems();
  }, []);

  const calculateEstimate = useCallback((
    dimensions: BuildingDimensions,
    options: EstimateOptions
  ) => {
    if (!masterItems.length) return;

    const calculator = new EstimateCalculator(masterItems);
    const items = calculator.calculateCompleteEstimate(dimensions, options);
    setEstimateItems(items);
  }, [masterItems]);

  const getTotalPrice = useCallback(() => {
    return estimateItems.reduce((total, item) => total + item.totalPrice, 0);
  }, [estimateItems]);

  const getItemsByCategory = useCallback(() => {
    const grouped: { [key: string]: EstimateItem[] } = {};
    
    estimateItems.forEach(item => {
      const category = item.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }, [estimateItems]);

  return {
    estimateItems,
    masterItems,
    loading,
    calculateEstimate,
    getTotalPrice,
    getItemsByCategory
  };
};