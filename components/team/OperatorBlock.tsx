"use client";

interface Props {
  name: string;
  description: string;
  readOnly: boolean;
  onUpdate: (patch: { name?: string; description?: string }) => void;
}

export default function OperatorBlock({
  name,
  description,
  readOnly,
  onUpdate,
}: Props) {
  return (
    <div>
      <div className="label-mono mb-3 !text-[10px]">The operator</div>
      <div className="bg-lavender-bg border border-lavender-border rounded-md px-6 py-5 text-center text-lavender-text">
        <input
          value={name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          disabled={readOnly}
          className="ghost-input text-center display-font font-medium text-[18px]"
        />
        <textarea
          value={description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          disabled={readOnly}
          rows={2}
          className="ghost-input text-center text-[13px] mt-1 resize-none overflow-hidden w-full"
        />
      </div>
    </div>
  );
}
