import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COLOR_HEX_MAP } from "@/constants/titanColors";

interface SelectionSummaryProps {
  selections: any;
}

export const SelectionSummary = ({ selections }: SelectionSummaryProps) => {
  // Helper function to extract hex color from selection string
  const getColorHex = (colorSelection: string): string => {
    // Extract color name from selection string like "Brown (WXB1009L)"
    const colorName = colorSelection.split(' (')[0];
    return COLOR_HEX_MAP[colorName] || "#CCCCCC";
  };

  const components = [
    { id: 'siding', name: 'Main Siding Color', icon: '', type: 'color' },
    { id: 'trim', name: 'Trim Color', icon: '', type: 'color' },
    { id: 'fascia', name: 'Fascia Color', icon: '', type: 'color' },
    { id: 'roof', name: 'Roof Color', icon: '', type: 'color' },
    { id: 'wainscoting_corner', name: 'Wainscoting Corner Color', icon: '', type: 'color' },
    { id: 'wainscoting', name: 'Wainscoting Color', icon: '', type: 'color' },
    { id: 'metal_panel', name: 'Roofing Selection', icon: '', type: 'selection' },
    { id: 'siding_panel', name: 'Siding Selection', icon: '', type: 'selection' },
    { id: 'window_grid_pattern', name: 'Window Grid Pattern', icon: '', type: 'selection' },
    { id: 'window_frame_color', name: 'Window Frame Color', icon: '', type: 'color' }
  ];

  return (
    <>
      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Your Design Selections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {components.map((component) => {
              // For color selections, append '_color' to the id
              const selectionKey = component.type === 'color' ? `${component.id}_color` : component.id;
              const selectedValue = selections[selectionKey];
              
              // Filter out wainscoting components if excluded
              if ((component.id === 'wainscoting' || component.id === 'wainscoting_corner') && selections.wainscoting_excluded) {
                return null;
              }
              
              return (
                <div key={component.id} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{component.icon}</span>
                      <span className="font-medium text-sm">{component.name}</span>
                    </div>
                    {selectedValue ? (
                      <div className="flex items-center space-x-2">
                        {component.type === 'color' && (
                          <div 
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: getColorHex(selectedValue) }}
                          />
                        )}
                        <span className="text-xs text-green-600 font-medium">Selected</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Not selected</span>
                    )}
                  </div>
                  {selectedValue && (
                    <div className="mt-1 text-xs text-gray-600">
                      {component.type === 'color' ? selectedValue : selectedValue.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              );
            }).filter(Boolean)}
          </div>
          
          {/* Progress indicator */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Selection Progress</span>
              <span className="text-sm text-blue-600">
                {(() => {
                  // Calculate required selections based on what's included
                  const requiredSelections = [
                    'siding_color', 'trim_color', 'roof_color',
                    'metal_panel', 'siding_panel', 
                    'window_grid_pattern', 'window_frame_color'
                  ];
                  
                  // Add wainscoting selections if not excluded
                  if (!selections.wainscoting_excluded) {
                    requiredSelections.push('wainscoting_color', 'wainscoting_corner_color');
                  }
                  
                  const completed = requiredSelections.filter(key => selections[key]).length;
                  const totalRequired = requiredSelections.length;
                  
                  return `${completed} of ${totalRequired} selections completed`;
                })()}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(() => {
                    const requiredSelections = [
                      'siding_color', 'trim_color', 'roof_color',
                      'metal_panel', 'siding_panel', 
                      'window_grid_pattern', 'window_frame_color'
                    ];
                    if (!selections.wainscoting_excluded) {
                      requiredSelections.push('wainscoting_color', 'wainscoting_corner_color');
                    }
                    const completed = requiredSelections.filter(key => selections[key]).length;
                    return (completed / requiredSelections.length) * 100;
                  })()}%`
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle>ℹ️ Important Color Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
              <p><strong>40-Year Warranty:</strong> All colors include Sherwin-Williams® 40-year paint warranty</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
              <p><strong>Color Matching:</strong> Colors shown may vary slightly from actual metal panels</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
              <p><strong>Metal Samples:</strong> Contact our office for physical color samples if needed</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
              <p><strong>Popular Combinations:</strong> Many customers choose matching siding and trim with contrasting roof</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};