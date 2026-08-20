"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  allLabel?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function MultiSelect({
  values,
  onValuesChange,
  options,
  placeholder = "Seleccionar...",
  allLabel = "Todos",
  searchPlaceholder = "Buscar...",
  className = "",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(value: string) {
    if (values.includes(value)) {
      onValuesChange(values.filter((v) => v !== value));
    } else {
      onValuesChange([...values, value]);
    }
  }

  function clearAll() {
    onValuesChange([]);
  }

  const triggerLabel =
    values.length === 0
      ? null
      : values.length === 1
      ? options.find((o) => o.value === values[0])?.label ?? values[0]
      : `${values.length} seleccionados`;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 justify-between font-normal text-sm",
            className
          )}
        >
          <span className="truncate text-left flex-1">
            {triggerLabel ? (
              <span className="text-gray-800">{triggerLabel}</span>
            ) : (
              <span className="text-gray-400">{allLabel}</span>
            )}
          </span>
          <div className="flex items-center gap-1 ml-1 shrink-0">
            {values.length > 0 && (
              <span
                onClick={(e) => { e.stopPropagation(); clearAll(); }}
                className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)", minWidth: "14rem" }}
        align="start"
        sideOffset={4}
      >
        <div className="p-2 border-b border-gray-100">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">Sin resultados</p>
          ) : (
            filtered.map((option) => {
              const selected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => toggle(option.value)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                    selected
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors",
                    selected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  )}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  {option.label}
                </button>
              );
            })
          )}
        </div>
        {values.length > 0 && (
          <div className="border-t border-gray-100 p-1.5">
            <button
              onClick={clearAll}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 hover:bg-gray-50 rounded transition-colors"
            >
              Limpiar selección
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
