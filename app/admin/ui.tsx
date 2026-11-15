import Icon, { type IconName } from "../components/Icon";

// Admin is in Lagos; server clocks are UTC.
export const when = (d: Date) =>
  d.toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n)}%`);
const initials = (name: string | null) => (name ?? "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

export function PanelHead({ icon, title, count }: { icon: IconName; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[#F1ECF4] px-5 py-4">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F3EEF6] text-[#140A18]">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <h2 className="font-bold">{title}</h2>
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${count ? "bg-[#FF2D6F] text-white" : "bg-[#F3EEF6] text-[#8A8090]"}`}>
        {count}
      </span>
    </div>
  );
}

export function Panel({ icon, title, count, empty, children }: { icon: IconName; title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <section className="flex max-h-[34rem] flex-col overflow-hidden rounded-2xl border border-[#EDE6F0] bg-white">
      <PanelHead icon={icon} title={title} count={count} />
      {count === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[#A39AA8]">{empty}</p>
      ) : (
        <div className="divide-y divide-[#F1ECF4] overflow-y-auto">{children}</div>
      )}
    </section>
  );
}

export function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${className}`}>{children}</span>;
}

export function Avatar({ src, name, size }: { src?: string | null; name: string | null; size: string }) {
  return src ? (
    <img src={src} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} grid shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#A5ABB8] to-[#858994] text-[13px] font-semibold tracking-wide text-white`}>
      {initials(name) || <Icon name="person" className="h-1/2 w-1/2" />}
    </span>
  );
}
