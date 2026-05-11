# Wordwall Inglés MVP

Software inicial tipo Wordwall para transformar material escolar de inglés en actividades jugables con IA.

## Qué incluye

- Next.js + React.
- Página web para subir material o pegar texto.
- API interna `/api/generate-activity`.
- Integración con OpenAI Responses API mediante el paquete oficial `openai`.
- Actividades iniciales:
  - Match / unir.
  - Quiz.
  - Flashcards.
  - Ordenar palabras.
- Modo demo si no existe `OPENAI_API_KEY`.

## Archivos aceptados en este MVP

- PNG / JPG: se envían al modelo como imagen.
- PDF: se intenta extraer texto.
- DOCX: se intenta extraer texto.
- TXT: se lee como texto.

Audio y video quedan para la siguiente etapa, usando transcripción previa antes de generar la actividad.

## Variables de entorno

Crear `.env.local` en local o configurar en Vercel:

```env
OPENAI_API_KEY=sk-proj_xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-5.2
```

## Ejecutar localmente

```powershell
cd C:\Users\cma\Documents\GitHub\wordwall_ingles
npm install
npm run dev
```

Abrir:

```text
http://localhost:3000
```

## Build

```powershell
npm run build
```

## Subida inicial a GitHub desde carpeta local

```powershell
cd C:\Users\cma\Documents\GitHub\wordwall_ingles

git init
git branch -M main
git add .
git commit -m "Initial MVP wordwall ingles"
git remote add origin https://github.com/cmstecnologia86-ops/wordwall_ingles.git
git push -u origin main
```

## Despliegue en Vercel

1. Entrar a Vercel.
2. Importar el repo `wordwall_ingles`.
3. Framework: Next.js.
4. Agregar `OPENAI_API_KEY` en Environment Variables.
5. Deploy.

## Próxima etapa recomendada

- Guardar actividades generadas en base de datos.
- Agregar autenticación simple.
- Generar audio de pronunciación.
- Transcribir audio/video.
- Agregar actividades drag-and-drop reales.
- Crear banco de progreso por niño.
