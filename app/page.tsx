"use client";

import {
  AlertCircle,
  ArrowDownToLine,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Copy,
  File,
  FileText,
  Image as ImageIcon,
  Info,
  LockKeyhole,
  Music2,
  Search,
  ShieldCheck,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { ChangeEvent, ClipboardEvent, DragEvent, useRef, useState } from "react";
import { Toaster, toast } from "sonner";

type ShareKind = "document" | "image" | "video" | "audio" | "text";
type ShareInfo = {
  code: string;
  type: ShareKind;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
  expiresAt?: string | null;
  textContent?: string;
};

const MAX_SIZE = 25 * 1024 * 1024;

function classifyFile(file: File): ShareKind | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (
    type === "application/pdf" || type.includes("word") || type.startsWith("text/") ||
    /\.(pdf|docx?|rtf|odt|csv|md|txt)$/i.test(name)
  ) return "document";
  return null;
}

function displaySize(size = 0) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function typeLabel(type: ShareKind) {
  return type === "text" ? "TEXT NOTE" : `${type.toUpperCase()} FILE`;
}

function TypeIcon({ type, className = "" }: { type: ShareKind; className?: string }) {
  const props = { className, strokeWidth: 1.6 };
  if (type === "image") return <ImageIcon {...props} />;
  if (type === "video") return <Video {...props} />;
  if (type === "audio") return <Music2 {...props} />;
  if (type === "text" || type === "document") return <FileText {...props} />;
  return <File {...props} />;
}

function copy(value: string, label = "Copied to clipboard") {
  navigator.clipboard.writeText(value).then(() => toast.success(label));
}

