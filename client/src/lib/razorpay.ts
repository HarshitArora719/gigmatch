/**
 * Razorpay Checkout SDK Loader & Helper
 * Dynamically loads the official Razorpay Checkout script and launches the payment modal.
 */

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
  onFailed?: (error: any) => void;
}

export async function openRazorpayModal(options: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Could not load Razorpay payment gateway. Please check your internet connection.');
  }

  const rzpOptions: any = {
    key: options.key,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: options.name || 'GigMatch',
    description: options.description,
    order_id: options.order_id,
    prefill: options.prefill,
    theme: options.theme || { color: '#7C3AED' }, // GigMatch purple
    handler: options.handler,
    modal: {
      ondismiss: () => {
        options.onDismiss?.();
      },
      backdropclose: false,
    },
  };

  const rzp = new (window as any).Razorpay(rzpOptions);

  if (options.onFailed) {
    rzp.on('payment.failed', (response: any) => {
      options.onFailed?.(response?.error);
    });
  }

  rzp.open();
}
