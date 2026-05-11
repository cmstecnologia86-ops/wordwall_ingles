import OpenAI from "openai";
import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import crypto from "node:crypto";

export const runtime = "nodejs";

type Payload = {
  prompt: string;
  answer?: string;
  imageHint?: string;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function makeCacheKey(payload: Payload) {
  return crypto
    .createHash("sha1")
    .update(`${payload.prompt}|${payload.answer || ""}|${payload.imageHint || ""}`)
    .digest("hex")
    .slice(0, 16);
}

function buildPrompt(payload: Payload) {
  return `
Create a single educational illustration for an 8-year-old child learning English.

Target vocabulary:
${payload.prompt}

Spanish meaning:
${payload.answer || ""}

Visual hint:
${payload.imageHint || payload.prompt}

Requirements:
- Cute child-friendly cartoon illustration
- Bright but clean colors
- Very easy to understand
- Focus on one clear action
- Simple background
- No text inside the image
- No labels
- No watermarks
- No split panels
- Make it useful for a vocabulary learning game
`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;

    if (!body?.prompt) {
      return NextResponse.json(
        { error: "Missing prompt" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY || !process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({
        imageUrl: null,
        cached: false,
        reason: "missing_env"
      });
    }

    const cacheKey = makeCacheKey(body);
    const safeName = slugify(body.prompt || "vocabulary");
    const blobPath = `activity-visuals/${safeName}-${cacheKey}.png`;

    try {
      const existing = await list({
        prefix: blobPath,
        limit: 1
      });

      if (existing.blobs.length > 0) {
        return NextResponse.json({
          imageUrl: existing.blobs[0].url,
          cached: true
        });
      }
    } catch {
      // continue to generation
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const imageResponse = await client.images.generate({
      model: "gpt-image-1",
      prompt: buildPrompt(body),
      size: "1024x1024"
    });

    const b64 = imageResponse.data?.[0]?.b64_json;

    if (!b64) {
      return NextResponse.json({
        imageUrl: null,
        cached: false,
        reason: "no_image_generated"
      });
    }

    const buffer = Buffer.from(b64, "base64");

    const uploaded = await put(blobPath, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png"
    });

    return NextResponse.json({
      imageUrl: uploaded.url,
      cached: false
    });
  } catch (error) {
    console.error("generate-item-image error", error);

    return NextResponse.json({
      imageUrl: null,
      cached: false,
      reason: "generation_error"
    });
  }
}