export default function Home() {
  const [tab, setTab] = useState<"upload" | "download">("upload");
  const [mode, setMode] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [burnAfterDownload, setBurnAfterDownload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ShareInfo | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const otpInputs = useRef<Array<HTMLInputElement | null>>([]);

  function selectFile(candidate?: File) {
    if (!candidate) return;
    if (!classifyFile(candidate)) {
      toast.error("Unsupported file type", { description: "Use a document, image, video, or audio file." });
      return;
    }
    if (candidate.size > MAX_SIZE) {
      toast.error("File too large", { description: "Files must be 25 MB or smaller." });
      return;
    }
    setFile(candidate);
    setCreatedCode(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function upload() {
    if (mode === "file" && !file) {
      toast.error("Choose a file first");
      return;
    }
    if (mode === "text" && !text.trim()) {
      toast.error("Write or paste some text first");
      return;
    }
    setIsUploading(true);
    try {
      const payload = new FormData();
      payload.set("mode", mode);
      payload.set("burnAfterDownload", String(burnAfterDownload));
      if (mode === "file" && file) payload.set("file", file);
      if (mode === "text") payload.set("textContent", text);
      const response = await fetch("/api/upload", { method: "POST", body: payload });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to seal this item");
      setCreatedCode(data.code);
      toast.success("Document sealed", {
        description: `Your ledger code is ${data.code}`,
        action: { label: "Copy", onClick: () => copy(data.code, "Code copied") },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to seal this item");
    } finally {
      setIsUploading(false);
    }
  }

  function setOtpDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setResult(null);
    if (digit && index < 5) otpInputs.current[index + 1]?.focus();
  }

  function onOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !otp[index] && index > 0) otpInputs.current[index - 1]?.focus();
  }

  function onOtpPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (!digits.length) return;
    setOtp(Array.from({ length: 6 }, (_, index) => digits[index] || ""));
    otpInputs.current[Math.min(digits.length, 6) - 1]?.focus();
  }

  async function search() {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Enter all six digits");
      return;
    }
    setIsSearching(true);
    setResult(null);
    try {
      const response = await fetch(`/api/download/${code}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invalid or expired code");
      setResult(data);
      toast.success("Entry located", { description: "The item is ready to retrieve." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid or expired code");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
      <Toaster position="top-center" richColors closeButton />
      <header className="mb-10 flex flex-col justify-between gap-7 border-y border-ink/15 py-5 sm:flex-row sm:items-end">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-sm border-2 border-ink bg-paper-light shadow-[3px_3px_0_rgba(20,32,51,.15)]">
            <BookOpenCheck className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[.24em] text-rust">Private transfer register</p>
            <h1 className="display-serif text-3xl font-semibold leading-none tracking-tight">CloudSend</h1>
          </div>
        </div>
        <p className="max-w-xs text-right text-[11px] leading-relaxed text-ink/60">No accounts. No inboxes. Just a sealed item and a six-digit ledger reference.</p>
      </header>

      <nav aria-label="Share actions" className="mx-auto mb-9 flex w-full max-w-md border-b border-ink/20">
        {(["upload", "download"] as const).map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setTab(item)}
            className={`relative flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-[.16em] transition ${tab === item ? "text-ink" : "text-ink/45 hover:text-ink/75"}`}
          >
            {item === "upload" ? <UploadCloud className="h-4 w-4" /> : <ArrowDownToLine className="h-4 w-4" />}
            {item}
            {tab === item && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-rust" />}
          </button>
        ))}
      </nav>

      {tab === "upload" ? (
        <section className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-rust">New entry · 01</p>
              <h2 className="display-serif mt-1 text-3xl">Seal something for later.</h2>
            </div>
            <div className="flex rounded-sm border border-ink/20 bg-paper-light p-1 text-[10px] font-bold uppercase tracking-wider">
              <button type="button" onClick={() => setMode("file")} className={`rounded-sm px-3 py-1.5 ${mode === "file" ? "bg-ink text-paper-light" : "text-ink/55"}`}>File</button>
              <button type="button" onClick={() => setMode("text")} className={`rounded-sm px-3 py-1.5 ${mode === "text" ? "bg-ink text-paper-light" : "text-ink/55"}`}>Text</button>
            </div>
          </div>

          {mode === "file" ? (
            <div
              data-dragging={dragging}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className="upload-zone paper-card flex min-h-64 flex-col items-center justify-center border-2 border-dashed px-6 text-center transition"
            >
              <input ref={picker} onChange={(event: ChangeEvent<HTMLInputElement>) => selectFile(event.target.files?.[0])} type="file" className="hidden" />
              {file ? (
                <div className="relative z-10 flex w-full max-w-md items-center gap-4 border border-ink/20 bg-paper-light p-4 text-left">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm border border-ink/20 bg-[#eee8da]">
                    <TypeIcon type={classifyFile(file) || "document"} className="h-6 w-6 text-ledger-green" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{file.name}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-ink/55">{displaySize(file.size)} · {file.type || "Document"}</p>
                  </div>
                  <button type="button" aria-label="Remove file" onClick={() => setFile(null)} className="p-1 text-ink/45 hover:text-rust"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <>
                  <span className="relative z-10 mb-4 grid h-14 w-14 place-items-center rounded-full border border-ink/25 bg-paper-light"><UploadCloud className="h-6 w-6" strokeWidth={1.5} /></span>
                  <p className="relative z-10 text-sm font-bold">Drop your file in the register</p>
                  <p className="relative z-10 mt-2 text-xs text-ink/55">PDF, documents, images, video, or audio · 25 MB maximum</p>
                  <button type="button" onClick={() => picker.current?.click()} className="relative z-10 mt-5 border-b border-rust pb-0.5 text-xs font-bold uppercase tracking-widest text-rust hover:text-ink">Browse files</button>
                </>
              )}
              {file && <button type="button" onClick={() => picker.current?.click()} className="relative z-10 mt-4 text-xs font-bold uppercase tracking-widest text-rust underline underline-offset-4">Choose another file</button>}
            </div>
          ) : (
            <div className="paper-card p-5 sm:p-7">
              <label htmlFor="text-content" className="relative z-10 mb-3 block text-[10px] font-bold uppercase tracking-[.18em] text-ink/65">Plain-text memorandum</label>
              <textarea id="text-content" value={text} onChange={(event) => { setText(event.target.value); setCreatedCode(null); }} placeholder="Write or paste a private note…" className="relative z-10 min-h-52 w-full resize-y border border-ink/25 bg-[#fdfbf6]/70 p-4 text-sm leading-6 outline-none placeholder:text-ink/35 focus:border-ledger-green" maxLength={100000} />
              <p className="relative z-10 mt-2 text-right text-[10px] text-ink/45">{text.length.toLocaleString()} / 100,000 characters</p>
            </div>
          )}

          <div className="paper-card mt-5 p-5 sm:p-6">
            <div className="relative z-10 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="block">
                <span className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-ink/60"><Clock3 className="h-3.5 w-3.5" /> Retention period</span>
                <div className="w-full rounded-none border border-ink/25 bg-[#eee8da]/50 px-3 py-3 text-xs font-bold text-ink/70 sm:w-56">
                  24 hours (Fixed)
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-3 border-t border-ink/15 pt-4 text-xs sm:border-t-0 sm:pt-0">
                <input type="checkbox" checked={burnAfterDownload} onChange={(event) => setBurnAfterDownload(event.target.checked)} className="h-4 w-4 accent-[#1f3b2d]" />
                <span><span className="block font-bold">Burn after retrieval</span><span className="text-[10px] text-ink/55">Remove it after the first download</span></span>
              </label>
            </div>
            <button type="button" disabled={isUploading} onClick={upload} className="relative z-10 mt-6 flex w-full items-center justify-center gap-2 bg-ink px-5 py-3.5 text-xs font-bold uppercase tracking-[.16em] text-paper-light transition hover:bg-ledger-green disabled:cursor-wait disabled:opacity-60">
              {isUploading ? <span className="animate-pulse">Sealing entry…</span> : <><LockKeyhole className="h-4 w-4" /> Seal & generate code</>}
            </button>
          </div>

          {createdCode && (
            <div className="stamp relative mt-8 overflow-hidden bg-[#f8eee5] px-6 py-7 text-center text-rust sm:px-10">
              <p className="relative z-10 text-[10px] font-bold uppercase tracking-[.28em]">Filed · code reference</p>
              <div className="relative z-10 my-3 flex items-center justify-center gap-3">
                <strong className="display-serif text-5xl font-bold tracking-[.13em] sm:text-6xl">{createdCode}</strong>
                <button type="button" onClick={() => copy(createdCode, "Code copied to clipboard")} aria-label="Copy code" className="rounded-full p-2 hover:bg-rust/10"><Copy className="h-5 w-5" /></button>
              </div>
              <p className="relative z-10 text-[10px] uppercase tracking-wider">Keep this reference private · expires in 24 hours</p>
            </div>
          )}
        </section>
      ) : (
        <section className="mx-auto max-w-3xl">
          <div className="mb-7 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-rust">Record lookup · 02</p>
            <h2 className="display-serif mt-1 text-3xl">Retrieve a sealed entry.</h2>
            <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-ink/55">Enter the six-digit reference exactly as it was issued. Entries cannot be browsed.</p>
          </div>
          <div className="paper-card p-6 sm:p-10">
            <div className="relative z-10 mx-auto max-w-md">
              <label className="mb-4 block text-center text-[10px] font-bold uppercase tracking-[.2em] text-ink/60">Ledger reference</label>
              <div className="flex justify-center gap-1.5 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { otpInputs.current[index] = element; }}
                    value={digit}
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`Code digit ${index + 1}`}
                    onChange={(event) => setOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => onOtpKeyDown(index, event)}
                    onPaste={onOtpPaste}
                    className="otp-box h-12 w-10 border border-ink/35 bg-paper-light text-center text-xl font-bold outline-none sm:h-14 sm:w-12"
                  />
                ))}
              </div>
              <button type="button" onClick={search} disabled={isSearching} className="mt-7 flex w-full items-center justify-center gap-2 bg-ink px-5 py-3.5 text-xs font-bold uppercase tracking-[.16em] text-paper-light hover:bg-ledger-green disabled:opacity-60">
                <Search className="h-4 w-4" /> {isSearching ? "Searching register…" : "Find entry"}
              </button>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] leading-relaxed text-ink/50"><ShieldCheck className="h-3.5 w-3.5" /> Searches are limited to protect sealed entries.</p>
            </div>
          </div>

          {result && (
            <div className="paper-card mt-6 p-5 sm:p-6">
              <div className="relative z-10 flex items-start gap-4 border-b border-ink/15 pb-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm border border-ink/25 bg-[#eee8da]"><TypeIcon type={result.type} className="h-6 w-6 text-ledger-green" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold">{result.fileName || "Untitled note"}</p><span className="border border-ledger-green/35 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-ledger-green">{typeLabel(result.type)}</span></div>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-ink/55">{result.type === "text" ? "Plain-text memorandum" : `${displaySize(result.fileSize)} · ${result.mimeType || "File"}`} · Filed {new Date(result.createdAt).toLocaleString()}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-ledger-green" />
              </div>
              {result.type === "text" ? (
                <>
                  <pre className="relative z-10 mt-5 max-h-64 overflow-auto border border-ink/15 bg-[#eee8da]/50 p-4 whitespace-pre-wrap break-words text-xs leading-6">{result.textContent}</pre>
                  <button type="button" onClick={() => copy(result.textContent || "", "Text copied to clipboard")} className="relative z-10 mt-4 flex w-full items-center justify-center gap-2 border border-ink bg-paper-light px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#eee8da]"><Clipboard className="h-4 w-4" /> Copy text</button>
                </>
              ) : (
                <a href={`/api/download/${result.code}/file`} onClick={() => toast.success("Download starting", { description: "Your original file is being retrieved." })} className="relative z-10 mt-5 flex w-full items-center justify-center gap-2 border border-ink bg-paper-light px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-[#eee8da]"><ArrowDownToLine className="h-4 w-4" /> Download original</a>
              )}
            </div>
          )}
          <aside className="mt-7 flex items-start gap-3 border-l-2 border-rust/60 bg-[#f8eee5]/60 px-4 py-3 text-[11px] leading-relaxed text-ink/65"><Info className="mt-0.5 h-4 w-4 shrink-0 text-rust" />Only someone holding the exact reference can retrieve this item. All entries are permanently removed after 24 hours or when burned.</aside>
        </section>
      )}
      <footer className="mt-14 flex items-center justify-between border-t border-ink/15 pt-4 text-[9px] font-bold uppercase tracking-[.18em] text-ink/45"><span>CloudSend registry</span><span>Private · ephemeral · direct</span></footer>
    </main>
  );
}
