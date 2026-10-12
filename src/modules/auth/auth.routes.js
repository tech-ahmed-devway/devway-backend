// src/modules/auth/auth.routes.js
const express = require('express');
const authController = require('./auth.controller');
const validate = require('../../middleware/validate');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} = require('./auth.validation');
const { auth } = require('../../middleware/auth');

const router = express.Router();

// Registration flow
router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-code', validate(resendCodeSchema), authController.resendVerificationCode);

// Password Reset flow
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Login endpoint
router.post('/login', validate(loginSchema), authController.login);

// Protected endpoint to fetch current user context
router.get('/me', auth, authController.me);

// Endpoint to refresh token
router.post('/refresh', authController.refresh);

module.exports = router;
