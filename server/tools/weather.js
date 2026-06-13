import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Weather lookup tool backed by wttr.in (free, no API key).
 * Returns a short human-readable summary for the requested city.
 */
export const weatherTool = tool(
  async ({ city }) => {
    try {
      const res = await fetch(
        `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
        { headers: { "User-Agent": "travel-agent" } }
      );
      if (!res.ok) {
        return `Could not get weather for ${city} (status ${res.status}).`;
      }
      const data = await res.json();
      const cur = data?.current_condition?.[0];
      if (!cur) return `No weather data available for ${city}.`;
      const desc = cur.weatherDesc?.[0]?.value ?? "unknown conditions";
      return `Weather in ${city}: ${cur.temp_C}°C (feels like ${cur.FeelsLikeC}°C), ${desc}, humidity ${cur.humidity}%, wind ${cur.windspeedKmph} km/h.`;
    } catch (err) {
      return `Could not get weather for ${city}: ${err.message}`;
    }
  },
  {
    name: "get_weather",
    description:
      "Get the current weather for a given city. Use this for any question about weather, temperature, or conditions in a specific place.",
    schema: z.object({
      city: z.string().describe("The city name to get the weather for"),
    }),
  }
);
