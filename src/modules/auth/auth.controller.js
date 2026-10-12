// src/modules/auth/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('./auth.service');
const emailService = require('../../services/email.service');
const otpService = require('../../services/otp.service');
const AppError = require('../../utils/AppError');
const ApiResponse = require('../../utils/ApiResponse');

const JWT_SECRET = process.env.JWT_SECRET || 'devway_access_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'devway_refresh_secret_key_2026';

/*
    Generate Access and Refresh tokens
*/
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      email: user.email, 
      full_name: user.full_name,
      name: user.full_name,
      phone: user.phone 
    },
    JWT_SECRET,
    { expiresIn: '365d' }
  );
  return { accessToken, refreshToken: accessToken };
};

/*
    Handle user registration - Step 1: Send OTP verification code
*/
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, phone } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already registered
    const existingUser = await authService.findUserByEmail(normalizedEmail);
    if (existingUser) {
      return next(new AppError('البريد الإلكتروني مسجل بالفعل', 400));
    }

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit OTP code and store registration payload temporarily
    const otpCode = otpService.createVerificationOtp(normalizedEmail, {
      full_name,
      email: normalizedEmail,
      passwordHash,
      phone: phone || null
    });

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return next(new AppError('لم يتم ضبط إعدادات خادم البريد (SMTP) على السيرفر (Render Environment).', 500));
    }

    // Dispatch verification email in background to eliminate UI wait time
    emailService.sendVerificationEmail({
      email: normalizedEmail,
      name: full_name,
      code: otpCode
    }).catch((err) => {
      console.error('[Verification Email Send Error]:', err);
    });

    return new ApiResponse(200, {
      pendingVerification: true,
      email: normalizedEmail
    }, 'تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني بنجاح').send(res);
  } catch (error) {
    next(error);
  }
};

/*
    Handle user registration - Step 2: Verify OTP and create active profile
*/
const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const verificationResult = otpService.verifyRegistrationOtp(normalizedEmail, code);
    if (!verificationResult.valid) {
      return next(new AppError(verificationResult.message || 'رمز التحقق غير صالح', 400));
    }

    const { full_name, passwordHash, phone } = verificationResult.data;

    // Check again to avoid race conditions
    const existingUser = await authService.findUserByEmail(normalizedEmail);
    if (existingUser) {
      return next(new AppError('البريد الإلكتروني مسجل بالفعل', 400));
    }

    // Create verified profile
    const user = await authService.createUser(full_name, normalizedEmail, passwordHash, phone);

    // Generate tokens
    const tokens = generateTokens(user);

    const responseData = {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        name: user.full_name,
        role: user.role,
        phone: user.phone
      }
    };

    return new ApiResponse(201, responseData, 'تم التحقق من بريدك الإلكتروني وتفعيل الحساب بنجاح').send(res);
  } catch (error) {
    next(error);
  }
};

/*
    Resend verification code
*/
const resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await authService.findUserByEmail(normalizedEmail);
    if (existingUser) {
      return next(new AppError('هذا الحساب مفعل ومسجل بالفعل، يرجى تسجيل الدخول', 400));
    }

    // Generate new OTP
    const otpCode = otpService.createVerificationOtp(normalizedEmail, {
      email: normalizedEmail
    });

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return next(new AppError('لم يتم ضبط إعدادات خادم البريد (SMTP) على السيرفر.', 500));
    }

    // Dispatch in background for instant response
    emailService.sendVerificationEmail({
      email: normalizedEmail,
      name: 'المطور',
      code: otpCode
    }).catch((err) => {
      console.error('[Resend OTP Error]:', err);
    });

    return new ApiResponse(200, {
      email: normalizedEmail
    }, 'تمت إعادة إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح').send(res);
  } catch (error) {
    next(error);
  }
};

/*
    Handle Forgot Password - Step 1: Send Reset OTP Code
*/
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await authService.findUserByEmail(normalizedEmail);
    if (!user) {
      return next(new AppError('البريد الإلكتروني غير مسجل في المنصة', 404));
    }

    const resetCode = otpService.createPasswordResetOtp(normalizedEmail);

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return next(new AppError('لم يتم ضبط إعدادات خادم البريد (SMTP) على السيرفر.', 500));
    }

    // Dispatch reset email in background for instant response
    emailService.sendPasswordResetEmail({
      email: normalizedEmail,
      name: user.full_name,
      code: resetCode
    }).catch((err) => {
      console.error('[Forgot Password Email Error]:', err);
    });

    return new ApiResponse(200, {
      email: normalizedEmail
    }, 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني').send(res);
  } catch (error) {
    next(error);
  }
};

/*
    Handle Reset Password - Step 2: Verify OTP and save new password
*/
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, new_password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const verification = otpService.verifyPasswordResetOtp(normalizedEmail, code);
    if (!verification.valid) {
      return next(new AppError(verification.message || 'رمز إعادة التعيين غير صالح', 400));
    }

    const user = await authService.findUserByEmail(normalizedEmail);
    if (!user) {
      return next(new AppError('المستخدم غير موجود', 404));
    }

    // Hash the new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

    await authService.updateUserPassword(normalizedEmail, newPasswordHash);

    return new ApiResponse(200, null, 'تمت إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول').send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle user login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Retrieve user by email
    const user = await authService.findUserByEmail(normalizedEmail);
    if (!user) {
      return next(new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401));
    }

    // Verify hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return next(new AppError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401));
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Response includes the session tokens
    const responseData = {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        name: user.full_name, // Mapping for name compatibility
        role: user.role,
        phone: user.phone
      }
    };

    return new ApiResponse(200, responseData, 'تم تسجيل الدخول بنجاح').send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user details
 */
const me = async (req, res, next) => {
  try {
    const user = req.user; // Attached by auth middleware

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.name,
        name: user.full_name || user.name,
        role: user.role,
        phone: user.phone
      }
    };

    return new ApiResponse(200, responseData, 'تم استرجاع بيانات المستخدم بنجاح').send(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh expired access token
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('رمز التحديث مطلوب', 400));
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      
      const user = await authService.findUserById(decoded.id);
      if (!user) {
        return next(new AppError('المستخدم غير موجود', 401));
      }

      const tokens = generateTokens(user);

      return new ApiResponse(200, {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }, 'تم تجديد الجلسة بنجاح').send(res);
    } catch (err) {
      return next(new AppError('رمز التحديث غير صالح أو منتهي الصلاحية', 401));
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  login,
  me,
  refresh
};
