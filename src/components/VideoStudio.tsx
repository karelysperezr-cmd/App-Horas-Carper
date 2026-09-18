import { useEffect, useMemo, useRef, useState } from 'react';
import { Captions, Check, Film, LoaderCircle, Play, Scissors, Sparkles, Upload, WandSparkles, X } from 'lucide-react';

type VideoItem = { id: string; file: File; url: string; duration?: number };
type EditAnalysis = { edits?: unknown[] };

export function VideoStudio() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'analyzing' | 'ready'>('idle');
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<EditAnalysis | null>(null);
  const [captions, setCaptions] = useState(true);
  const [silences, setSilences] = useState(true);
  const [reframe, setReframe] = useState(true);
  const [highlights, setHighlights] = useState(true);
  const videosRef = useRef<VideoItem[]>([]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => () => videosRef.current.forEach((video) => URL.revokeObjectURL(video.url)), []);

  const selected = videos.find((video) => video.id === selectedId) ?? videos[0];
  const total = useMemo(() => videos.reduce((seconds, video) => seconds + (video.duration ?? 0), 0), [videos]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith('video/'))
      .map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    setVideos((previous) => [...previous, ...next]);
    if (!selectedId && next[0]) setSelectedId(next[0].id);
    setStage('idle');
    setProgress(0);
  };

  const remove = (id: string) => {
    setVideos((previous) => {
      const found = previous.find((video) => video.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return previous.filter((video) => video.id !== id);
    });
    if (selectedId === id) setSelectedId(null);
    setStage('idle');
  };

  const renderVideo = async () => {
    if (!videos.length) return;
    setStage('analyzing');
    setProgress(15);
    setError(null);
    setResultUrl(null);
    setAnalysis(null);

    try {
      const form = new FormData();
      videos.forEach((video) => form.append('videos', video.file, video.file.name));
      form.append('options', JSON.stringify({ captions, silences, reframe, highlights }));
      setProgress(35);
      const base = import.meta.env.VITE_VIDEO_API_URL || 'http://localhost:8787';
      const response = await fetch(`${base}/api/video/render`, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo procesar el video.');
      setProgress(100);
      setResultUrl(`${base}${data.downloadUrl}`);
      setAnalysis(data as EditAnalysis);
      setStage('ready');
    } catch (renderError: unknown) {
      setStage('idle');
      setProgress(0);
      setError(renderError instanceof Error ? renderError.message : 'Error procesando el video.');
    }
  };

  const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`;

  return (
    <div className="space-y-5 my-4">
      <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-950 text-white shadow-sm">
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.18em] text-fuchsia-300"><Sparkles size={14} /> AI Video Studio</div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">De crudos a reel, sin empezar de cero.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">Carga las tomas de una grabación para obtener un primer corte vertical con subtítulos.</p>
            </div>
            <div className="hidden rounded-2xl bg-white/10 p-3 sm:block"><WandSparkles size={24} /></div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-sm font-semibold">Material crudo</h2><p className="text-[11px] text-neutral-500">{videos.length ? `${videos.length} clips · ${formatDuration(total)}` : 'Añade clips de una misma grabación'}</p></div>
            <label className="cursor-pointer rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white"><input className="hidden" type="file" accept="video/*" multiple onChange={(event) => addFiles(event.target.files)} /><span className="flex items-center gap-1.5"><Upload size={14} /> Añadir</span></label>
          </div>
          {!videos.length ? (
            <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 text-center hover:border-neutral-400"><input className="hidden" type="file" accept="video/*" multiple onChange={(event) => addFiles(event.target.files)} /><div className="mb-3 rounded-2xl bg-white p-4 shadow-sm"><Film size={25} /></div><p className="text-sm font-semibold">Sube todos tus videos crudos</p><p className="mt-1 text-xs text-neutral-500">MP4 o MOV · puedes seleccionar varios a la vez</p></label>
          ) : (
            <><div className="aspect-video overflow-hidden rounded-3xl bg-black">{selected && <video key={selected.id} src={selected.url} controls className="h-full w-full object-contain" onLoadedMetadata={(event) => { const duration = event.currentTarget.duration; setVideos((previous) => previous.map((video) => video.id === selected.id ? { ...video, duration } : video)); }} />}</div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{videos.map((video, index) => <button key={video.id} type="button" onClick={() => setSelectedId(video.id)} className={`relative min-w-28 overflow-hidden rounded-2xl border p-2 text-left ${selected?.id === video.id ? 'border-black bg-neutral-100' : 'border-neutral-200'}`}><div className="flex items-center gap-2"><div className="rounded-lg bg-black p-1.5 text-white"><Play size={11} /></div><div className="min-w-0"><p className="truncate text-[10px] font-semibold">Clip {index + 1}</p><p className="text-[9px] text-neutral-500">{video.duration ? formatDuration(video.duration) : 'Video'}</p></div></div><span onClick={(event) => { event.stopPropagation(); remove(video.id); }} className="absolute right-1 top-1 rounded-full bg-white p-1"><X size={9} /></span></button>)}</div></>
          )}
        </section>

        <section className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Plantilla de edición</h2><p className="mt-1 text-[11px] text-neutral-500">Corte vertical con selección asistida por IA.</p><div className="mt-4 rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-3"><div className="flex items-center gap-2"><Sparkles size={15} /><div><p className="text-xs font-semibold">Social Dynamic 01</p><p className="text-[10px] text-neutral-500">Reels · TikTok · Shorts · 9:16</p></div></div></div><div className="mt-4 space-y-2">{[['Eliminar silencios', silences, setSilences, Scissors], ['Encuadre vertical 9:16', reframe, setReframe, Film], ['Subtítulos dinámicos', captions, setCaptions, Captions], ['Resaltar palabras clave', highlights, setHighlights, WandSparkles]].map(([label, enabled, setEnabled, Icon]) => { const Component = Icon as typeof Film; return <button key={label as string} type="button" onClick={() => (setEnabled as (value: boolean) => void)(!(enabled as boolean))} className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 p-3 text-left"><span className="flex items-center gap-2 text-xs font-medium"><Component size={15} />{label as string}</span><span className={`flex h-5 w-5 items-center justify-center rounded-full ${enabled ? 'bg-black text-white' : 'bg-neutral-100'}`}>{enabled && <Check size={12} />}</span></button>; })}</div><button disabled={!videos.length || stage === 'analyzing'} type="button" onClick={renderVideo} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-3.5 text-sm font-semibold text-white disabled:bg-neutral-300">{stage === 'analyzing' ? <><LoaderCircle size={16} className="animate-spin" /> Procesando {progress}%</> : <><WandSparkles size={16} /> Generar primer corte</>}</button>{stage === 'analyzing' && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} /></div>}{error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}{stage === 'ready' && resultUrl && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><p className="font-semibold">Primer corte generado</p><p className="mt-1 text-[11px]">Se transcribieron los clips, se seleccionaron segmentos y se añadieron subtítulos.</p><a href={resultUrl} className="mt-3 inline-flex rounded-xl bg-black px-3 py-2 font-semibold text-white">Descargar MP4</a>{analysis?.edits?.length ? <p className="mt-2 text-[10px] text-emerald-700">{analysis.edits.length} segmentos seleccionados.</p> : null}</div>}</section>
      </div>
    </div>
  );
}