import { clsx } from "@/lib/clsx";

/**
 * Container — a horizontally-centred content column with consistent gutters.
 * Part of the small design-system layer so section pages share the same rhythm.
 */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag className={clsx("mx-auto w-full max-w-[1200px] px-6 sm:px-8", className)}>
      {children}
    </Tag>
  );
}
