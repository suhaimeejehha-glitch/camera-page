"use client";

interface PhotoControlsProps {
  onTakePhoto: () => void;
  onToggleMirror: () => void;
  isMirrored: boolean;
  canTakePhoto: boolean;
  isFull: boolean;
}

/**
 * ปุ่มควบคุมใต้กล้องโทน Dark Studio สำหรับจอตู้ทัชสกรีน (เฉพาะถ่ายรูปและกลับด้านกล้อง)
 */
export function PhotoControls({
  onTakePhoto,
  onToggleMirror,
  isMirrored,
  canTakePhoto,
  isFull,
}: PhotoControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onTakePhoto}
        disabled={!canTakePhoto || isFull}
        className="min-h-16 rounded-2xl bg-sky-400 px-12 text-base font-black tracking-wider text-zinc-950 uppercase shadow-lg shadow-sky-500/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isFull ? "Completed" : "Take Photo"}
      </button>

      <button
        type="button"
        onClick={onToggleMirror}
        title="กลับด้านซ้าย-ขวา (Mirror)"
        className={`min-h-16 rounded-2xl border px-6 font-mono text-xs font-bold uppercase transition active:scale-95 ${
          isMirrored
            ? "border-sky-400/60 bg-sky-400/10 text-sky-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-400"
        }`}
      >
        Mirror {isMirrored ? "ON" : "OFF"}
      </button>
    </div>
  );
}
