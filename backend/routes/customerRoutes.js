import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  uploadCustomerDocuments,
  bulkImportCustomers
} from '../controllers/customerController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', restrictTo('ADMIN'), deleteCustomer);

// Secure file uploads for photo, Aadhaar front, and Aadhaar back
router.post('/:id/upload-docs', upload.fields([
  { name: 'customerPhoto', maxCount: 1 },
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 }
]), uploadCustomerDocuments);

// Bulk Import customer data via CSV file
router.post('/bulk-import', upload.single('file'), bulkImportCustomers);

export default router;
