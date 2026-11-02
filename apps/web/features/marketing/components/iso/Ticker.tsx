/**
 * A price that rolls into place digit by digit when its `[data-cue]` ancestor turns on
 * (Mercury's money counter, in mono). The text at rest is the exact price; screen readers
 * get it whole, and without motion the columns simply sit on their digit.
 */
export function Ticker({ value, className }: { value: string; className?: string }) {
  let n = 0;
  return (
    <span className={className}>
      <span className="sr-only">{value}</span>
      {value.split("").map((ch, i) => {
        if (!/\d/.test(ch))
          return (
            <span key={i} aria-hidden>
              {ch}
            </span>
          );
        n++;
        return (
          <span key={i} aria-hidden className="tv-digit">
            <span style={{ ["--d" as string]: Number(ch), ["--i" as string]: n }}>
              {"0123456789".split("").map((x) => (
                <span key={x}>{x}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
