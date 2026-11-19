import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group font-sans"
    position="bottom-right"
    icons={{
      success: <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />,
      info: <Sparkles className="size-4 text-purple shrink-0" />,
      warning: <AlertCircle className="size-4 text-amber-500 shrink-0" />,
      error: <AlertCircle className="size-4 text-coral shrink-0" />,
      loading: <Loader2 className="size-4 animate-spin text-purple shrink-0" />,
    }}
    toastOptions={{
      classNames: {
        toast:
          'group toast flex items-center gap-3 w-full bg-white/95 backdrop-blur-md text-ink border border-border/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-2xl px-4 py-3 text-xs sm:text-sm font-semibold tracking-tight transition-all',
        description: 'text-xs text-ink/60 font-normal',
        actionButton: 'btn-primary !py-1 !px-3 !text-xs font-bold rounded-lg',
        cancelButton: 'btn-secondary !py-1 !px-3 !text-xs font-medium rounded-lg',
        closeButton: 'bg-white border border-border/60 text-ink/60 hover:text-ink rounded-lg',
      },
    }}
    {...props}
  />
);

export { Toaster };
