"use client";

import { Plus, X } from "lucide-react";

interface Props {
  isList: string[];
  isNotList: string[];
  readOnly: boolean;
  onUpdate: (patch: { what_it_is?: string[]; what_it_is_not?: string[] }) => void;
}

interface ColumnProps {
  title: string;
  items: string[];
  readOnly: boolean;
  bg: string;
  onChange: (next: string[]) => void;
}

function Column({ title, items, readOnly, bg, onChange }: ColumnProps) {
  const update = (idx: number, value: string) => {
    const next = items.slice();
    next[idx] = value;
    onChange(next);
  };
  const remove = (idx: number) => {
    const next = items.slice();
    next.splice(idx, 1);
    onChange(next);
  };
  const add = () => onChange([...items, ""]);

  return (
    <div className={"group/col rounded-md border border-black/10 px-5 py-4 " + bg}>
      <div className="display-font font-medium text-[15px] mb-3">{title}</div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="group flex items-start gap-2">
            <span className="text-black/55 select-none mt-0.5">—</span>
            <input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              disabled={readOnly}
              className="ghost-input text-[13px] flex-1"
            />
            {!readOnly && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="reveal-on-hover text-black/40 hover:text-clay mt-1"
                title="Remove bullet"
              >
                <X size={11} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <button
          type="button"
          onClick={add}
          className="mt-2 text-[11px] text-black/40 hover:text-ink flex items-center gap-1 reveal-on-hover-col"
        >
          <Plus size={11} /> Add
        </button>
      )}
      <style jsx>{`
        .reveal-on-hover-col {
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .group\\/col:hover .reveal-on-hover-col {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

export default function CultureColumns({
  isList,
  isNotList,
  readOnly,
  onUpdate,
}: Props) {
  return (
    <div>
      <div className="label-mono mb-3 !text-[10px]">
        What this team is — and is not
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Column
          title="What this is"
          items={isList}
          readOnly={readOnly}
          bg="bg-black/[0.03]"
          onChange={(next) => onUpdate({ what_it_is: next })}
        />
        <Column
          title="What it's not"
          items={isNotList}
          readOnly={readOnly}
          bg="bg-white"
          onChange={(next) => onUpdate({ what_it_is_not: next })}
        />
      </div>
    </div>
  );
}
