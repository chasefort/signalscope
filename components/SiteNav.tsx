import Link from "next/link";

const links = [
  { href: "/how-it-works", label: "how it works", key: "how" },
  { href: "/tech", label: "tech", key: "tech" },
] as const;

/** Header for the explainer pages. The app itself keeps its own header,
 *  because there the wordmark doubles as the reset control. */
export function SiteNav({ current }: { current: "how" | "tech" }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-6">
      <Link href="/" className="flex items-baseline gap-2">
        <span className="font-mono text-lg font-semibold tracking-tight text-fg">
          signal<span className="text-signal">scope</span>
        </span>
        <span className="hidden font-mono text-[11px] text-dim sm:inline">/ market intelligence for GTM</span>
      </Link>

      <nav className="flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            aria-current={current === link.key ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors hover:text-signal ${
              current === link.key ? "text-signal" : "text-mut"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/"
          className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-mut transition-colors hover:border-signal-dim hover:text-signal"
        >
          run a report →
        </Link>
      </nav>
    </header>
  );
}
