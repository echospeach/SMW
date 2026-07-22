"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import type { Plan, Ratio } from "@/generated/prisma/enums";
import { C, RATIOS } from "@/lib/theme";
import { planIncludesVideo } from "@/lib/plan";

export function ThumbnailStudio({ plan, used, limit }: { plan: Plan; used: number; limit: number }) {
  const allowed = planIncludesVideo(plan);
  const [generationsUsed, setGenerationsUsed] = useState(used);
  const capReached = generationsUsed >= limit;

  const [prompt, setPrompt] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [ratio, setRatio] = useState<Ratio>("SQUARE");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  async function generate() {
    if (!prompt.trim() || generating || !allowed || capReached) return;
    setGenerating(true);
    setError(null);
    setResultUrl(null);
    try {
      const form = new FormData();
      form.set("prompt", prompt);
      form.set("ratio", ratio);
      if (overlayText.trim()) form.set("overlayText", overlayText.trim());
      if (photo) form.set("photo", photo);

      const res = await fetch("/api/thumbnails/generate", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't generate a thumbnail. Try again.");
        return;
      }
      if (!data?.cached) setGenerationsUsed((n) => n + 1);
      setResultUrl(data.url);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    if (!resultUrl || downloading) return;
    setDownloading(true);
    try {
      // A plain <a download> is ignored by browsers for cross-origin URLs
      // (this is served from Vercel Blob's own domain) -- it just navigates
      // there instead of downloading. Fetching the bytes and downloading via
      // a blob: URL (same-origin) is what actually forces a save.
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "thumbnail.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div
        className="space-y-4 rounded-xl p-5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <h3 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          Brief
        </h3>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a warm autumn candle glowing on a wooden table, cinematic lighting"
            rows={5}
            className="mt-1 w-full resize-none rounded-lg px-3 py-2 text-sm outline-none placeholder:opacity-50"
            style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
          />
        </div>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Text on thumbnail (optional)
          </label>
          <input
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="e.g. 50% OFF THIS WEEK"
            maxLength={200}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none placeholder:opacity-50"
            style={{ background: C.raised, color: C.paper, border: `1px solid ${C.line}` }}
          />
          <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
            Composited on top as real, crisp text — not left to the AI to render.
          </p>
        </div>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Reference photo (optional)
          </label>
          <div className="mt-1.5">
            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Reference"
                  className="h-24 w-24 rounded-lg object-cover"
                  style={{ border: `1px solid ${C.line}` }}
                />
                <button
                  onClick={clearPhoto}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: C.red, color: C.ink }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg text-[10px]"
                style={{ border: `1px dashed ${C.line}`, color: C.muted }}
              >
                <Upload size={16} />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="mt-1.5 text-[11px]" style={{ color: C.muted }}>
            If you upload a photo, the AI bases the image on it instead of generating from
            scratch.
          </p>
        </div>

        <div>
          <label className="text-xs" style={{ color: C.muted }}>
            Format
          </label>
          <div className="mt-1.5 flex gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRatio(r.id)}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-lg py-2.5"
                style={{
                  background: ratio === r.id ? C.raised : "transparent",
                  border: `1px solid ${ratio === r.id ? C.amber : C.line}`,
                }}
              >
                <span
                  className="block rounded-[2px]"
                  style={{
                    aspectRatio: r.ratio,
                    height: 22,
                    border: `1.5px solid ${ratio === r.id ? C.amber : C.muted}`,
                  }}
                />
                <span
                  className="text-[11px] font-medium"
                  style={{ color: ratio === r.id ? C.paper : C.muted }}
                >
                  {r.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {!allowed && (
          <p className="text-[11px]" style={{ color: C.amber }}>
            Thumbnail generation needs the Growth plan or higher.{" "}
            <Link href="/billing" className="underline">
              Upgrade in Billing
            </Link>
            .
          </p>
        )}
        {allowed && capReached && (
          <p className="text-[11px]" style={{ color: C.amber }}>
            You&apos;ve used all {limit} AI generations included in your plan this month. Resets
            next month, or{" "}
            <Link href="/billing" className="underline">
              upgrade for more
            </Link>
            .
          </p>
        )}
        {allowed && !capReached && (
          <p className="text-[11px]" style={{ color: C.muted }}>
            {generationsUsed} of {limit} AI generations used this month.
          </p>
        )}

        <button
          onClick={generate}
          disabled={!prompt.trim() || generating || !allowed || capReached}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
          style={{ background: C.amber, color: C.ink }}
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
          {generating ? "Generating…" : "Generate thumbnail"}
        </button>
        {error && (
          <p className="text-[11px]" style={{ color: C.red }}>
            {error}
          </p>
        )}
      </div>

      <div
        className="space-y-4 rounded-xl p-5"
        style={{ background: C.panel, border: `1px solid ${C.line}` }}
      >
        <h3 className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: C.muted }}>
          Result
        </h3>
        {!resultUrl && !generating && (
          <div
            className="flex h-64 items-center justify-center px-6 text-center text-xs"
            style={{ color: C.muted }}
          >
            Write a prompt (and optionally upload a photo), then generate — your thumbnail will
            show up here.
          </div>
        )}
        {generating && (
          <div
            className="flex h-64 items-center justify-center gap-2 text-xs"
            style={{ color: C.muted }}
          >
            <Loader2 size={14} className="animate-spin" /> Generating…
          </div>
        )}
        {resultUrl && !generating && (
          <>
            <div
              className="relative mx-auto overflow-hidden rounded-lg"
              style={{
                aspectRatio: RATIOS.find((r) => r.id === ratio)?.ratio,
                maxHeight: 320,
                border: `1px solid ${C.line}`,
              }}
            >
              <img
                src={resultUrl}
                alt="Generated thumbnail"
                className="h-full w-full object-cover"
              />
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="block w-full rounded-lg py-2.5 text-center text-sm font-medium disabled:opacity-60"
              style={{ background: C.green, color: C.ink }}
            >
              {downloading ? "Downloading…" : "Download"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
