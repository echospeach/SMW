import "dotenv/config";
import path from "path";
import { randomUUID } from "crypto";
import express from "express";
import cors from "cors";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { put } from "@vercel/blob";

const PORT = Number(process.env.PORT) || 4000;
const RENDER_SECRET = process.env.RENDER_SECRET;

if (!RENDER_SECRET) {
  throw new Error("RENDER_SECRET env var is required");
}

type Ratio = "PORTRAIT" | "SQUARE" | "LANDSCAPE";
type JobStatus = "pending" | "rendering" | "done" | "failed";
type Job = { status: JobStatus; url?: string; error?: string };

const jobs = new Map<string, Job>();

let bundleLocationPromise: Promise<string> | null = null;
function getBundleLocation(): Promise<string> {
  if (!bundleLocationPromise) {
    bundleLocationPromise = bundle({
      entryPoint: path.resolve(process.cwd(), "src/remotion/index.ts"),
    });
  }
  return bundleLocationPromise;
}

async function runRender(jobId: string, script: string, ratio: Ratio) {
  try {
    jobs.set(jobId, { status: "rendering" });
    const serveUrl = await getBundleLocation();
    const inputProps = { script, ratio };

    const composition = await selectComposition({ serveUrl, id: "SocialVideo", inputProps });

    const { buffer } = await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      inputProps,
      outputLocation: null,
    });

    if (!buffer) {
      throw new Error("renderMedia returned no buffer");
    }

    const blob = await put(`videos/${jobId}.mp4`, buffer, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
    });

    jobs.set(jobId, { status: "done", url: blob.url });
  } catch (err) {
    jobs.set(jobId, { status: "failed", error: err instanceof Error ? err.message : String(err) });
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((req, res, next) => {
  if (req.header("x-render-secret") !== RENDER_SECRET) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
});

app.post("/render", (req, res) => {
  const { script, ratio } = req.body ?? {};

  if (typeof script !== "string" || !script.trim()) {
    res.status(400).json({ error: "script is required" });
    return;
  }

  const validRatios: Ratio[] = ["PORTRAIT", "SQUARE", "LANDSCAPE"];
  const finalRatio: Ratio = validRatios.includes(ratio) ? ratio : "PORTRAIT";

  const jobId = randomUUID();
  jobs.set(jobId, { status: "pending" });
  void runRender(jobId, script, finalRatio);

  res.status(202).json({ jobId });
});

app.get("/jobs/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(job);
});

app.listen(PORT, () => {
  console.log(`video-renderer listening on port ${PORT}`);
});
