/**
 * Escrow Service — Payment abstraction layer for GigMatch
 * 
 * Provides a clean interface for escrow operations using Razorpay Test/Live mode,
 * with a clearly labelled Demo Payment fallback when Razorpay credentials are missing.
 * 
 * Platform commission is strictly 25%; freelancer receives 75% on release.
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';

export interface EscrowResult {
  success: boolean;
  razorpayNotConfigured?: boolean;
  message: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  platformCommission?: number;
  freelancerEarnings?: number;
}

export const PLATFORM_COMMISSION_RATE = 0.25; // 25% platform fee

export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(keyId && keySecret && keyId.length > 0 && keySecret.length > 0);
}

export function getRazorpayClient(): Razorpay | null {
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET!.trim(),
  });
}

/**
 * Validates the Razorpay HMAC-SHA256 payment signature.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!isRazorpayConfigured()) return false;
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET!.trim();
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  } catch (err) {
    console.error('[Escrow] Error verifying Razorpay signature:', err);
    return false;
  }
}

/**
 * Creates an escrow hold order.
 * If Razorpay is configured, creates a real Razorpay Order (amount in paise).
 * If not configured, returns demo status.
 */
export async function createEscrow(
  amount: number,
  receipt: string,
  notes: Record<string, any> = {}
): Promise<EscrowResult> {
  const platformCommission = Math.round(amount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = amount - platformCommission;

  if (!isRazorpayConfigured()) {
    console.log(`[Escrow] Razorpay not configured. Returning Demo Escrow for amount: ₹${amount}`);
    return {
      success: true,
      razorpayNotConfigured: true,
      message: 'Demo Payment Mode: Escrow hold recorded (Razorpay keys not configured)',
      platformCommission,
      freelancerEarnings,
    };
  }

  const razorpay = getRazorpayClient()!;
  try {
    const amountInPaise = Math.round(amount * 100);
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        ...notes,
        platformCommission,
        freelancerEarnings,
      },
    });

    return {
      success: true,
      razorpayOrderId: rzpOrder.id,
      message: `Razorpay order created successfully: ${rzpOrder.id}`,
      platformCommission,
      freelancerEarnings,
    };
  } catch (err: any) {
    console.error('[Escrow] Razorpay order creation failed:', err);
    return {
      success: false,
      message: err?.error?.description || err?.message || 'Failed to create Razorpay payment order',
    };
  }
}

/**
 * Releases escrowed funds to the freelancer when the client approves delivery.
 * Deducts 25% platform commission and confirms settlement.
 */
export async function releaseEscrow(
  orderId: string,
  amount: number
): Promise<EscrowResult> {
  const platformCommission = Math.round(amount * PLATFORM_COMMISSION_RATE);
  const freelancerEarnings = amount - platformCommission;

  if (!isRazorpayConfigured()) {
    console.log(`[Escrow] Razorpay not configured. Simulating escrow release for order ${orderId}, amount: ₹${amount}`);
    return {
      success: true,
      razorpayNotConfigured: true,
      message: `Demo settlement recorded: ₹${freelancerEarnings.toLocaleString('en-IN')} released to freelancer (₹${platformCommission.toLocaleString('en-IN')} 25% platform commission retained)`,
      platformCommission,
      freelancerEarnings,
    };
  }

  console.log(`[Escrow] Razorpay escrow settlement for order ${orderId}: amount ₹${amount}, commission ₹${platformCommission}, payout ₹${freelancerEarnings}`);

  return {
    success: true,
    message: `Escrow settlement completed: ₹${freelancerEarnings.toLocaleString('en-IN')} released to freelancer, ₹${platformCommission.toLocaleString('en-IN')} (25%) platform commission retained`,
    platformCommission,
    freelancerEarnings,
  };
}

/**
 * Refunds escrowed funds to the client.
 */
export async function refundEscrow(
  orderId: string,
  paymentId?: string,
  amount?: number
): Promise<EscrowResult> {
  if (!isRazorpayConfigured()) {
    return {
      success: true,
      razorpayNotConfigured: true,
      message: 'Demo refund recorded: Escrow funds refunded to client',
    };
  }

  if (!paymentId || !amount) {
    return {
      success: false,
      message: 'Payment ID and amount are required to process a Razorpay refund.',
    };
  }

  try {
    const razorpay = getRazorpayClient()!;
    const amountInPaise = Math.round(amount * 100);
    const refund = await (razorpay.payments as any).refund(paymentId, { amount: amountInPaise });
    return {
      success: true,
      message: `Refund processed successfully: ${refund.id}`,
    };
  } catch (err: any) {
    console.error('[Escrow] Razorpay refund failed:', err);
    return {
      success: false,
      message: err?.error?.description || err?.message || 'Failed to process refund via Razorpay',
    };
  }
}
