import { useState } from 'react';
import api from '../lib/axios';
import { Button } from './ui/button';
import { IndianRupee, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

interface PaymentButtonProps {
  orderId: string;
  milestoneIndex: number;
  amount: number;
  milestoneTitle: string;
  onSuccess?: () => void;
}

export default function PaymentButton({
  orderId,
  milestoneIndex,
  amount,
  onSuccess,
}: PaymentButtonProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  if (user?.role !== 'client') {
    return <span className="text-xs text-[var(--text-muted)]">Awaiting payment</span>;
  }

  const handleProcessPayment = async () => {
    setLoading(true);
    try {
      await api.post('/api/payments/verify', { orderId, milestoneIndex });
      setPaid(true);
      toast.success(`Payment of ₹${amount.toLocaleString('en-IN')} successful!`);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <Button disabled size="sm" className="bg-[rgba(0,220,160,0.15)] text-[var(--accent-teal)]">
        <CheckCircle size={14} /> Paid
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleProcessPayment} disabled={loading}>
      <IndianRupee size={14} />
      {loading ? 'Processing...' : `Pay ₹${amount.toLocaleString('en-IN')}`}
    </Button>
  );
}
