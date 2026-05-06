"use client";

interface Props {
  title: string;
  description: string;
  readOnly: boolean;
  onUpdate: (patch: { lever_title?: string; lever_description?: string }) => void;
}

export default function CapabilityCallout({
  title,
  description,
  readOnly,
  onUpdate,
}: Props) {
  return (
    <div>
      <div className="label-mono mb-3 !text-[10px] text-black/55">
        Lever-pulling capability
      </div>
      <div className="bg-clay/[0.06] border-2 border-clay/40 rounded-md px-6 py-5 text-center">
        <input
          value={title}
          onChange={(e) => onUpdate({ lever_title: e.target.value })}
          disabled={readOnly}
          className="ghost-input text-center display-font font-medium text-[18px] text-clay"
        />
        <textarea
          value={description}
          onChange={(e) => onUpdate({ lever_description: e.target.value })}
          disabled={readOnly}
          rows={3}
          className="ghost-input text-center text-[13px] text-clay/85 mt-2 resize-y w-full max-w-3xl mx-auto block"
        />
      </div>
    </div>
  );
}
