"use client";

import { useState } from "react";
import { makeVisualDataUri } from "@/lib/activityVisuals";

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
  activityType: "match" | "quiz" | "flashcards" | "order";
  instructions: string;
  items: ActivityItem[];
};

type GameQuestion = {
  item: ActivityItem;
  options: ActivityItem[];
};

type ViewMode = "learn" | "play";

const demoActivity: Activity = {
  title: "Daily routines match",
  level: "Beginner / 8 years old",
  activityType: "match",
  instructions: "Learn the vocabulary with images first. Then play and choose the correct picture.",
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

function shuffleArray<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function normalizeActivity(activity: Activity): Activity {
  return {
    ...activity,
    items: activity.items.map((item, index) => ({
      id: item.id || String(index + 1),
      prompt: item.prompt,
      answer: item.answer,
      options: item.options ?? [],
      imageHint: item.imageHint ?? item.prompt
    }))
  };
}

function buildGameQuestions(items: ActivityItem[], randomize = true): GameQuestion[] {
  const orderedItems = randomize ? shuffleArray(items) : [...items];

  return orderedItems.map((item) => {
    const distractorPool = orderedItems.filter((candidate) => candidate.id !== item.id);
    const distractors = (randomize ? shuffleArray(distractorPool) : distractorPool).slice(0, Math.min(3, distractorPool.length));
    const options = randomize ? shuffleArray([item, ...distractors]) : [item, ...distractors];

    return {
      item,
      options
    };
  });
}

function speakEnglish(text: string) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export default function Home() {
  const [manualText, setManualText] = useState("");
  const [activityType, setActivityType] = useState<Activity["activityType"]>("match");
  const [file, setFile] = useState<File | null>(null);
  const [activity, setActivity] = useState<Activity>(demoActivity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<ViewMode>("learn");
  const [learnIndex, setLearnIndex] = useState(0);
  const [gameQuestions, setGameQuestions] = useState<GameQuestion[]>(buildGameQuestions(demoActivity.items, false));
  const [gameIndex, setGameIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  const currentLearnItem = activity.items[learnIndex] ?? activity.items[0];
  const currentQuestion = gameQuestions[gameIndex];
  const selectedOption = currentQuestion?.options.find((option) => option.id === selectedOptionId) ?? null;
  const isCorrectAnswer = selectedOption && currentQuestion ? selectedOption.id === currentQuestion.item.id : null;

  function resetInteractiveViews(nextActivity: Activity, randomize = true) {
    const normalized = normalizeActivity(nextActivity);

    setActivity(normalized);
    setMode("learn");
    setLearnIndex(0);
    setGameQuestions(buildGameQuestions(normalized.items, randomize));
    setGameIndex(0);
    setSelectedOptionId(null);
    setGameScore(0);
    setGameFinished(false);
  }

  async function generateActivity() {
    setLoading(true);
    setError("");

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
      resetInteractiveViews(data.activity, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  function restartGame() {
    setGameQuestions(buildGameQuestions(activity.items, true));
    setGameIndex(0);
    setSelectedOptionId(null);
    setGameScore(0);
    setGameFinished(false);
  }

  function startPlayMode() {
    restartGame();
    setMode("play");
  }

  function handleOptionClick(optionId: string) {
    if (!currentQuestion || selectedOptionId) return;

    setSelectedOptionId(optionId);

    if (optionId === currentQuestion.item.id) {
      setGameScore((current) => current + 1);
    }
  }

  function handleNextQuestion() {
    if (!currentQuestion) return;

    if (gameIndex >= gameQuestions.length - 1) {
      setGameFinished(true);
      return;
    }

    setGameIndex((current) => current + 1);
    setSelectedOptionId(null);
  }

  const learnProgress = activity.items.length > 0 ? Math.round(((learnIndex + 1) / activity.items.length) * 100) : 0;
  const gameProgress = gameQuestions.length > 0
    ? Math.round((((gameFinished ? gameQuestions.length : gameIndex + 1)) / gameQuestions.length) * 100)
    : 0;

  return (
    <main className="page-shell">
      <section className="panel hero-panel">
        <div className="hero-header">
          <div>
            <p className="eyebrow">WORDWALL INGLÉS • MVP VISUAL</p>
            <h1>Aprender con imágenes y jugar la actividad</h1>
            <p className="hero-text">
              Sube material, genera vocabulario con IA y conviértelo en una actividad visual:
              primero <strong>Aprender</strong>, después <strong>Jugar</strong>.
            </p>
          </div>
          <div className="mini-callout">
            <span>Objetivo:</span>
            <strong>que el niño vea, escuche y juegue el vocabulario</strong>
          </div>
        </div>

        <div className="generator-grid">
          <div className="generator-card">
            <label className="field-label">Texto manual opcional</label>
            <textarea
              value={manualText}
              onChange={(event) => setManualText(event.target.value)}
              placeholder="Ejemplo: wake up, get up, wash, have a shower, get dressed, catch the bus, do homework, go to bed..."
              className="text-area"
            />

            <div className="input-row">
              <div className="field-block">
                <label className="field-label">Archivo</label>
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp3,.mp4"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="file-input"
                />
              </div>

              <div className="field-block">
                <label className="field-label">Tipo de actividad</label>
                <select
                  value={activityType}
                  onChange={(event) => setActivityType(event.target.value as Activity["activityType"])}
                  className="select-input"
                >
                  <option value="match">Unir / Match</option>
                  <option value="quiz">Quiz</option>
                  <option value="flashcards">Flashcards</option>
                  <option value="order">Ordenar palabras</option>
                </select>
              </div>
            </div>

            <div className="generator-actions">
              <button onClick={generateActivity} disabled={loading} className="primary-button">
                {loading ? "Generando actividad..." : "Generar actividad visual"}
              </button>

              <button onClick={startPlayMode} className="secondary-button" type="button">
                Probar juego ahora
              </button>
            </div>

            {error && <p className="error-box">{error}</p>}
          </div>

          <div className="tips-card">
            <h3>Flujo sugerido</h3>
            <ol>
              <li>Subir o pegar el vocabulario.</li>
              <li>Entrar a <strong>Aprender vocabulario</strong>.</li>
              <li>Revisar imágenes, palabra y traducción.</li>
              <li>Escuchar pronunciación.</li>
              <li>Entrar a <strong>Jugar con imágenes</strong>.</li>
              <li>Elegir la imagen correcta.</li>
            </ol>

            <div className="note-box">
              Este checkpoint ya deja la plataforma mucho más cercana a Wordwall para un niño:
              <strong> aprender + jugar </strong>.
            </div>
          </div>
        </div>
      </section>

      <section className="panel workspace-panel">
        <div className="workspace-header">
          <div>
            <p className="eyebrow">ACTIVIDAD GENERADA</p>
            <h2>{activity.title}</h2>
            <p className="workspace-text">{activity.instructions}</p>
          </div>

          <div className="workspace-side">
            <span className="pill">Nivel: {activity.level}</span>
            <span className="pill">Palabras: {activity.items.length}</span>
          </div>
        </div>

        <div className="mode-switch">
          <button
            type="button"
            className={`mode-button ${mode === "learn" ? "mode-button-active" : ""}`}
            onClick={() => setMode("learn")}
          >
            Aprender vocabulario
          </button>
          <button
            type="button"
            className={`mode-button ${mode === "play" ? "mode-button-active" : ""}`}
            onClick={() => setMode("play")}
          >
            Jugar con imágenes
          </button>
        </div>

        {mode === "learn" && currentLearnItem && (
          <div className="learn-panel">
            <div className="progress-row">
              <span>Tarjeta {learnIndex + 1} de {activity.items.length}</span>
              <span>{learnProgress}%</span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${learnProgress}%` }} />
            </div>

            <div className="learn-card">
              <div className="visual-card">
                <img
                  src={makeVisualDataUri(currentLearnItem.imageHint || currentLearnItem.prompt, currentLearnItem.prompt)}
                  alt={currentLearnItem.prompt}
                  className="visual-image"
                  draggable={false}
                />
              </div>

              <div className="learn-copy">
                <p className="small-kicker">Vocabulary card</p>
                <h3>{currentLearnItem.prompt}</h3>
                <p className="translation-text">{currentLearnItem.answer}</p>
                <p className="helper-text">
                  Primero observa la imagen, luego escucha la palabra y relaciónala con su significado.
                </p>

                <div className="learn-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => speakEnglish(currentLearnItem.prompt)}
                  >
                    🔊 Escuchar
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setLearnIndex((current) => Math.max(0, current - 1))}
                    disabled={learnIndex === 0}
                  >
                    ← Anterior
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setLearnIndex((current) => Math.min(activity.items.length - 1, current + 1))}
                    disabled={learnIndex === activity.items.length - 1}
                  >
                    Siguiente →
                  </button>
                </div>

                <div className="inline-actions">
                  <button type="button" className="play-now-button" onClick={startPlayMode}>
                    Ir a jugar esta actividad
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mode === "play" && (
          <div className="play-panel">
            {!gameFinished && currentQuestion && (
              <>
                <div className="play-header">
                  <div>
                    <p className="small-kicker">Juego visual</p>
                    <h3>Which picture is: <span className="play-word">{currentQuestion.item.prompt}</span>?</h3>
                    <p className="helper-text">Haz clic en la imagen correcta.</p>
                  </div>

                  <div className="play-stats">
                    <span className="pill">Puntaje: {gameScore} / {gameQuestions.length}</span>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => speakEnglish(currentQuestion.item.prompt)}
                    >
                      🔊 Escuchar palabra
                    </button>
                  </div>
                </div>

                <div className="progress-row">
                  <span>Pregunta {gameIndex + 1} de {gameQuestions.length}</span>
                  <span>{gameProgress}%</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${gameProgress}%` }} />
                </div>

                <div className="option-grid">
                  {currentQuestion.options.map((option) => {
                    const selected = selectedOptionId === option.id;
                    const correct = selectedOptionId && option.id === currentQuestion.item.id;
                    const wrong = selected && option.id !== currentQuestion.item.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`image-option ${selected ? "image-option-selected" : ""} ${correct ? "image-option-correct" : ""} ${wrong ? "image-option-wrong" : ""}`}
                        onClick={() => handleOptionClick(option.id)}
                        disabled={!!selectedOptionId}
                      >
                        <img
                          src={makeVisualDataUri(option.imageHint || option.prompt, option.prompt)}
                          alt={option.prompt}
                          className="option-image"
                          draggable={false}
                        />
                      </button>
                    );
                  })}
                </div>

                {selectedOptionId && (
                  <div className={`feedback-box ${isCorrectAnswer ? "feedback-success" : "feedback-warning"}`}>
                    {isCorrectAnswer ? (
                      <p>
                        ✅ ¡Muy bien! <strong>{currentQuestion.item.prompt}</strong> significa <strong>{currentQuestion.item.answer}</strong>.
                      </p>
                    ) : (
                      <p>
                        🙂 Buen intento. La respuesta correcta para <strong>{currentQuestion.item.prompt}</strong> es la imagen de <strong>{currentQuestion.item.answer}</strong>.
                      </p>
                    )}

                    <button type="button" className="primary-button" onClick={handleNextQuestion}>
                      {gameIndex === gameQuestions.length - 1 ? "Ver resultado final" : "Siguiente pregunta"}
                    </button>
                  </div>
                )}
              </>
            )}

            {gameFinished && (
              <div className="result-card">
                <p className="small-kicker">Resultado final</p>
                <h3>Juego terminado</h3>
                <p className="result-score">{gameScore} / {gameQuestions.length}</p>
                <p className="helper-text">
                  Puedes volver a aprender el vocabulario o jugar otra vez con las imágenes.
                </p>

                <div className="learn-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setMode("learn");
                      setLearnIndex(0);
                    }}
                  >
                    Volver a aprender
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      restartGame();
                      setMode("play");
                    }}
                  >
                    Jugar otra vez
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="gallery-block">
          <div className="gallery-head">
            <div>
              <p className="small-kicker">Galería visual</p>
              <h3>Todo el vocabulario de la actividad</h3>
            </div>
          </div>

          <div className="gallery-grid">
            {activity.items.map((item) => (
              <div key={item.id} className="gallery-card">
                <img
                  src={makeVisualDataUri(item.imageHint || item.prompt, item.prompt)}
                  alt={item.prompt}
                  className="gallery-image"
                  draggable={false}
                />
                <div className="gallery-copy">
                  <strong>{item.prompt}</strong>
                  <span>{item.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .page-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 24%),
            radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.14), transparent 22%),
            #020617;
          color: #ffffff;
          padding: 32px 20px 56px;
        }

        .panel {
          max-width: 1200px;
          margin: 0 auto 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(4, 14, 40, 0.88);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.38);
          padding: 28px;
        }

        .hero-header,
        .workspace-header,
        .play-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .hero-header h1,
        .workspace-header h2,
        .play-header h3,
        .gallery-head h3,
        .learn-copy h3,
        .tips-card h3,
        .result-card h3 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.15;
        }

        .hero-text,
        .workspace-text,
        .helper-text {
          color: #cbd5e1;
          line-height: 1.7;
        }

        .eyebrow,
        .small-kicker {
          margin: 0 0 10px;
          color: #67e8f9;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.26em;
          text-transform: uppercase;
        }

        .small-kicker {
          letter-spacing: 0.16em;
          font-size: 0.75rem;
        }

        .mini-callout,
        .pill {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(103, 232, 249, 0.18);
          color: #dbeafe;
          border-radius: 18px;
          padding: 12px 16px;
        }

        .mini-callout {
          max-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .workspace-side,
        .play-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .generator-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: 1.25fr 0.75fr;
          gap: 18px;
        }

        .generator-card,
        .tips-card,
        .learn-panel,
        .play-panel,
        .gallery-block {
          background: rgba(2, 8, 23, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 22px;
        }

        .field-label {
          display: block;
          margin-bottom: 10px;
          color: #e2e8f0;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .text-area,
        .file-input,
        .select-input {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: #020617;
          color: #ffffff;
          border-radius: 18px;
          padding: 14px 16px;
          font-size: 0.96rem;
        }

        .text-area {
          min-height: 170px;
          resize: vertical;
        }

        .input-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .generator-actions,
        .learn-actions,
        .inline-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .generator-actions {
          margin-top: 18px;
        }

        .primary-button,
        .secondary-button,
        .play-now-button,
        .mode-button,
        .image-option {
          border: 0;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, opacity 0.18s ease;
        }

        .primary-button,
        .secondary-button,
        .play-now-button,
        .mode-button {
          border-radius: 16px;
          padding: 13px 18px;
          font-size: 0.96rem;
          font-weight: 800;
        }

        .primary-button {
          background: linear-gradient(135deg, #67e8f9, #38bdf8);
          color: #082f49;
          box-shadow: 0 12px 30px rgba(14, 165, 233, 0.22);
        }

        .secondary-button {
          background: rgba(15, 23, 42, 0.9);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .play-now-button {
          background: rgba(34, 197, 94, 0.14);
          color: #bbf7d0;
          border: 1px solid rgba(34, 197, 94, 0.24);
          padding: 12px 16px;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .play-now-button:hover,
        .mode-button:hover,
        .image-option:hover {
          transform: translateY(-1px);
        }

        .primary-button:disabled,
        .secondary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
        }

        .tips-card ol {
          margin: 14px 0 0;
          padding-left: 18px;
          color: #dbeafe;
          line-height: 1.8;
        }

        .note-box,
        .error-box,
        .feedback-box,
        .result-card {
          margin-top: 18px;
          border-radius: 20px;
          padding: 16px 18px;
        }

        .note-box {
          background: rgba(103, 232, 249, 0.08);
          border: 1px solid rgba(103, 232, 249, 0.16);
          color: #dbeafe;
        }

        .error-box {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.26);
          color: #fecaca;
        }

        .mode-switch {
          margin-top: 20px;
          display: inline-flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 8px;
          background: rgba(2, 8, 23, 0.72);
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .mode-button {
          background: transparent;
          color: #cbd5e1;
        }

        .mode-button-active {
          background: linear-gradient(135deg, rgba(103, 232, 249, 0.22), rgba(56, 189, 248, 0.12));
          color: #ecfeff;
          box-shadow: inset 0 0 0 1px rgba(103, 232, 249, 0.24);
        }

        .progress-row {
          margin-top: 10px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #cbd5e1;
          font-size: 0.92rem;
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(15, 23, 42, 0.84);
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .progress-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #67e8f9, #22c55e);
        }

        .learn-card {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1fr 0.9fr;
          gap: 20px;
          align-items: center;
        }

        .visual-card,
        .gallery-card,
        .image-option {
          background: rgba(7, 16, 39, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
        }

        .visual-image,
        .option-image,
        .gallery-image {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 18px;
        }

        .learn-copy {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .translation-text {
          margin: 0;
          font-size: 1.45rem;
          font-weight: 800;
          color: #a5f3fc;
        }

        .play-word {
          color: #67e8f9;
        }

        .option-grid,
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 18px;
        }

        .image-option {
          padding: 10px;
          cursor: pointer;
          box-shadow: 0 10px 34px rgba(2, 8, 23, 0.2);
        }

        .image-option-selected {
          box-shadow: 0 0 0 2px rgba(103, 232, 249, 0.45);
        }

        .image-option-correct {
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.6);
          background: rgba(34, 197, 94, 0.08);
        }

        .image-option-wrong {
          box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.6);
          background: rgba(251, 146, 60, 0.08);
        }

        .feedback-box {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
        }

        .feedback-success {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(74, 222, 128, 0.26);
          color: #dcfce7;
        }

        .feedback-warning {
          background: rgba(251, 146, 60, 0.12);
          border: 1px solid rgba(251, 146, 60, 0.22);
          color: #ffedd5;
        }

        .result-card {
          background: rgba(56, 189, 248, 0.08);
          border: 1px solid rgba(103, 232, 249, 0.16);
          color: #ecfeff;
        }

        .result-score {
          margin: 8px 0;
          font-size: 2.2rem;
          font-weight: 900;
          color: #67e8f9;
        }

        .gallery-block {
          margin-top: 20px;
        }

        .gallery-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }

        .gallery-card {
          overflow: hidden;
        }

        .gallery-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 14px 16px;
        }

        .gallery-copy strong {
          font-size: 1rem;
        }

        .gallery-copy span {
          color: #cbd5e1;
          font-size: 0.94rem;
        }

        @media (max-width: 960px) {
          .generator-grid,
          .learn-card,
          .option-grid,
          .gallery-grid,
          .input-row {
            grid-template-columns: 1fr;
          }

          .panel {
            padding: 22px 18px;
          }

          .hero-header h1,
          .workspace-header h2,
          .play-header h3,
          .gallery-head h3,
          .learn-copy h3 {
            font-size: 1.6rem;
          }
        }
      `}</style>
    </main>
  );
}