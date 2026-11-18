import { Router } from 'express';
import {
  getPaymentConfig,
  createPaymentOrder,
  verifyPaymentSignature,
  processDemoPayment,
  recordPaymentFailure,
  verifyPayment,
  createMilestonePaymentOrder,
  verifyMilestonePaymentSignature,
  processMilestoneDemoPayment,
  approveAndReleaseMilestone,
} from '../controllers/payment.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public client config (only returns public keyId, never secrets)
router.get('/config', protect, getPaymentConfig);

// Proposal Acceptance Payment flows
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-signature', protect, verifyPaymentSignature);
router.post('/demo-payment', protect, processDemoPayment);
router.post('/record-failure', protect, recordPaymentFailure);

// Milestone Payment & Release flows (Option A Escrow + Automated Route / Payouts)
router.post('/milestone/approve-and-release', protect, approveAndReleaseMilestone);
router.post('/milestone/create-order', protect, createMilestonePaymentOrder);
router.post('/milestone/verify-signature', protect, verifyMilestonePaymentSignature);
router.post('/milestone/demo-payment', protect, processMilestoneDemoPayment);

// Milestone verification (legacy / direct milestone approval)
router.post('/verify', protect, verifyPayment);

export default router;
