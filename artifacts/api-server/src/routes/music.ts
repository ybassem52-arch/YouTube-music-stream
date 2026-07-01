import { Router } from "express";

const router = Router();

// ─── YouTube Innertube helpers ────────────────────────────────────────────────

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";

const WEB_CTX = {
  client: { clientName: "WEB", clientVersion: "2.20231121.08.00", hl: "en", gl: "US" },
};

async function innertubePost(
  endpoint: string,
  body: Record<string, unknown>,
  ctx: Record<string, unknown> = WEB_CTX,
  extraHeaders: Record<string, string> = {},
) {
  const res = await fetch(
    `https://www.youtube.com/youtubei/v1/${endpoint}?key=${INNERTUBE_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify({ context: ctx, ...body }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!res.ok) throw new Error(`Innertube ${endpoint} error: ${res.status}`);
  return res.json() as Promise<Record<string, unknown>>;
}

// ─── Search result parsing ────────────────────────────────────────────────────

interface VideoInfo {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
}

function extractVideoRenderer(r: Record<string, unknown>): VideoInfo | null {
  try {
    const v = r as {
      videoId: string;
      title: { runs: Array<{ text: string }> };
      ownerText?: { runs: Array<{ text: string }> };
      shortBylineText?: { runs: Array<{ text: string }> };
      thumbnail: { thumbnails: Array<{ url: string; width: number }> };
      lengthText?: { simpleText: string };
    };
    const id = v.videoId;
    if (!id) return null;
    const title = v.title?.runs?.[0]?.text ?? "Unknown";
    const artist =
      v.ownerText?.runs?.[0]?.text ??
      v.shortBylineText?.runs?.[0]?.text ??
      "Unknown Artist";
    const thumbs = v.thumbnail?.thumbnails ?? [];
    const thumbnail =
      thumbs.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ||
      `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    const duration = v.lengthText?.simpleText ?? "";
    return { id, title, artist, thumbnail, duration };
  } catch {
    return null;
  }
}

function parseSearchResults(data: Record<string, unknown>): VideoInfo[] {
  try {
    type Sections = Array<{
      itemSectionRenderer?: { contents: Array<Record<string, unknown>> };
    }>;
    const sections = (
      data as {
        contents: {
          twoColumnSearchResultsRenderer: {
            primaryContents: {
              sectionListRenderer: { contents: Sections };
            };
          };
        };
      }
    ).contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;
    const videos: VideoInfo[] = [];
    for (const s of sections) {
      for (const item of s.itemSectionRenderer?.contents ?? []) {
        const r = item["videoRenderer"] as Record<string, unknown> | undefined;
        if (r) {
          const v = extractVideoRenderer(r);
          if (v) videos.push(v);
        }
      }
    }
    return videos.slice(0, 25);
  } catch {
    return [];
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/music/search", async (req, res) => {
  const q = req.query["q"];
  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Query 'q' required" });
    return;
  }
  try {
    const data = await innertubePost("search", {
      query: `${q} music`,
      params: "EgIQAQ%3D%3D",
    });
    res.json({ songs: parseSearchResults(data) });
  } catch {
    res.json({ songs: [] });
  }
});

router.get("/music/trending", async (_req, res) => {
  try {
    const data = await innertubePost("search", {
      query: "top music hits 2024",
      params: "EgIQAQ%3D%3D",
    });
    res.json({ songs: parseSearchResults(data) });
  } catch {
    res.json({ songs: [] });
  }
});

export default router;
