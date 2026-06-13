import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TavilySearch } from "@langchain/tavily";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { weatherTool } from "./tools/weather.js";

const SYSTEM_PROMPT = `You are a friendly and helpful travel assistant.
- Use the web search tool (tavily) for travel-related questions such as attractions, destinations, flights, visas, local tips, and recommendations.
- Use the weather tool (get_weather) whenever the user asks about the weather, temperature, or conditions in a specific city.
- Remember the user's stated preferences (e.g. budget, climate, interests, home city) and use them in later answers.
- Keep answers concise and conversational.`;

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-flash-lite",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0.3,
});

const tavilyTool = new TavilySearch({
  maxResults: 5,
  tavilyApiKey: process.env.TAVILY_API_KEY,
});

// In-memory checkpointer: persists conversation state (incl. preferences) per thread_id.
const checkpointer = new MemorySaver();

const agent = createReactAgent({
  llm,
  tools: [tavilyTool, weatherTool],
  checkpointer,
  stateModifier: SYSTEM_PROMPT,
});

/**
 * Send a user message to the agent on a given conversation thread.
 * The thread_id keys the in-memory checkpointer so history/preferences persist.
 */
export async function chat(message, threadId) {
  const result = await agent.invoke(
    { messages: [{ role: "user", content: message }] },
    { configurable: { thread_id: threadId } }
  );
  const last = result.messages.at(-1);
  // content can be a string or an array of content parts depending on the model.
  if (typeof last?.content === "string") return last.content;
  if (Array.isArray(last?.content)) {
    return last.content
      .map((p) => (typeof p === "string" ? p : p?.text ?? ""))
      .join("");
  }
  return String(last?.content ?? "");
}
