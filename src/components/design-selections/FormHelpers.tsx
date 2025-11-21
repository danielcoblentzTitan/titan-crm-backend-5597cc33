import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { COLOR_HEX_MAP } from "@/constants/titanColors";

interface CheckboxItemProps {
  label: string;
  name?: string;
  value?: string;
  defaultChecked?: boolean;
  colorPreview?: string;
  isEditing: boolean;
}

export const CheckboxItem = ({ 
  label, 
  name, 
  value, 
  defaultChecked, 
  colorPreview,
  isEditing 
}: CheckboxItemProps) => (
  <div className="flex items-center space-x-2">
    <Checkbox 
      name={name} 
      value={value || label}
      defaultChecked={defaultChecked}
      disabled={!isEditing}
    />
    <label className="text-sm flex items-center gap-2">
      {colorPreview && (
        <div 
          className="w-4 h-4 rounded-full border border-gray-300" 
          style={{ backgroundColor: colorPreview }}
        />
      )}
      {label}
    </label>
  </div>
);

interface InputFieldProps {
  label: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  isEditing: boolean;
}

export const InputField = ({ 
  label, 
  name,
  placeholder = "", 
  defaultValue,
  isEditing 
}: InputFieldProps) => (
  <div className="flex items-center space-x-2">
    <label className="text-sm min-w-0 flex-shrink-0">{label}:</label>
    <Input 
      name={name}
      className="border-b border-dotted border-border bg-transparent rounded-none px-1 py-0 h-6 text-sm" 
      placeholder={placeholder}
      defaultValue={defaultValue}
      disabled={!isEditing}
    />
  </div>
);

// Helper function to extract hex color from selection string
export const getColorHex = (colorSelection: string): string => {
  // Extract color name from selection string like "Brown (WXB1009L)"
  const colorName = colorSelection.split(' (')[0];
  return COLOR_HEX_MAP[colorName] || "#CCCCCC";
};