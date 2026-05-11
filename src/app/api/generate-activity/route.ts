import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ActivityType = "match" | "quiz" | "flashcards" | "order";

const fallbackActivity = {
  title: "Daily routines",
  level: "8 years old / beginner",
  activityType: "match",
  instructions: "Match each English phrase with the correct meaning.",
  items: [
    { id: "1", prompt: "wake up", answer: "despertar" },
    { id: "2", prompt: "get dressed", answer: "vestirse" },
    { id: "3", prompt: "catch the bus", answer: "tomar el bus" },
    { id: "4", prompt: "do homework", answer: "hacer la tarea" }
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
    `Archivo subido: ${fileName}`,
    `Tipo MIME: ${fileType || "no detectado"}`,
    `Tamaño aproximado: ${sizeKb} KB`,
    "Nota: en este MVP inicial se registra el archivo y se usa el texto manual si fue ingresado. La extracción profunda de PDF/DOCX/audio/video se agregará en la siguiente iteración."
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

export async function POST(request: Request) {
  const formData = await request.formData();

  const activityType = String(formData.get("activityType") || "match") as ActivityType;
  const manualText = String(formData.get("manualText") || "");
  const file = formData.get("file") instanceof File ? formData.get("file") as File : null;
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

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = `
Eres un generador de actividades educativas de inglés para un niño de 8 años.

Objetivo:
Crear una actividad tipo Wordwall simple, visual y útil para practicar inglés.

Tipo de actividad solicitada:
${activityType}

Material entregado:
${sourceContent || "No se entregó texto. Genera una actividad inicial de rutinas diarias en inglés."}

Reglas:
- Nivel: niño de 8 años, inglés inicial.
- Usar vocabulario simple.
- No inventar contenido avanzado.
- Si el material tiene vocabulario, priorizar ese vocabulario.
- Generar entre 4 y 8 ítems.
- Las respuestas deben estar en español simple.
- El resultado debe ser SOLO JSON válido.
- No uses Markdown.

Formato obligatorio:
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

  return NextResponse.json({ activity });
}
