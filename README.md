# ✈️ Travel Agent

A conversational travel-assistant chatbot built with **LangChain.js**. A React + Vite
frontend talks to an Express backend that runs a LangGraph ReAct agent powered by
**Google Gemini** (`gemini-3.1-flash-lite`), with two tools and in-memory conversation
memory.

## Features

- **Conversational chat UI** (React + Vite, minimal styling)
- **LLM:** Google Gemini via `@langchain/google-genai`
- **Tools:**
  - **Web Search** — Tavily (`@langchain/tavily`) for travel-related questions
  - **Weather Lookup** — [wttr.in](https://wttr.in) for current weather in a city
- **Memory:** in-memory checkpointer (`MemorySaver`) keyed by a per-session `thread_id`,
  so the agent remembers your preferences within a conversation. The `thread_id` is
  stored in `localStorage`, so memory survives a page refresh (until the server restarts).

## Project structure

```
server/          Express backend + LangChain agent
  agent.js       LLM + tools + checkpointer (createReactAgent)
  tools/weather.js   custom wttr.in weather tool
  index.js       POST /api/chat, GET /api/health
  .env           GOOGLE_API_KEY, TAVILY_API_KEY, PORT
client/          React + Vite chat UI (src/App.jsx)
tests/           Playwright tests (ui.spec.js mocked, live.spec.js smoke)
playwright.config.js
```

## Setup

```bash
# from the repo root
npm run install:all          # installs root + server + client deps
npx playwright install chromium
```

API keys live in `server/.env` (already populated). `.env` is git-ignored.

## Run

Open two terminals:

```bash
npm run server   # starts Express on http://localhost:3001
npm run client   # starts Vite on http://localhost:5180
```

Then open http://localhost:5180 and chat. Try:

- "What's the weather in Tokyo?" → uses the weather tool
- "Top attractions in Kyoto?" → uses Tavily web search
- Tell it your preferences, then ask for a recommendation → it remembers them

## Tests

Playwright boots both servers automatically (see `playwright.config.js`).

```bash
npm test        # mocked UI feature tests (fast, deterministic) — tests/ui.spec.js
npm run test:live   # 1 live end-to-end smoke test (real Gemini + Tavily) — tests/live.spec.js
```

The mocked suite intercepts `/api/chat` with `page.route()` and covers: page load,
sending messages, loading state, weather replies, search replies, `thread_id`
creation/persistence/reuse, "New chat" reset, and backend-error handling.

## Tracing (LangSmith)

Agent runs are traced to [LangSmith](https://smith.langchain.com) automatically when
these are set in `server/.env` — no code changes needed (LangChain reads them on each run):

```
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=<your key>
LANGSMITH_PROJECT=travel-agent     # project name to log under (optional)
```

Each chat request produces a full trace tree (agent → LLM calls → tool calls) under the
`travel-agent` project. View them at https://smith.langchain.com.

## Notes

- The Gemini model is set in `server/agent.js` (`model: "gemini-3.1-flash-lite"`).
  Change that string to use a different Gemini model.
- The checkpointer is in-memory, so conversation history is lost when the server restarts.
