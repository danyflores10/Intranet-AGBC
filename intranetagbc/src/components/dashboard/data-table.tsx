"use client"

import { useState } from "react"
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchPlaceholder?: string
  searchKey?: keyof T
  pageSize?: number
  actions?: (item: T) => React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  searchKey,
  pageSize = 10,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const filtered = searchKey
    ? data.filter((item) =>
        String(item[searchKey] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : data

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchKey && (
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="h-10 pl-9 rounded-xl border-border/60 bg-muted/30 text-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${col.className ?? ""}`}
                >
                  {col.label}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              paged.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-border/30 transition-colors hover:bg-muted/20"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.className ?? ""}`}>
                      {col.render ? col.render(item) : String(item[col.key] ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Mostrando {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="h-8 w-8 p-0"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
