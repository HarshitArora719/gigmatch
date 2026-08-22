import { useState } from 'react';
import api from '../lib/axios';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewFormProps {
  orderId: string;
  toUserId: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ orderId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/reviews', { orderId, rating, comment });
      toast.success('Thank you for your review!');
      onReviewSubmitted?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-5">
      <h3 className="font-display mb-4 font-semibold">Rate this Order</h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="gm-label">Rating</label>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="rounded-lg p-1 transition-transform hover:scale-110"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  size={28}
                  className={
                    star <= rating
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-muted-foreground opacity-30'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="gm-label">Review Comment</label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={4}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </div>
  );
}
