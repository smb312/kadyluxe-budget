"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MONTHS } from "@/lib/constants";
import type { Month, Partner, PartnerType } from "@/lib/types";

type Draft = Pick<
  Partner,
  "name" | "category" | "cost" | "type" | "months" | "start_month" | "included" | "notes"
>;

interface Props {
  onAdd: (partner: Draft) => void;
  onCancel: () => void;
}

export default function AddPartnerModal({ onAdd, onCancel }: Props) {
  const [form, setForm] = useState<Draft>({
    name: "",
    category: "",
    cost: 0,
    type: "monthly",
    months: 12,
    start_month: "May",
    included: true,
    notes: "",
  });

  const submit = () => {
    if (!form.name.trim()) {
      alert("Partner name is required");
      return;
    }
    onAdd({
      ...form,
      months: form.type === "annual" ? null : form.months ?? 12,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-5"
      onClick={onCancel}
    >
      <div
        className="bg-cream rounded p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="display-font text-2xl font-medium tracking-tight mb-5">
          Add new partner
        </h3>

        <div className="flex flex-col gap-3.5">
          <Field label="Partner Name">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Somerce"
              className="modal-input"
            />
          </Field>
          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. TikTok Shop / Affiliate"
              className="modal-input"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Cost">
              <input
                type="number"
                value={form.cost}
                onChange={(e) =>
                  setForm({ ...form, cost: parseFloat(e.target.value) || 0 })
                }
                className="modal-input"
              />
            </Field>
            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as PartnerType })
                }
                className="modal-input"
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </Field>
            <Field label="Start month">
              <select
                value={form.start_month}
                onChange={(e) =>
                  setForm({ ...form, start_month: e.target.value as Month })
                }
                className="modal-input"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Notes (optional)">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context, scope, status..."
              className="modal-input min-h-[60px] resize-y"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={submit} className="btn-primary">
            <Plus size={14} /> Add partner
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.15);
          border-radius: 3px;
          font-family: "Inter", sans-serif;
          font-size: 14px;
          background: white;
          outline: none;
        }
        .modal-input:focus {
          border-color: #1a1a1a;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-mono mb-1.5">{label}</div>
      {children}
    </div>
  );
}
