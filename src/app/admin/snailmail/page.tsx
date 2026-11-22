import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMetrics, getSubscribers } from "@/lib/snailmail";
import { isKvConfigured } from "@/lib/kv";
import DeleteSubscriberButton from "@/components/snailmail/DeleteSubscriberButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Snail mail admin",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

/** Completion rate as a one-decimal percentage, capped at 100%; "0%" when there are no starts. */
function formatCompletionRate(submissions: number, starts: number): string {
  if (starts <= 0) return "0%";
  const rate = Math.min(submissions / starts, 1);
  return `${(rate * 100).toFixed(1)}%`;
}

/** Average time to complete as mm:ss; "–" when no timed submissions exist. */
function formatDuration(ms: number): string {
  if (!(ms > 0)) return "–";
  const totalSeconds = Math.round(ms / 1000);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default async function SnailmailAdminPage() {
  // Disabled entirely when no password is configured (matches inventory admin).
  if (!process.env.ADMIN_PASSWORD) notFound();

  const kvOn = isKvConfigured();
  const subscribers = await getSubscribers();
  const metrics = await getMetrics();
  const allEmails = subscribers.map((s) => s.email).join(", ");

  const metricCards: { label: string; value: string }[] = [
    { label: "Views", value: String(metrics.views) },
    { label: "Starts", value: String(metrics.starts) },
    { label: "Submissions", value: String(subscribers.length) },
    {
      label: "Completion rate",
      value: formatCompletionRate(subscribers.length, metrics.starts),
    },
    { label: "Time to complete", value: formatDuration(metrics.avgCompleteMs) },
  ];

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Snail mail</h1>
      <p style={{ color: "#555", fontSize: 14, marginTop: 8 }}>
        {subscribers.length} {subscribers.length === 1 ? "signup" : "signups"} collected from the public /snailmail page.
      </p>
      {!kvOn && (
        <p
          style={{
            marginTop: 16,
            padding: "10px 12px",
            background: "#fff4e5",
            border: "1px solid #ffcf99",
            borderRadius: 6,
            fontSize: 14,
            color: "#7a4a00",
          }}
        >
          KV is not configured — set <code>KV_REST_API_URL</code> and{" "}
          <code>KV_REST_API_TOKEN</code>. Until then, signups can&apos;t be stored or shown here.
        </p>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Form performance</h2>
        <p style={{ color: "#555", fontSize: 13, marginTop: 4 }}>At a glance</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          {metricCards.map((card) => (
            <div
              key={card.label}
              style={{
                border: "1px solid #eee",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#888",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6 }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {subscribers.length > 0 && (
        <>
          <label style={{ display: "block", marginTop: 24, fontSize: 13, color: "#555" }}>
            All emails (select to copy / export)
            <textarea
              readOnly
              value={allEmails}
              rows={3}
              style={{
                display: "block",
                width: "100%",
                marginTop: 6,
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                resize: "vertical",
              }}
            />
          </label>

          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24, fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "8px 8px" }}>Email</th>
                <th style={{ padding: "8px 8px" }}>Signed up</th>
                <th style={{ padding: "8px 8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.email} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "10px 8px", fontWeight: 500 }}>{s.email}</td>
                  <td style={{ padding: "10px 8px", color: "#555" }}>{formatDate(s.subscribedAt)}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <DeleteSubscriberButton email={s.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {kvOn && subscribers.length === 0 && (
        <p style={{ marginTop: 24, color: "#888", fontSize: 14 }}>No signups yet.</p>
      )}
    </main>
  );
}
