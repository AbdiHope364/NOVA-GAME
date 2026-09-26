import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/stats', AdminController.getOverviewStats);
router.get('/users', AdminController.listUsers);

export default router;
