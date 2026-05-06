interface SwatchProps {
  className: string;
  label: string;
  hatched?: boolean;
}

function Swatch({ className, label, hatched }: SwatchProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={
          "w-4 h-4 rounded-sm border " +
          className +
          (hatched ? " vision-hatch" : "")
        }
      />
      <span className="text-[12px] text-black/65">{label}</span>
    </div>
  );
}

export default function Legend() {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <Swatch
        className="bg-teal-bg border-teal-border"
        label="Confirmed / live by June"
      />
      <Swatch
        className="bg-amber-bg border-amber-border"
        label="Recommended for 2026"
      />
      <Swatch className="border-black/20" label="2027 vision" hatched />
    </div>
  );
}
