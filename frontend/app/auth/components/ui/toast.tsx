'use client'
 
import * as React from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utlis'
 
const ToastProvider = ToastPrimitives.Provider
 
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      'fixed top-4 right-4 z-[100] flex w-full max-w-[420px] flex-col gap-3 p-4',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName
 
const toastVariants = cva(
  'group pointer-events-auto relative grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-lg backdrop-blur transition-all ' +
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0 ' +
    'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-2',
  {
    variants: {
      variant: {
        default:     'border-neutral-200 text-neutral-900',
        success:     'border-neutral-200 text-neutral-900',
        destructive: 'border-red-200 text-neutral-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)
 
const leftBarVariants = cva('absolute left-0 top-0 h-full w-1', {
  variants: {
    variant: {
      default:     'bg-neutral-300',
      success:     'bg-neutral-900',
      destructive: 'bg-red-500',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})
 
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  >
    <span className={cn(leftBarVariants({ variant }))} />
    {props.children}
  </ToastPrimitives.Root>
))
Toast.displayName = ToastPrimitives.Root.displayName
 
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      'rounded-lg p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors',
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName
 
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn('text-sm font-semibold leading-5 text-neutral-900', className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName
 
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn('text-sm text-neutral-500 leading-5', className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName
 
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
type ToastActionElement = React.ReactElement<any>
 
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
}
 