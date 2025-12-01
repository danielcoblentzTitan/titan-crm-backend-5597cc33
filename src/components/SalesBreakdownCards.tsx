import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SalesData {
  commercial: { count: number; total: number };
  residential: { count: number; total: number };
  barndominium: { count: number; total: number };
}

export const SalesBreakdownCards = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState<SalesData>({
    commercial: { count: 0, total: 0 },
    residential: { count: 0, total: 0 },
    barndominium: { count: 0, total: 0 }
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);

  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = ['all-time'];
    for (let year = 2023; year <= currentYear; year++) {
      years.push(year.toString());
    }
    return years;
  };

  useEffect(() => {
    fetchSalesData();
  }, [selectedYear]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Real data from your business records - updated with complete data
      const historicalData = {
        '2023': {
          residential: { count: 22, total: 1553625 }, // 22 completed residential projects (excluding cancelled)
          barndominium: { count: 0, total: 0 }, // No barndominiums in 2023
          commercial: { count: 5, total: 1553052 } // 5 commercial projects (Rick Tucker, Joe Gallo, Ryan Turner x2, Walter George)
        },
        '2024': {
          residential: { count: 22, total: 1507250 }, // 22 completed residential projects (excluding cancelled)
          barndominium: { count: 2, total: 495000 }, // 2 barndominium projects (John Cope, Hannah Adkins)
          commercial: { count: 7, total: 1052700 } // 7 commercial projects
        },
        '2025': {
          residential: { count: 11, total: 750600 }, // 11 completed residential projects (excluding cancelled)
          barndominium: { count: 6, total: 1747500 }, // 6 barndominium projects
          commercial: { count: 3, total: 485500 } // 3 commercial projects YTD (Rick Tucker, ZS Technologies, Doug Melson)
        }
      };

      if (selectedYear === 'all-time') {
        // Calculate totals across all years
        const allTimeData = {
          commercial: { count: 0, total: 0 },
          residential: { count: 0, total: 0 },
          barndominium: { count: 0, total: 0 }
        };

        Object.values(historicalData).forEach(yearData => {
          allTimeData.commercial.count += yearData.commercial.count;
          allTimeData.commercial.total += yearData.commercial.total;
          allTimeData.residential.count += yearData.residential.count;
          allTimeData.residential.total += yearData.residential.total;
          allTimeData.barndominium.count += yearData.barndominium.count;
          allTimeData.barndominium.total += yearData.barndominium.total;
        });

        setSalesData(allTimeData);
      } else {
        const yearData = historicalData[selectedYear as keyof typeof historicalData];
        
        if (yearData) {
          setSalesData({
            commercial: yearData.commercial,
            residential: yearData.residential,
            barndominium: yearData.barndominium
          });
        } else {
          // For any other years, show empty data
          setSalesData({
            commercial: { count: 0, total: 0 },
            residential: { count: 0, total: 0 },
            barndominium: { count: 0, total: 0 }
          });
        }
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const salesCategories = [
    {
      title: "Commercial",
      type: 'commercial' as keyof SalesData,
    },
    {
      title: "Residential", 
      type: 'residential' as keyof SalesData,
    },
    {
      title: "Barndominium",
      type: 'barndominium' as keyof SalesData,
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Sales Breakdown</CardTitle>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background">
              {getAvailableYears().map(year => (
                <SelectItem key={year} value={year}>
                  {year === 'all-time' ? 'All Time' : year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="text-lg text-muted-foreground">Loading sales data...</div>
          </div>
        ) : salesData.commercial.count === 0 && salesData.residential.count === 0 && salesData.barndominium.count === 0 ? (
          <div className="text-center py-8">
            <div className="text-lg text-muted-foreground">No sales data available for {selectedYear === 'all-time' ? 'all time' : selectedYear}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total Section */}
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-center">
                <h3 className="font-semibold text-primary mb-2">Total Sales</h3>
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">
                    {salesData.commercial.count + salesData.residential.count + salesData.barndominium.count}
                  </div>
                  <div className="text-lg font-semibold text-primary">
                    {formatCurrency(salesData.commercial.total + salesData.residential.total + salesData.barndominium.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedYear === 'all-time' ? 'All Time' : selectedYear} Projects
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 [@media(min-width:1300px)_and_(max-width:1400px)_and_(orientation:landscape)]:grid-cols-1">
              {salesCategories.map((category) => (
                <div
                  key={category.type}
                  className="p-3 bg-secondary/10 rounded-lg border border-border hover:border-border/80 transition-colors cursor-pointer hover:bg-secondary/20 touch-target min-h-[100px] flex items-center justify-center"
                  onClick={() => navigate(`/sales-analytics${selectedYear !== 'all-time' ? `?year=${selectedYear}` : ''}`)}
                >
                  <div className="space-y-1 text-center w-full">
                    <div className="text-2xl font-bold text-foreground">
                      {salesData[category.type].count}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {category.title}
                    </div>
                    <div className="text-xs font-semibold text-foreground break-words">
                      {formatCurrency(salesData[category.type].total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};