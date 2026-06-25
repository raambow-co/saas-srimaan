import express from 'express';
import { getReportsData } from '../controllers/reportController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, restrictTo('ADMIN'), getReportsData);

export default router;
