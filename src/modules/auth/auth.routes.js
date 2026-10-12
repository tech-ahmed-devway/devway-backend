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

// Diagnostic SMTP endpoint
router.get('/test-smtp', async (req, res) => {
  const emailService = require('../../services/email.service');
  const env = require('../../config/env');
  try {
    const isConfig = emailService.isConfigured();
    const targetEmail = req.query.email || 'contact.ahmedmagdy@gmail.com';
    const result = await emailService.sendVerificationEmail({
      email: targetEmail,
      name: 'Diagnostic Test',
      code: '777888'
    });
    return res.json({
      status: 'diagnostic',
      isConfigured: isConfig,
      smtpUser: env.smtp.user ? env.smtp.user.replace(/(?<=.{3}).(?=.*@)/g, '*') : 'NOT_SET',
      smtpHost: env.smtp.host,
      smtpPort: env.smtp.port,
      result
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      code: err.code
    });
  }
});

module.exports = router;
