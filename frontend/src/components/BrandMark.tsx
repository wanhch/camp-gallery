interface BrandMarkProps {
  inverse?: boolean;
  compact?: boolean;
}

export function BrandMark({ inverse = false, compact = false }: BrandMarkProps) {
  return (
    <span className={`brand-mark ${inverse ? "brand-mark--inverse" : ""}`} aria-label="中科曙光 Sugon">
      <span className="brand-mark__symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span className="brand-mark__copy">
        <strong>SUGON</strong>
        {!compact && <small>中科曙光</small>}
      </span>
    </span>
  );
}
