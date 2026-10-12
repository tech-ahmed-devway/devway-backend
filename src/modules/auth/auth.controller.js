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
    Handle user registration - Direct account creation without OTP
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

    // Create user profile directly in the database
    const user = await authService.createUser(full_name, normalizedEmail, passwordHash, phone || null);

    // Generate session tokens
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

    return new ApiResponse(201, responseData, 'تم إنشاء الحساب بنجاح').send(res);
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

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      return next(new AppError('لم يتم ضبط إعدادات خادم البريد (SMTP) على السيرفر.', 500));
    }

    // Retrieve previous pending registration data to preserve password & profile info
    const pendingData = otpService.getPendingRegistration(normalizedEmail);
    const registrationPayload = pendingData || { email: normalizedEmail };

    // Generate new OTP with preserved payload
    const otpCode = otpService.createVerificationOtp(normalizedEmail, registrationPayload);

    // Dispatch in background for instant response
    emailService.sendVerificationEmail({
      email: normalizedEmail,
      name: registrationPayload.full_name || 'المطور',
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
  login,
  me,
  refresh
};
