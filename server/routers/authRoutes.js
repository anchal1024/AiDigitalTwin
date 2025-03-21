import express from 'express';
import { googleAuthentication } from '../controllers/authController.js';

const router = express.Router();

router.post("/authenticate", googleAuthentication);

export default router;
