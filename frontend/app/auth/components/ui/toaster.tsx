'use client'
 
import { useToast } from '@/hooks/use-toast'
import {
  Toast, ToastClose, ToastDescription,
  ToastProvider, ToastTitle, ToastViewport,
} from '@/app/auth/components/ui/toast'
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react'
 
function ToastIcon({ variant }: { variant?: string }) {
  if (variant === 'success')
    return <CheckCircle2 className="mt-0.5 h-5 w-5 text-neutral-900" strokeWidth={1.8} />
  if (variant === 'destructive')
    return <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" strokeWidth={1.8} />
  return <Info className="mt-0.5 h-5 w-5 text-neutral-400" strokeWidth={1.8} />
}
 
export function Toaster() {
  const { toasts } = useToast()
 
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <ToastIcon variant={(props as any)?.variant} />
 
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
 
          <div className="flex items-center gap-2">
            {action}
            <ToastClose />
          </div>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}