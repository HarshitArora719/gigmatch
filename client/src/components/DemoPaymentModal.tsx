import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export interface DemoPaymentDetails {
  proposalId?: string;
  orderId?: string;
  milestoneIndex?: number;
  milestoneTitle?: string;
  gigTitle?: string;
  totalAmount: number;
  platformCommission: number;
  freelancerEarnings: number;
}

interface DemoPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: DemoPaymentDetails | null;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export default function DemoPaymentModal({
  open,
  onOpenChange,
  details,
  onConfirm,
  loading,
}: DemoPaymentModalProps) {
  if (!details) return null;

  const isMilestone = details.milestoneIndex !== undefined;

  return (
    <Dialog open={open} onOpenChange={loading ? () => {} : onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-[28px] p-6 sm:p-7 border border-border shadow-2xl">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200/50 shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mb-1">
                Demo Payment Fallback
              </span>
              <DialogTitle className="font-display text-xl font-bold text-ink">
                {isMilestone ? 'Release Milestone Payment' : 'Simulated Escrow Payment'}
              </DialogTitle>
            </div>
          </div>

          <DialogHeader>
            <DialogDescription className="text-xs text-ink/70 leading-relaxed text-left">
              Razorpay credentials (<code className="bg-soft px-1 py-0.5 rounded border border-border text-[11px]">RAZORPAY_KEY_ID</code>) are not configured in your backend <code className="bg-soft px-1 py-0.5 rounded border border-border text-[11px]">.env</code>. This demo payment securely tests the full order lifecycle without charging real money.
            </DialogDescription>
          </DialogHeader>

          {/* Breakdown Card */}
          <div className="bg-soft/70 rounded-2xl p-4 border border-border/50 space-y-2.5 text-xs">
            {details.gigTitle && (
              <div className="pb-2 border-b border-border/40">
                <span className="text-ink/50 text-[11px] block font-medium">Gig</span>
                <span className="font-bold text-ink line-clamp-1">{details.gigTitle}</span>
              </div>
            )}
            {details.milestoneTitle && (
              <div className="pb-2 border-b border-border/40">
                <span className="text-ink/50 text-[11px] block font-medium">Milestone</span>
                <span className="font-bold text-purple line-clamp-1">
                  Milestone {(details.milestoneIndex ?? 0) + 1}: {details.milestoneTitle}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-ink/70">
              <span>{isMilestone ? 'Milestone Amount:' : 'Proposal Total:'}</span>
              <span className="font-bold text-ink text-sm">₹{details.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-ink/60">
              <span>Platform Commission (25%):</span>
              <span className="font-medium text-purple">₹{details.platformCommission.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-ink/60">
              <span>Freelancer Payout (75% net):</span>
              <span className="font-medium text-emerald-600">₹{details.freelancerEarnings.toLocaleString('en-IN')}</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between font-bold text-ink text-sm">
              <span>{isMilestone ? 'Releasing to Freelancer:' : 'Escrow Held Amount:'}</span>
              <span className="text-emerald-700">₹{details.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="btn-secondary !py-2 !px-4 !text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="btn-primary !py-2 !px-5 !text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Processing Demo...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Confirm Demo Payment & Hire</span>
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
