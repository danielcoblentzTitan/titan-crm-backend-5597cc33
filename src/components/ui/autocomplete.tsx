import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface AutocompleteOption {
  value: string
  label: string
  type?: string
}

interface AutocompleteProps {
  options: AutocompleteOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Autocomplete({
  options,
  value = "",
  onValueChange,
  placeholder = "Type to search...",
  className,
  disabled = false,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Filter options based on input
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    setHighlightedIndex(-1)
    onValueChange(newValue)
  }

  const handleOptionSelect = (option: AutocompleteOption) => {
    setInputValue(option.label)
    onValueChange(option.label)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    // Delay to allow for option selection
    setTimeout(() => setIsOpen(false), 150)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground",
                index === highlightedIndex && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleOptionSelect(option)}
            >
              <div className="flex flex-col">
                <span>{option.label}</span>
                {option.type && (
                  <span className="text-xs text-muted-foreground">{option.type}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}