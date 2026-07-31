import Link from "next/link";
import { clsx } from "@/lib/clsx";

/**
 * The single, canonical button style for the whole site. Every button and
 * button-link uses this exact treatment — same color, padding, and type — so
 * they can never drift apart. Callers may only pass `className` for layout
 * concerns (width, margin), never to restyle the button itself.
 */
const buttonStyle =
  "inline-flex items-center justify-center gap-2 rounded-none type-label transition-colors duration-200 border-2 border-[#0051ff] bg-[#0051ff] px-8 py-[21px] text-white hover:border-[#3374ff] hover:bg-[#3374ff] disabled:opacity-40 disabled:pointer-events-none";

type CommonProps = {
  className?: string;
  children: React.ReactNode;
};

export function Button({
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={clsx(buttonStyle, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  href,
  children,
  ...rest
}: CommonProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >) {
  return (
    <Link href={href} className={clsx(buttonStyle, className)} {...rest}>
      {children}
    </Link>
  );
}
