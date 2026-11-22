"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Status = "idle" | "submitting" | "success" | "error";

/** Best-effort metrics beacon; never blocks or surfaces errors to the user. */
function sendMetric(event: "view" | "start") {
  void fetch("/api/snailmail/metrics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
  }).catch(() => {});
}

export function SnailmailForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  // Metrics guards: fire each beacon at most once per page view. Refs persist
  // across React's strict-mode double-invoke, so views aren't double-counted.
  const viewSentRef = useRef(false);
  const startSentRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  // Count one page view on mount. Fetch only (no setState) to satisfy the
  // react-hooks/set-state-in-effect rule.
  useEffect(() => {
    if (viewSentRef.current) return;
    viewSentRef.current = true;
    sendMetric("view");
  }, []);

  function handleEmailFocus() {
    if (startSentRef.current) return;
    startSentRef.current = true;
    startTimeRef.current = Date.now();
    sendMetric("start");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setMessage("");
    try {
      const elapsedMs =
        startTimeRef.current != null ? Date.now() - startTimeRef.current : undefined;
      const res = await fetch("/api/snailmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          elapsedMs != null ? { email, elapsedMs } : { email },
        ),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        alreadySubscribed?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(
        data.alreadySubscribed
          ? "You're already on the list — thank you!"
          : "You're on the list. Talk soon!",
      );
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <p className="mt-6 type-body-2 text-ink" aria-live="polite">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <label htmlFor="snailmail-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <input
          id="snailmail-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={handleEmailFocus}
          placeholder="name@example.com"
          className="w-full border border-hairline bg-transparent px-4 py-3 type-body-2 text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
        />
        <Button type="submit" disabled={status === "submitting"} className="sm:w-auto">
          {status === "submitting" ? "Joining…" : "Join"}
        </Button>
      </div>
      {status === "error" && (
        <p className="mt-3 type-label text-[#b00020]" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
