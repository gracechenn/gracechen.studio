import { Container } from "@/components/Container";
import { ButtonLink } from "@/components/ui/Button";

const EMAIL = "gracechen567@gmail.com";

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
    desc: "Scales with size and complexity; originals typically begin around $500 and go up from there.",
  },
  {
    term: "Deposit",
    desc: "A 50% deposit begins the work; the remaining balance is due on completion, before shipping.",
  },
  {
    term: "Turnaround",
    desc: "Usually 4–8 weeks from the deposit, depending on scale and the current queue.",
  },
  {
    term: "Shipping",
    desc: "Domestic shipping within the US, or free pickup in New York City.",
  },
];

export function CommissionsPanel() {
  return (
    <Container>
      <div className="max-w-2xl type-body-2 text-ink">
        <p>
          I take on a small number of commissioned oil paintings each year. To
          start, send a short note with your idea, any reference images, and
          where the piece will live. All pieces come unframed.
        </p>
        <p className="mt-6">
          Reach out to{" "}
          <a href={MAILTO} className="hover:underline">
            {EMAIL}
          </a>{" "}
          to get started.
        </p>

        <div className="mt-10 space-y-6">
          {DETAILS.map(({ term, desc }) => (
            <div key={term}>
              <p className="text-ink-muted">{term}</p>
              <p>{desc}</p>
            </div>
          ))}
        </div>

        <ButtonLink href={MAILTO} className="mt-10">
          Email to inquire
        </ButtonLink>
      </div>
    </Container>
  );
}
