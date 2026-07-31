import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-10">
      <nav className="flex flex-wrap items-center justify-center gap-x-[38px] gap-y-3 type-label">
        <Link
          href="https://instagram.com/gracechen.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink transition-colors hover:text-ink-muted"
        >
          Instagram
        </Link>
        <Link
          href="https://www.tiktok.com/@gracechen.studio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink transition-colors hover:text-ink-muted"
        >
          TikTok
        </Link>
        <Link
          href="mailto:gracechen567@gmail.com"
          className="text-ink transition-colors hover:text-ink-muted"
        >
          Contact
        </Link>
        <span className="text-ink-muted">© 2026 Grace Chen</span>
      </nav>
    </footer>
  );
}
