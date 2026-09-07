import { Router } from 'express';
import { createGig, getAllGigs, getGigById, getMyGigs, updateGig, deleteGig } from '../controllers/gig.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, restrictTo('client'), createGig);
router.get('/my-gigs', protect, restrictTo('client'), getMyGigs);
router.get('/', getAllGigs);
router.get('/:id', getGigById);
router.put('/:id', protect, restrictTo('client'), updateGig);
router.delete('/:id', protect, restrictTo('client'), deleteGig);

export default router;