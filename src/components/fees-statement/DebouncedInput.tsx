
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";

interface DebouncedInputProps {
  initialValue: string | number;
  onDebouncedChange: (value: string) => void;
  delay?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "search" | "email" | "tel" | "url" | "none" | "numeric" | "decimal";
  tabIndex?: number;
}

export const DebouncedInput = ({
  initialValue,
  onDebouncedChange,
  delay = 1000,
  disabled = false,
  className = "",
  placeholder = "",
  type = "text",
  inputMode = "text",
  tabIndex
}: DebouncedInputProps) => {
  const [value, setValue] = useState(initialValue?.toString() || '');

  // Update local state when initialValue changes from parent
  useEffect(() => {
    setValue(initialValue?.toString() || '');
  }, [initialValue]);

  // Only update on blur or Enter key
  const handleBlur = () => {
    if (value !== initialValue?.toString()) {
      onDebouncedChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (value !== initialValue?.toString()) {
        onDebouncedChange(value);
      }
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      tabIndex={tabIndex}
    />
  );
};
