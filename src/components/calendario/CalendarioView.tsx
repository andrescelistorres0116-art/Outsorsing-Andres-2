"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Building2,
  Clock,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Obligacion, ESTADOS_LABELS, EstadoObligacion } from "./mockData";
import { getUrgencyConfig } from "./VencimientoBadge";

const TODAY = new Date(2026, 5, 3); // June 3, 2026

interface CalendarioViewProps {
  obligaciones: Obligacion[];
  onEditObligacion?: (obligacion: Obligacion) => void;
}

function getDaysUntil(dateStr: string): number {
  const due = new Date(dateStr + "T00:00:00");
  const todayMidnight = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());
  return Math.round((due.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface DayPopoverProps {
  date: Date;
  obligations: Obligacion[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function DayPopover({ date, obligations, onClose, anchorRef }: DayPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorRef]);

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl"
      style={{ maxHeight: "340px", overflowY: "auto" }}
    >
      {/* Arrow */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white border-l border-t border-gray-200" />

      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {format(date, "EEEE d 'de' MMMM", { locale: es })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {obligations.map((ob) => {
            const days = getDaysUntil(ob.fechaVencimiento);
            const config = getUrgencyConfig(days, ob.estado);
            return (
              <div
                key={ob.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mt-0.5 shrink-0"
                  style={{ backgroundColor: ob.empresaColor }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {ob.tipoObligacion}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                    <p className="text-xs text-gray-500 truncate">{ob.empresa}</p>
                  </div>
                  {ob.responsable && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                      <p className="text-xs text-gray-400 truncate">{ob.responsable}</p>
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold shrink-0",
                    config.bg,
                    config.text,
                    config.border
                  )}
                >
                  {ESTADOS_LABELS[ob.estado as EstadoObligacion]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DayCellProps {
  date: Date;
  currentMonth: Date;
  obligations: Obligacion[];
}

function DayCell({ date, currentMonth, obligations }: DayCellProps) {
  const [showPopover, setShowPopover] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isCurrentDay = isSameDay(date, TODAY);
  const isWeekend = getDay(date) === 0 || getDay(date) === 6;

  const visibleObligations = obligations.slice(0, 3);
  const remaining = obligations.length - 3;

  return (
    <div
      ref={cellRef}
      className={cn(
        "relative min-h-[90px] sm:min-h-[100px] p-1.5 border border-gray-100 cursor-pointer transition-colors",
        isCurrentMonth
          ? isWeekend
            ? "bg-gray-50/60"
            : "bg-white"
          : "bg-gray-50/30",
        isCurrentDay && "ring-2 ring-blue-500 ring-inset",
        obligations.length > 0 && "hover:bg-blue-50/30"
      )}
      onClick={() => {
        if (obligations.length > 0) setShowPopover((v) => !v);
      }}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
            isCurrentDay
              ? "bg-blue-600 text-white font-bold"
              : isCurrentMonth
              ? "text-gray-700"
              : "text-gray-300"
          )}
        >
          {format(date, "d")}
        </span>
        {obligations.length > 0 && (
          <span className="text-[10px] text-gray-400 font-medium">
            {obligations.length}
          </span>
        )}
      </div>

      {/* Obligation pills */}
      <div className="space-y-0.5">
        {visibleObligations.map((ob) => {
          const days = getDaysUntil(ob.fechaVencimiento);
          const config = getUrgencyConfig(days, ob.estado);
          return (
            <div
              key={ob.id}
              className={cn(
                "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium truncate",
                config.bg,
                config.text
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: ob.empresaColor }}
              />
              <span className="truncate">{ob.tipoObligacion}</span>
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="text-[10px] text-blue-600 font-semibold pl-1">
            +{remaining} más
          </div>
        )}
      </div>

      {/* Popover */}
      {showPopover && obligations.length > 0 && (
        <DayPopover
          date={date}
          obligations={obligations}
          onClose={() => setShowPopover(false)}
          anchorRef={cellRef}
        />
      )}
    </div>
  );
}

export default function CalendarioView({ obligaciones }: CalendarioViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Adjust to Monday-start (0=Mon ... 6=Sun in Spanish calendar)
  // getDay returns 0=Sun,1=Mon,...6=Sat; we want Mon=0...Sun=6
  const startDayOfWeek = getDay(monthStart); // 0=Sun
  const paddingBefore = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const obligacionesByDate: Record<string, Obligacion[]> = {};
  obligaciones.forEach((ob) => {
    const key = ob.fechaVencimiento.split("T")[0];
    if (!obligacionesByDate[key]) obligacionesByDate[key] = [];
    obligacionesByDate[key].push(ob);
  });

  // Legend
  const legend = [
    { color: "bg-red-400", label: "< 3 días / Vencido" },
    { color: "bg-orange-400", label: "3-7 días" },
    { color: "bg-yellow-400", label: "7-15 días" },
    { color: "bg-green-400", label: "> 15 días" },
    { color: "bg-gray-400", label: "Completado" },
  ];

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h3 className="text-base font-semibold text-gray-900 capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h3>

        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border border-b-0 border-gray-100 rounded-t-xl overflow-hidden">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className={cn(
              "py-2 text-center text-xs font-semibold text-gray-500 bg-gray-50",
              (day === "Sáb" || day === "Dom") && "text-gray-400"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border border-gray-100 rounded-b-xl overflow-hidden -mt-4">
        {/* Padding cells before month start */}
        {Array.from({ length: paddingBefore }).map((_, i) => {
          const date = new Date(monthStart);
          date.setDate(date.getDate() - (paddingBefore - i));
          return (
            <div
              key={`pre-${i}`}
              className="min-h-[90px] sm:min-h-[100px] p-1.5 bg-gray-50/30 border border-gray-100"
            >
              <span className="text-xs text-gray-200 font-medium">
                {format(date, "d")}
              </span>
            </div>
          );
        })}

        {/* Month days */}
        {days.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const dayObligations = obligacionesByDate[key] || [];
          return (
            <DayCell
              key={key}
              date={date}
              currentMonth={currentMonth}
              obligations={dayObligations}
            />
          );
        })}

        {/* Padding cells after month end */}
        {(() => {
          const totalCells = paddingBefore + days.length;
          const remainder = totalCells % 7;
          const paddingAfter = remainder === 0 ? 0 : 7 - remainder;
          return Array.from({ length: paddingAfter }).map((_, i) => {
            const date = new Date(monthEnd);
            date.setDate(date.getDate() + i + 1);
            return (
              <div
                key={`post-${i}`}
                className="min-h-[90px] sm:min-h-[100px] p-1.5 bg-gray-50/30 border border-gray-100"
              >
                <span className="text-xs text-gray-200 font-medium">
                  {format(date, "d")}
                </span>
              </div>
            );
          });
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-sm", l.color)} />
            <span className="text-xs text-gray-500">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm ring-2 ring-blue-500 bg-white" />
          <span className="text-xs text-gray-500">Hoy</span>
        </div>
      </div>
    </div>
  );
}
