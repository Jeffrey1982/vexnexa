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
        <Check className="w-5 h-5 text-primary mx-auto" aria-label="Included" />
      ) : (
        <X className="w-5 h-5 text-steel-400 mx-auto" aria-label="Not included" />
      )
    }
    return <span className="text-sm text-charcoal">{value}</span>
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse bg-white rounded-xl shadow-soft-sm overflow-hidden">
        <thead>
          <tr className="bg-steel-50">
            <th className="py-4 px-6 text-left text-sm font-semibold text-charcoal">
              Feature
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-charcoal">
              Starter
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-charcoal">
              Growth
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-charcoal">
              Scale
            </th>
            <th className="py-4 px-4 text-center text-sm font-semibold text-charcoal">
              Custom
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.feature}
              className={cn(
                "border-t border-steel-200",
                index % 2 === 0 ? "bg-white" : "bg-steel-50/50"
              )}
            >
              <td className="py-4 px-6 text-sm font-medium text-charcoal">
                {row.feature}
              </td>
              <td className="py-4 px-4 text-center">
                {renderCell(row.starter)}
              </td>
              <td className="py-4 px-4 text-center">
                {renderCell(row.growth)}
              </td>
              <td className="py-4 px-4 text-center">
                {renderCell(row.scale)}
              </td>
              <td className="py-4 px-4 text-center">
                {renderCell(row.custom)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
