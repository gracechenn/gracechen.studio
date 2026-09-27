import { Container } from "@/components/Container";

const EMAIL = "hello@gracechen.studio";

const MAILTO =
  `mailto:${EMAIL}?subject=` +
  encodeURIComponent("Commission inquiry") +
  "&body=" +
  encodeURIComponent(
    "Hi Grace,\n\nI'd love to commission a piece. Here's what I have in mind:\n\nIdea:\nWhere it will live:\n(Reference images attached, if any)\n\nThanks!",
  );

const DETAILS: { term: string; desc: string }[] = [
  {
    term: "Pricing",
    desc: "Scales with size and complexity, please reach out for a quote.",
  },
  {
    term: "Deposit",
    desc: "A 50% deposit is required to begin the work; the remaining balance is due on completion, before shipping.",
  },
  {
    term: "Turnaround",
    desc: "Usually 4–8 weeks from the deposit, depending on size and the current queue.",
  },
  {
    term: "Shipping",
    desc: "Shipping will be calculated separately or I offer free pickup in New York City.",
  },
];

export function CommissionsPanel() {
  return (
    <Container>
      {/* 451px centred column — matches the About page width. */}
      <div className="mx-auto max-w-[451px] type-body-2 text-ink">
        <p>Commissions are currently closed</p>
        <div
          aria-hidden="true"
          className="my-6 flex items-center gap-2 text-ink-muted"
        >
          <span className="text-[10px] tracking-[0.2em]">⊹˚₊‧</span>
          <span className="flex-1 border-t border-hairline" />
          <span className="text-[10px] tracking-[0.2em]">‧₊˚⊹</span>
        </div>
        <p className="text-ink-faint">
          I take on a small number of commissioned oil paintings each year. Reach
          out to{" "}
          <a href={MAILTO} className="hover:underline">
            {EMAIL}
          </a>{" "}
          to get started. Send a short note with your idea, any reference images,
          and where the piece will live.
        </p>

        <div className="mt-6 space-y-6 text-ink-faint">
          {DETAILS.map(({ term, desc }) => (
            <div key={term}>
              <p className="text-ink-faint">{term}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
