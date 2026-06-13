import "dotenv/config";
import express from "express";
import cors from "cors";
import { chat } from "./agent.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  const { message, threadId } = req.body ?? {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message (string) is required" });
  }
  if (!threadId || typeof threadId !== "string") {
    return res.status(400).json({ error: "threadId (string) is required" });
  }
  try {
    const reply = await chat(message, threadId);
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Travel agent server listening on http://localhost:${PORT}`);
});

// Keep idle connections open longer than the default 5s so a proxied client
// socket isn't closed out from under an in-flight or follow-up request.
server.keepAliveTimeout = 60_000;
server.headersTimeout = 65_000;
