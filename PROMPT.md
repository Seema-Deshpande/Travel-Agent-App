## Building a Travel Agent in LangChain

```
I want to build a Langchain Travel agent with the following requirements:

1. The agent should offer a conversational chatbot interface
2. Use Gemini API and gemini-3.1-flash-lite as the LLM
3. Should be equipped with the following tools: Web Search (Tavily) and Weather Lookup (Wttr)
4. Use the Web Search tool for any travel related queries
5. Use the Weather lookup tool to get weather information for a given city
6. Use an in-memory checkpointer to store user preferences.

Build with Javascript: use React+Vite for the frontend and Express for the backend.

We want to focus on speed so the task doesn't take too long. For example, keep the UI minimial and little styled.

Integrate full testing of all UI features with playwright CLI as a core part of the plan.

My Gemini API Key is <REDACTED — set GOOGLE_API_KEY in server/.env>

My Tavily API Key is <REDACTED — set TAVILY_API_KEY in server/.env>
```