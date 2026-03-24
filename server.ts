import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route for TikTok Download
  app.post("/api/download", async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "Please provide a TikTok URL" });
    }

    try {
      // Using TikWM API for reliable TikTok video extraction
      const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000 // 10s timeout
      });
      
      if (response.data.code !== 0) {
        return res.status(400).json({ error: response.data.msg || "Failed to fetch video data" });
      }

      const data = response.data.data;
      
      res.json({
        id: data.id,
        title: data.title,
        cover: data.cover,
        videoUrl: data.play, // No watermark video URL
        music: data.music,
        author: {
          nickname: data.author.nickname,
          uniqueId: data.author.unique_id,
          avatar: data.author.avatar
        }
      });
    } catch (error: any) {
      console.error("Error fetching TikTok data:", error.message);
      res.status(500).json({ error: "Internal server error. Please try again later." });
    }
  });

  // Proxy route to force download as attachment
  app.get("/api/proxy-download", async (req, res) => {
    const { url, filename } = req.query;
    if (!url) return res.status(400).send("URL is required");

    try {
      const response = await axios({
        method: "get",
        url: url as string,
        responseType: "stream",
      });

      res.setHeader("Content-Disposition", `attachment; filename="${filename || "video.mp4"}"`);
      res.setHeader("Content-Type", "video/mp4");
      response.data.pipe(res);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).send("Failed to download video");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
