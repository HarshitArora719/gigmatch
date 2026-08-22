import { Router } from 'express';
import { createProposal, getProposalsForGig, getMyProposals } from '../controllers/proposal.controller';
import { getProposalsForMyGigs } from '../controllers/proposal.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, restrictTo('freelancer'), createProposal);
router.get('/gig/:gigId', protect, getProposalsForGig);
router.get('/my-proposals', protect, restrictTo('freelancer'), getMyProposals);
router.get('/my-gigs-proposals', protect, restrictTo('client'), getProposalsForMyGigs);

export default router;