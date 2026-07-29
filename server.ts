import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Import Cloudflare Worker code
import worker from "./src/index.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Healthcheck endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Cloudflare Worker Webhook Simulator" });
  });

  // Simulator Endpoint: Execute Cloudflare Worker logic directly in Node environment
  app.post("/api/webhook", async (req, res) => {
    try {
      // Allow dynamic env credentials override from headers for live workbench testing
      const customEnv = {
        TELEGRAM_BOT_TOKEN: (req.headers["x-telegram-bot-token"] as string) || process.env.TELEGRAM_BOT_TOKEN || "",
        TELEGRAM_CHAT_ID: (req.headers["x-telegram-chat-id"] as string) || process.env.TELEGRAM_CHAT_ID || "",
        RESEND_API_KEY: (req.headers["x-resend-api-key"] as string) || process.env.RESEND_API_KEY || "",
        EMAIL_FROM: (req.headers["x-email-from"] as string) || process.env.EMAIL_FROM || "Rafael Franco <contato@francorafael.com>",
        ALLOWED_ORIGIN: "*"
      };

      // Create a web Request object for Cloudflare Worker fetch method
      const fullUrl = `${req.protocol}://${req.get("host") || "localhost:3000"}/api/webhook`;
      const workerRequest = new Request(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(req.body)
      });

      // Invoke Cloudflare Worker
      const workerResponse = await worker.fetch(workerRequest, customEnv, {} as any);
      const responseData = await workerResponse.json();

      res.status(workerResponse.status).json(responseData);
    } catch (error: any) {
      console.error("Error executing worker:", error);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        message: error.message || "Failed to execute worker simulator"
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
