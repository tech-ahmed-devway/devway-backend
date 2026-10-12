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

// Clean Auth Endpoints
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', auth, authController.me);
router.post('/refresh', authController.refresh);

module.exports = router;
