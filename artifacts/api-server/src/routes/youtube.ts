import { Router } from "express";

const router = Router();

const YOUTUBE_API_KEY = process.env["YOUTUBE_API_KEY"];
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

async function fetchYouTube(endpoint: string, params: Record<string, string>) {
  if (!YOUTUBE_API_KEY) {
    return null;
  }
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set("key", YOUTUBE_API_KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  return res.json() as Promise<{
    items: Array<{
      id: { videoId: string } | string;
      snippet: {
        title: string;
        channelTitle: string;
        thumbnails: { medium: { url: string }; high: { url: string } };
      };
    }>;
  }>;
}

function mapItems(
  items: Awaited<ReturnType<typeof fetchYouTube>>
): Array<{ id: string; title: string; artist: string; thumbnail: string }> {
  if (!items) return [];
  return items.items.map((item) => ({
    id:
      typeof item.id === "object" && "videoId" in item.id
        ? item.id.videoId
        : String(item.id),
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail:
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      "",
  }));
}

router.get("/youtube/search", async (req, res) => {
  const q = req.query["q"];
  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Query parameter 'q' is required" });
    return;
  }
  if (!YOUTUBE_API_KEY) {
    res.json({ songs: [] });
    return;
  }
  try {
    const data = await fetchYouTube("search", {
      q,
      maxResults: "20",
      videoCategoryId: "10",
    });
    res.json({ songs: mapItems(data) });
  } catch {
    res.status(500).json({ error: "Failed to search YouTube" });
  }
});

router.get("/youtube/trending", async (_req, res) => {
  if (!YOUTUBE_API_KEY) {
    res.json({ songs: [] });
    return;
  }
  try {
    const queries = ["top hits 2024", "best music 2024", "popular songs"];
    const q = queries[Math.floor(Math.random() * queries.length)];
    const data = await fetchYouTube("search", {
      q,
      maxResults: "20",
      order: "viewCount",
    });
    res.json({ songs: mapItems(data) });
  } catch {
    res.status(500).json({ error: "Failed to fetch trending" });
  }
});

export default router;
