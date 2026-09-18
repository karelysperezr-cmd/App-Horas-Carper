import { config } from 'dotenv';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { platform } from 'node:os';

config({ path: ['.env', '../.env'] });

type Word = { word: string; start: number; end: number };
type Clip = { index: number; path: string; duration: number; text: string; words: Word[] };
type Edit = { clip: number; start: number; end: number };

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(multipart, { limits: { files: 50, fileSize: 1_500 * 1024 * 1024 } });
const root = join(process.cwd(), 'work');
await mkdir(root, { recursive: true });
const apiKey = process.env.OPENAI_API_KEY;
const textModel = process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini';
const transcribeModel = process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1';
const wingetBin = join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages', 'Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe', 'ffmpeg-9.0.1-essentials_build', 'bin');
const ffmpeg = process.env.FFMPEG_PATH || (platform() === 'win32' ? join(wingetBin, 'ffmpeg.exe') : 'ffmpeg');
const ffprobe = process.env.FFPROBE_PATH || (platform() === 'win32' ? join(wingetBin, 'ffprobe.exe') : 'ffprobe');

const run = (command: string, args: string[]) => new Promise<void>((resolve, reject) => { const process = spawn(command, args, { stdio: 'inherit' }); process.on('error', reject); process.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} finalizó con código ${code}`))); });
const capture = (command: string, args: string[]) => new Promise<string>((resolve, reject) => { let output = ''; let error = ''; const process = spawn(command, args); process.stdout.on('data', (data) => output += data); process.stderr.on('data', (data) => error += data); process.on('error', reject); process.on('exit', (code) => code === 0 ? resolve(output) : reject(new Error(error || `${command} finalizó con código ${code}`))); });
const getDuration = async (path: string) => Number((await capture(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path])).trim()) || 0;
const assTime = (seconds: number) => `0:${String(Math.floor(seconds / 60)).padStart(2, '0')}:${(seconds % 60).toFixed(2).padStart(5, '0')}`;
const escapeAssPath = (path: string) => path.replaceAll('\\', '\\\\').replaceAll(':', '\\:').replaceAll("'", "\\'");

async function transcribe(audioPath: string): Promise<{ text: string; words: Word[] }> {
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY en server/.env.');
  const form = new FormData();
  form.append('file', new Blob([await readFile(audioPath)], { type: 'audio/mpeg' }), 'audio.mp3');
  form.append('model', transcribeModel);
  form.append('language', 'es');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: form });
  const body = await response.json() as { text?: string; words?: Array<{ word?: string; start?: number; end?: number }>; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || 'Falló la transcripción.');
  return { text: body.text || '', words: (body.words || []).map((word) => ({ word: String(word.word || '').trim(), start: Number(word.start), end: Number(word.end) })).filter((word) => word.word) };
}

async function chooseEdits(clips: Clip[]): Promise<Edit[]> {
  const fallback = clips.filter((clip) => clip.text.trim()).map((clip) => ({ clip: clip.index, start: 0, end: clip.duration }));
  const prompt = `Eres editor profesional de Reels en español. Crea un video corto, coherente y enérgico con estos clips. Elimina errores, falsos comienzos, repeticiones, silencios y tomas redundantes. No inventes palabras. Devuelve exclusivamente JSON: {"edits":[{"clip":0,"start":0,"end":4.2}]}. Los segundos deben estar dentro de la duración. Material: ${JSON.stringify(clips.map((clip) => ({ clip: clip.index, duration: +clip.duration.toFixed(2), transcript: clip.text })))}`;
  const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: textModel, input: prompt }) });
  const body = await response.json() as { output?: Array<{ content?: Array<{ text?: string }> }>; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || 'Falló la selección IA.');
  try {
    const text = (body.output || []).flatMap((item) => item.content || []).map((content) => content.text || '').join('').replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(text) as { edits?: Edit[] };
    return (result.edits || []).filter((edit) => clips[edit.clip] && Number.isFinite(edit.start) && edit.end > edit.start && edit.start < clips[edit.clip].duration).map((edit) => ({ ...edit, start: Math.max(0, edit.start), end: Math.min(edit.end, clips[edit.clip].duration) }));
  } catch { return fallback; }
}

function makeCaptions(clips: Clip[], edits: Edit[], highlights: boolean) {
  let offset = 0;
  let wordIndex = 0;
  const lines = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 720', 'PlayResY: 1280', '', '[V4+ Styles]', 'Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding', 'Style: Default,Arial,54,&H00FFFFFF,&H00FFFFFF,&H00111111,&H64000000,-1,0,0,0,100,100,0,0,1,4,1,2,45,45,235,1', 'Style: Hot,Arial,58,&H00E879F9,&H00E879F9,&H00111111,&H64000000,-1,0,0,0,100,100,0,0,1,4,1,2,45,45,235,1', '', '[Events]', 'Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text'];
  for (const edit of edits) { for (const word of clips[edit.clip].words) { if (word.end >= edit.start && word.start <= edit.end) { const start = offset + Math.max(0, word.start - edit.start); const end = offset + Math.min(edit.end - edit.start, word.end - edit.start); lines.push(`Dialogue: 0,${assTime(start)},${assTime(Math.max(end, start + 0.18))},${highlights && wordIndex++ % 4 === 0 ? 'Hot' : 'Default'},,0,0,0,,${word.word.replace(/[{}]/g, '')}`); } } offset += edit.end - edit.start; }
  return lines.join('\n');
}

app.get('/api/health', async () => ({ ok: true, aiConfigured: Boolean(apiKey), textModel, transcribeModel }));
app.post('/api/video/render', async (request, reply) => {
  if (!apiKey) return reply.code(503).send({ error: 'Configura OPENAI_API_KEY en server/.env antes de procesar videos.' });
  const jobId = randomUUID(); const directory = join(root, jobId); await mkdir(directory, { recursive: true }); const inputs: string[] = []; let options: { captions?: boolean; silences?: boolean; reframe?: boolean; highlights?: boolean } = {};
  try {
    for await (const part of request.parts()) { if (part.type === 'file') { const path = join(directory, `${inputs.length}-${part.filename || 'clip.mp4'}`); await writeFile(path, await part.toBuffer()); inputs.push(path); } else if (part.fieldname === 'options') { options = JSON.parse(String(part.value)); } }
    if (!inputs.length) return reply.code(400).send({ error: 'No se recibieron videos.' });
    const clips: Clip[] = [];
    for (const [index, path] of inputs.entries()) { const audio = join(directory, `audio-${index}.mp3`); await run(ffmpeg, ['-y', '-i', path, '-vn', '-ac', '1', '-ar', '16000', '-b:a', '64k', audio]); const transcription = await transcribe(audio); clips.push({ index, path, duration: await getDuration(path), ...transcription }); }
    const edits = options.silences === false ? clips.map((clip) => ({ clip: clip.index, start: 0, end: clip.duration })) : await chooseEdits(clips);
    if (!edits.length) throw new Error('No se encontraron segmentos utilizables.');
    const cuts: string[] = [];
    for (const [index, edit] of edits.entries()) { const output = join(directory, `cut-${index}.mp4`); const filter = options.reframe === false ? 'scale=720:-2,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black' : 'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280'; await run(ffmpeg, ['-y', '-ss', String(edit.start), '-i', clips[edit.clip].path, '-t', String(edit.end - edit.start), '-vf', `${filter},fps=30`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-c:a', 'aac', '-ar', '48000', '-ac', '2', output]); cuts.push(output); }
    const list = join(directory, 'cuts.txt'); await writeFile(list, cuts.map((path) => `file '${path.replaceAll("'", "'\\''")}'`).join('\n')); const joined = join(directory, 'joined.mp4'); await run(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]); const output = join(directory, 'output.mp4');
    if (options.captions !== false) { const captions = join(directory, 'captions.ass'); await writeFile(captions, makeCaptions(clips, edits, options.highlights !== false)); await run(ffmpeg, ['-y', '-i', joined, '-vf', `ass='${escapeAssPath(captions)}'`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-c:a', 'copy', '-movflags', '+faststart', output]); } else await run(ffmpeg, ['-y', '-i', joined, '-c', 'copy', '-movflags', '+faststart', output]);
    return { jobId, downloadUrl: `/api/video/${jobId}/download`, edits };
  } catch (error) { app.log.error(error); return reply.code(500).send({ error: error instanceof Error ? error.message : 'No se pudo procesar el video.' }); }
});
app.get<{ Params: { id: string } }>('/api/video/:id/download', async (request, reply) => { reply.header('Content-Type', 'video/mp4').header('Content-Disposition', 'attachment; filename="ai-video.mp4"'); return reply.send(createReadStream(join(root, request.params.id, 'output.mp4'))); });
await app.listen({ port: Number(process.env.PORT || 8787), host: '0.0.0.0' });