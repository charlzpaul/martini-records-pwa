import { useState, useEffect } from "react"

type ToastVariant = "default" | "destructive"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

const toastQueue: Toast[] = []
let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const processQueue = () => {
      if (toastQueue.length > 0 && toasts.length < 5) {
        const toast = toastQueue.shift()
        if (toast) {
          setToasts((prev) => [...prev, toast])
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== toast.id))
          }, 3000)
        }
      }
    }

    const interval = setInterval(processQueue, 100)
    return () => clearInterval(interval)
  }, [toasts])

  const toast = ({
    title,
    description,
    variant = "default",
  }: {
    title?: string
    description?: string
    variant?: ToastVariant
  }) => {
    const id = `toast-${toastIdCounter++}`
    toastQueue.push({ id, title, description, variant })
  }

  return { toasts, toast }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`min-w-[300px] rounded-lg border bg-background p-4 shadow-lg ${
            toast.variant === "destructive"
              ? "border-destructive text-destructive"
              : "border-border"
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.title && (
              <div className="font-semibold">{toast.title}</div>
            )}
            {toast.description && (
              <div className="text-sm text-muted-foreground">
                {toast.description}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
