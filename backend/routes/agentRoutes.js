import express from 'express';
import {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  toggleSuspendAgent,
  resetAgentPassword,
  deleteAgent,
  getAgentPerformance
} from '../controllers/agentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require protection for all agent routes
router.use(protect);

// All agent management routes require ADMIN privileges
router.get('/', restrictTo('ADMIN'), getAgents);
router.post('/', restrictTo('ADMIN'), createAgent);
router.get('/:id', restrictTo('ADMIN'), getAgentById);
router.put('/:id', restrictTo('ADMIN'), updateAgent);
router.delete('/:id', restrictTo('ADMIN'), deleteAgent);
router.put('/:id/suspend', restrictTo('ADMIN'), toggleSuspendAgent);
router.put('/:id/reset-password', restrictTo('ADMIN'), resetAgentPassword);
router.get('/:id/performance', restrictTo('ADMIN'), getAgentPerformance);

export default router;
