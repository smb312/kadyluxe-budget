interface Props {
  ownerEmail: string | null;
}

export default function ViewOnlyBanner({ ownerEmail }: Props) {
  return (
    <div className="bg-ink text-cream">
      <div className="max-w-[1400px] mx-auto px-8 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="mono-font text-[10px] tracking-[0.18em] uppercase">
          VIEW ONLY · Read-only share link
        </div>
        {ownerEmail && (
          <div className="mono-font text-[11px] text-cream/70">
            Owner: {ownerEmail}
          </div>
        )}
      </div>
    </div>
  );
}
