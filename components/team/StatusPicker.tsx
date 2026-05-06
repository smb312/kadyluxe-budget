"use client";

import { useEffect, useRef, useState } from "react";
import type { TeamStatus } from "@/lib/team/types";

interface Props {
  value: TeamStatus;
  onChange: (next: TeamStatus) => void;
  disabled?: boolean;
}

const SWATCHES: { status: TeamStatus; className: string; hatch: boolean; label: string }[] = [
  { status: "confirmed",   className: "bg-teal-bg border-teal-border",   hatch: false, label: "Confirmed" },
  { status: "recommended", className: "bg-amber-bg border-amber-border", hatch: false, label: "Recommended" },
  { status: "vision",      className: "bg-white border-black/20",        hatch: true,  label: "2027 vision" },
];

export default function StatusPicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = SWATCHES.find((s) => s.status === value) ?? SWATCHES[1];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={
          "w-3 h-3 rounded-sm border " +
          current.className +
          (current.hatch ? " vision-hatch" : "")
        }
        title={current.label}
      />
      {open && !disabled && (
        <div className="absolute right-0 top-5 z-20 bg-white border border-black/15 rounded shadow-lg p-1 flex gap-1">
          {SWATCHES.map((s) => (
            <button
              key={s.status}
              type="button"
              onClick={() => {
                onChange(s.status);
                setOpen(false);
              }}
              className={
                "w-5 h-5 rounded-sm border " +
                s.className +
                (s.hatch ? " vision-hatch" : "") +
                (s.status === value ? " ring-2 ring-ink/60 ring-offset-1" : "")
              }
              title={s.label}
            />
          ))}
        </div>
      )}
    </div>
  );
}
