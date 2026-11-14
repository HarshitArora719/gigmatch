import { Router } from 'express';
import multer from 'multer';
import { uploadPortfolio, uploadResume, uploadAvatar, uploadChatMedia, uploadDeliverables, serveDeliverableFile } from '../controllers/upload.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const chatUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const deliverableUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/portfolio', protect, upload.single('image'), uploadPortfolio);
router.post('/resume', protect, upload.single('resume'), uploadResume);
router.post('/chat-media', protect, chatUpload.single('file'), uploadChatMedia);
router.post('/deliverables', protect, deliverableUpload.any(), uploadDeliverables);
router.get('/deliverable-file', serveDeliverableFile);

export default router;