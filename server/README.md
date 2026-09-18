# Backend de Video IA

Requiere Node.js 20+, FFmpeg y ffprobe disponibles en PATH, y una clave de OpenAI.

```powershell
cd server
Copy-Item .env.example .env
# agrega OPENAI_API_KEY en .env
npm install
npm run dev
```

El cliente usa `http://localhost:8787` por defecto. Puedes configurarlo con `VITE_VIDEO_API_URL`.

Si FFmpeg se instala en una ubicación distinta, define `FFMPEG_PATH` y `FFPROBE_PATH` en `.env` con las rutas completas a sus ejecutables.

El render crea un primer corte vertical 720x1280, con recorte central, subtítulos palabra por palabra y selección de segmentos basada en la transcripción. No incluye aún tracking de rostro o persona.