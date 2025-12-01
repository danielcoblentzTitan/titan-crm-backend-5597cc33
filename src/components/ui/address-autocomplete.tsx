import * as React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { MapPin, Loader2 } from "lucide-react"

export interface AddressSuggestion {
  id: string
  label: string
  lat: number
  lon: number
  county: string | null
}

interface AddressAutocompleteProps {
  value?: string
  onValueChange: (value: string) => void
  onSelect: (suggestion: {
    address: string
    lat: number
    lon: number
    county: string | null
  }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function AddressAutocomplete({
  value = "",
  onValueChange,
  onSelect,
  placeholder = "Start typing an address...",
  className,
  disabled = false,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Debounced search function
  const debouncedSearch = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      
      try {
        console.log('Searching for address:', query)
        const { data, error } = await supabase.functions.invoke('suggest', {
          body: { q: query.trim() }
        })

        if (error) {
          console.error('Address search error:', error)
          setSuggestions([])
        } else {
          console.log('Address search results:', data)
          const suggestions = data?.suggestions || []
          setSuggestions(suggestions)
          setIsOpen(suggestions.length > 0)
        }
      } catch (error) {
        console.error('Address search failed:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  // Handle input changes with debouncing
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onValueChange(newValue)
      setHighlightedIndex(-1)

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set new timeout for debounced search
      timeoutRef.current = setTimeout(() => {
        debouncedSearch(newValue)
      }, 300)
    },
    [onValueChange, debouncedSearch]
  )

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      onValueChange(suggestion.label)
      onSelect({
        address: suggestion.label,
        lat: suggestion.lat,
        lon: suggestion.lon,
        county: suggestion.county,
      })
      setIsOpen(false)
      setHighlightedIndex(-1)
      setSuggestions([])
    },
    [onValueChange, onSelect]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            handleSuggestionSelect(suggestions[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, suggestions, highlightedIndex, handleSuggestionSelect]
  )

  // Handle blur with delay to allow for clicks
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false)
      setHighlightedIndex(-1)
    }, 150)
  }, [])

  // Handle focus
  const handleFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }, [suggestions.length])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn("pr-10", className)}
          disabled={disabled}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                index === highlightedIndex && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex flex-col">
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="block truncate">{suggestion.label}</span>
                    {suggestion.county && (
                      <span className="text-xs text-muted-foreground">
                        {suggestion.county}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}