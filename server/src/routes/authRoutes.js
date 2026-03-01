import { Router } from 'express';
import {
  forgotPassword,
  login,
  register,
  resetPassword,
} from '../modules/auth/authController.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);

export default authRouter;
