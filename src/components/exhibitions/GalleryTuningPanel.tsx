"use client";

import type { GalleryTuning } from "@/components/exhibitions/PhotoGallery";

/** Easing presets offered by the panel (label → CSS timing-function). */
const EASING_PRESETS: Array<{ label: string; value: string }> = [
  { label: "easeInOutExpo", value: "cubic-bezier(0.83, 0, 0.17, 1)" },
  { label: "easeInOut", value: "cubic-bezier(0.42, 0, 0.58, 1)" },
  { label: "easeOutCubic", value: "cubic-bezier(0.33, 1, 0.68, 1)" },
  { label: "easeOutBack", value: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  { label: "ease", value: "ease" },
  { label: "linear", value: "linear" },
];

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-white/60">{value}</span>
      </span>
      {children}
    </label>
  );
}

/**
 * Dev-only overlay for live-tuning the gallery hover interaction. It edits the
 * shared `GalleryTuning` state owned by `PhotoGallery`, so every change is
 * reflected in the next hover (and mid-hover) immediately. Rendering is gated
 * by the parent (development env or `?tune`), so it never ships to production.
 */
export function GalleryTuningPanel({
  tuning,
  onChange,
  defaults,
}: {
  tuning: GalleryTuning;
  onChange: (next: GalleryTuning) => void;
  defaults: GalleryTuning;
}) {
  const set = <K extends keyof GalleryTuning>(key: K, value: GalleryTuning[K]) =>
    onChange({ ...tuning, [key]: value });

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-60 rounded-lg bg-black/85 p-3 font-sans text-[11px] leading-none text-white shadow-lg backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium uppercase tracking-[0.08em] text-white/70">
          Gallery tuning
        </span>
        <button
          type="button"
          onClick={() => onChange(defaults)}
          className="rounded border border-white/25 px-2 py-1 text-white/70 hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <Row label="Duration" value={`${tuning.durationMs}ms`}>
          <input
            type="range"
            min={100}
            max={1500}
            step={10}
            value={tuning.durationMs}
            onChange={(e) => set("durationMs", Number(e.target.value))}
          />
        </Row>

        <Row label="Easing" value="">
          <select
            className="rounded bg-white/10 px-1 py-1 text-white"
            value={tuning.easing}
            onChange={(e) => set("easing", e.target.value)}
          >
            {EASING_PRESETS.map((preset) => (
              <option
                key={preset.value}
                value={preset.value}
                className="text-black"
              >
                {preset.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Expand max-dim" value={`${tuning.expandMax}px`}>
          <input
            type="range"
            min={200}
            max={700}
            step={5}
            value={tuning.expandMax}
            onChange={(e) => set("expandMax", Number(e.target.value))}
          />
        </Row>

        <Row label="Push strength" value={`${tuning.pushStrength}px`}>
          <input
            type="range"
            min={0}
            max={600}
            step={5}
            value={tuning.pushStrength}
            onChange={(e) => set("pushStrength", Number(e.target.value))}
          />
        </Row>

        <Row label="Falloff radius" value={`${tuning.falloffRadius}px`}>
          <input
            type="range"
            min={50}
            max={800}
            step={5}
            value={tuning.falloffRadius}
            onChange={(e) => set("falloffRadius", Number(e.target.value))}
          />
        </Row>
      </div>
    </div>
  );
}
