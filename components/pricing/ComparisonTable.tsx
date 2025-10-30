"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComparisonRow {
  feature: string
  starter: boolean | string
  growth: boolean | string
  scale: boolean | string
  custom: boolean | string
}

interface ComparisonTableProps {
  rows: ComparisonRow[]
  className?: string
}

export function ComparisonTable({ rows, className }: ComparisonTableProps) {
  const renderCell = (value: boolean | string) => {
    if (typeof value === "boolean") {
      return value ? (
        <div className="flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="w-4 h-4 text-primary font-bold" aria-label="Included" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-steel-100 flex items-center justify-center">
            <X className="w-4 h-4 text-steel-400" aria-label="Not included" />
          </div>
        </div>
      )
    }
    return <span className="text-sm font-medium text-charcoal">{value}</span>
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse bg-white rounded-2xl shadow-soft-md overflow-hidden border border-steel-200">
        <thead>
          <tr className="bg-gradient-to-br from-steel-50 to-steel-100/50 border-b-2 border-steel-200">
            <th className="py-5 px-8 text-left text-base font-bold text-charcoal tracking-tight">
              Feature
            </th>
            <th className="py-5 px-6 text-center text-base font-bold text-charcoal">
              Starter
            </th>
            <th className="py-5 px-6 text-center text-base font-bold text-charcoal relative">
              Growth
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
            </th>
            <th className="py-5 px-6 text-center text-base font-bold text-charcoal">
              Scale
            </th>
            <th className="py-5 px-6 text-center text-base font-bold text-charcoal">
              Custom
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.feature}
              className={cn(
                "border-t border-steel-200 transition-all duration-200 hover:bg-primary-50/30",
                index % 2 === 0 ? "bg-white" : "bg-steel-50/30"
              )}
            >
              <td className="py-5 px-8 text-sm font-semibold text-charcoal">
                {row.feature}
              </td>
              <td className="py-5 px-6 text-center">
                {renderCell(row.starter)}
              </td>
              <td className="py-5 px-6 text-center bg-primary-50/20">
                {renderCell(row.growth)}
              </td>
              <td className="py-5 px-6 text-center">
                {renderCell(row.scale)}
              </td>
              <td className="py-5 px-6 text-center">
                {renderCell(row.custom)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
