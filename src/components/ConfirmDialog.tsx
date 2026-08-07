interface Props {
  title: string
  message?: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'danger' | 'normal'
  onConfirm: () => void
  onCancel: () => void
}

/** 게임 중 실수로 나가지 않도록 한 번 더 묻는 창. */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = '아니요',
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-8">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
        {message && <p className="mt-3 text-lg text-slate-500">{message}</p>}
        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[68px] flex-1 rounded-2xl bg-slate-100 text-xl font-bold text-slate-700 active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[68px] flex-1 rounded-2xl text-xl font-bold text-white active:scale-95 ${
              tone === 'danger' ? 'bg-red-500' : 'bg-orange-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
