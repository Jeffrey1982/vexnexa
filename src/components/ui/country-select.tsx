"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { COUNTRIES, type Country } from "@/lib/billing/countries"
import { ChevronDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountrySelectProps {
  value: string
  onValueChange: (code: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select a country",
  className,
  disabled = false,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!search) return COUNTRIES
    const q = search.toLowerCase()
    return COUNTRIES.filter(
      (c: Country) =>
        c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    )
  }, [search])

  const selected = useMemo(
    () => COUNTRIES.find((c: Country) => c.code === value),
    [value]
  )

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selected ? `${selected.name} (${selected.code})` : placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No countries found
              </div>
            ) : (
              filtered.map((country: Country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onValueChange(country.code)
                    setOpen(false)
                    setSearch("")
                  }}
                  className={cn(
                    "flex w-full items-center rounded-sm px-3 py-2 text-sm cursor-pointer",
                    "hover:bg-accent hover:text-accent-foreground",
                    value === country.code && "bg-accent text-accent-foreground font-medium"
                  )}
                >
                  <span className="flex-1 text-left">{country.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {country.code}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
