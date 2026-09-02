import { NextResponse } from "next/server";

export interface ExtractedEvent {
  title: string;
  event_date: string | null;
  event_url: string | null;
}

const SYSTEM_PROMPT = `You extract event listings from screenshots of calendar apps (especially Luma/lu.ma).
Return ONLY valid JSON: an array of objects with keys:
- title (string, required)
- event_date (ISO 8601 string or null if unclear)
- event_url (string or null — only if visible in screenshot)

Rules:
- Extract every visible upcoming event
- Do not invent events not shown
- If date is partial (e.g. "Thu 7pm"), infer year as current/next logical year
- If no URL visible, event_url is null
- No markdown, no explanation, just the JSON array`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Event extraction not configured yet. Add OPENAI_API_KEY to env, or add events manually.",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large (max 8MB)" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all events from this calendar screenshot.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "Could not read screenshot. Try a clearer image." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "[]";

    let events: ExtractedEvent[];
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      events = JSON.parse(cleaned);
      if (!Array.isArray(events)) throw new Error("Not an array");
    } catch {
      return NextResponse.json(
        { error: "Could not parse events from screenshot. Try again." },
        { status: 422 }
      );
    }

    const normalized = events
      .filter((e) => e.title && typeof e.title === "string")
      .map((e) => ({
        title: e.title.trim(),
        event_date: e.event_date ?? null,
        event_url: e.event_url ?? null,
      }));

    return NextResponse.json({ events: normalized });
  } catch (err) {
    console.error("extract-events error:", err);
    return NextResponse.json(
      { error: "Something went wrong processing the screenshot." },
      { status: 500 }
    );
  }
}
