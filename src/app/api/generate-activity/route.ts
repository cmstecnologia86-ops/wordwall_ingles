import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ActivityType = "match" | "quiz" | "flashcards" | "order";

type ActivityItem = {
  id: string;
  prompt: string;
  answer: string;
  options?: string[];
  imageHint?: string;
};

type Activity = {
  title: string;
  level: string;
  activityType: ActivityType;
  instructions: string;
  items: ActivityItem[];
};

const fallbackActivity: Activity = {
  title: "Daily routines match",
  level: "Beginner / 8 years old",
  activityType: "match",
  instructions: "Look at each word and learn it with the visual cards. Then play and choose the correct picture.",
  items: [
    { id: "1", prompt: "wake up", answer: "despertar", imageHint: "alarm clock and bed" },
    { id: "2", prompt: "get up", answer: "levantarse", imageHint: "child getting out of bed" },
    { id: "3", prompt: "wash", answer: "lavarse", imageHint: "washing face and hands" },
    { id: "4", prompt: "have a shower", answer: "ducharse", imageHint: "child taking a shower" },
    { id: "5", prompt: "get dressed", answer: "vestirse", imageHint: "putting on clothes" },
    { id: "6", prompt: "catch the bus", answer: "tomar el bus", imageHint: "school bus" },
    { id: "7", prompt: "do homework", answer: "hacer la tarea", imageHint: "books and homework" },
    { id: "8", prompt: "go to bed", answer: "irse a la cama", imageHint: "moon and bed" }
  ]
};

async function fileToText(file: File | null) {
  if (!file) return "";

  const fileName = file.name;
  const fileType = file.type;
  const sizeKb = Math.round(file.size / 1024);

  if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
    return await file.text();
  }

  return [
    `Uploaded file: ${fileName}`,
    `MIME type: ${fileType || "unknown"}`,
    `Approx size: ${sizeKb} KB`,
    "This MVP currently prioritizes the manual text and will add deeper extraction for PDF, DOCX, audio and video in later iterations."
  ].join("\n");
}

function safeParseJson(text: string) {
  const cleaned = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function normalizeActivity(activity: Activity, requestedType: ActivityType): Activity {
  return {
    ...activity,
    activityType: requestedType,
    items: activity.items.map((item, index) => ({
      id: item.id || String(index + 1),
      prompt: item.prompt,
      answer: item.answer,
      options: item.options ?? [],
      imageHint: item.imageHint ?? item.prompt
    }))
  };
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const activityType = String(formData.get("activityType") || "match") as ActivityType;
  const manualText = String(formData.get("manualText") || "");
  const file = formData.get("file") instanceof File ? (formData.get("file") as File) : null;
  const fileText = await fileToText(file);

  const sourceContent = [manualText, fileText].filter(Boolean).join("\n\n").trim();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      activity: {
        ...fallbackActivity,
        activityType
      }
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
You are a generator of educational English activities for an 8-year-old child.

Goal:
Create a child-friendly vocabulary activity inspired by Wordwall.
The final content will be used in:
1) a learning view with images,
2) a game view where the child chooses the correct picture.

Requested activity type:
${activityType}

Source material:
${sourceContent || "No text was provided. Generate an initial daily routines activity in English."}

Rules:
- Beginner English only.
- Child is 8 years old.
- Prioritize concrete, visual vocabulary.
- Use the vocabulary found in the source if available.
- Generate between 5 and 10 items.
- The Spanish answer must be simple and child-friendly.
- Add a short imageHint for each item so the UI can show a visual clue.
- Return ONLY valid JSON.
- Do not use Markdown.

Required JSON format:
{
  "title": "string",
  "level": "string",
  "activityType": "match | quiz | flashcards | order",
  "instructions": "string",
  "items": [
    {
      "id": "1",
      "prompt": "English word or phrase",
      "answer": "Spanish answer",
      "imageHint": "short visual clue",
      "options": ["optional", "optional", "optional"]
    }
  ]
}
`;

    const response = await client.responses.create({
      model: "gpt-5.5",
      input: prompt
    });

    const outputText = response.output_text;
    const activity = safeParseJson(outputText);

    return NextResponse.json({
      activity: normalizeActivity(activity, activityType)
    });
  } catch (error) {
    console.error("generate-activity error", error);

    return NextResponse.json({
      activity: {
        ...fallbackActivity,
        activityType
      }
    });
  }
}