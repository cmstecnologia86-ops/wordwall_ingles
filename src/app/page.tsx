"use client";

import { useMemo, useState } from "react";

type ActivityItem = {
  id: string;
  prompt: string;
  answer: string;
  options?: string[];
};

type Activity = {
  title: string;
  level: string;
  activityType: "match" | "quiz" | "flashcards" | "order";
  instructions: string;
  items: ActivityItem[];
};

const demoActivity: Activity = {
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

export default function Home() {
  const [manualText, setManualText] = useState("");
  const [activityType, setActivityType] = useState<Activity["activityType"]>("match");
  const [file, setFile] = useState<File | null>(null);
  const [activity, setActivity] = useState<Activity>(demoActivity);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const score = useMemo(() => {
    return activity.items.reduce((total, item) => {
      return total + (selectedAnswers[item.id] === item.answer ? 1 : 0);
    }, 0);
  }, [activity, selectedAnswers]);

  async function generateActivity() {
    setLoading(true);
    setError("");
    setSelectedAnswers({});

    try {
      const formData = new FormData();
      formData.append("activityType", activityType);
      formData.append("manualText", manualText);
      if (file) formData.append("file", file);

      const response = await fetch("/api/generate-activity", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("No se pudo generar la actividad.");
      }

      const data = await response.json();
      setActivity(data.activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  const answers = useMemo(() => {
    return [...activity.items.map((item) => item.answer)].sort(() => Math.random() - 0.5);
  }, [activity]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 md:py-12">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
          <div className="mb-6 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Wordwall Inglés
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Genera actividades de inglés desde material escolar.
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-300 md:text-lg">
              Sube una imagen, PDF, documento o pega texto. La IA transforma el contenido en una actividad simple para practicar.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Texto manual opcional
              </label>
              <textarea
                value={manualText}
                onChange={(event) => setManualText(event.target.value)}
                placeholder="Ejemplo: wake up, get dressed, have breakfast, catch the bus..."
                className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-white outline-none ring-cyan-400/40 transition focus:ring-4"
              />

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Archivo
                  </label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp3,.mp4"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    className="block w-full cursor-pointer rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm text-slate-300"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Tipo de actividad
                  </label>
                  <select
                    value={activityType}
                    onChange={(event) => setActivityType(event.target.value as Activity["activityType"])}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none ring-cyan-400/40 transition focus:ring-4"
                  >
                    <option value="match">Unir / Match</option>
                    <option value="quiz">Quiz</option>
                    <option value="flashcards">Flashcards</option>
                    <option value="order">Ordenar palabras</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateActivity}
                disabled={loading}
                className="mt-5 rounded-2xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-950/50 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Generando actividad..." : "Generar actividad"}
              </button>

              {error && (
                <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <h2 className="text-xl font-bold">Flujo MVP</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-200">
                <p>1. Cargas material escolar.</p>
                <p>2. OpenAI identifica vocabulario y frases útiles.</p>
                <p>3. Se genera una actividad jugable.</p>
                <p>4. El niño practica y obtiene puntaje.</p>
              </div>
              <div className="mt-6 rounded-2xl bg-slate-950/70 p-4 text-sm text-slate-300">
                Sin API Key configurada, el sistema usa una actividad demo para que la web funcione igual.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Actividad generada
              </p>
              <h2 className="mt-2 text-2xl font-bold">{activity.title}</h2>
              <p className="mt-2 text-slate-300">{activity.instructions}</p>
            </div>
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold">
              Puntaje: {score} / {activity.items.length}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {activity.items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                <p className="mb-3 text-lg font-bold text-white">{item.prompt}</p>
                <select
                  value={selectedAnswers[item.id] ?? ""}
                  onChange={(event) =>
                    setSelectedAnswers((current) => ({
                      ...current,
                      [item.id]: event.target.value
                    }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none"
                >
                  <option value="">Selecciona respuesta</option>
                  {answers.map((answer) => (
                    <option key={answer} value={answer}>
                      {answer}
                    </option>
                  ))}
                </select>

                {selectedAnswers[item.id] && (
                  <p className={`mt-3 text-sm font-semibold ${
                    selectedAnswers[item.id] === item.answer ? "text-emerald-300" : "text-amber-300"
                  }`}>
                    {selectedAnswers[item.id] === item.answer ? "Correcto" : "Revisar nuevamente"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
