// src/services/otp.service.js
const crypto = require('crypto');

/**
 * In-memory store for OTPs with TTL
 * key: `verify:${email}` or `reset:${email}`
 * value: { code, expiresAt, data }
 */
const otpStore = new Map();

// Helper to generate secure 6-digit numeric OTP
const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Save OTP for Email Verification during Registration
 * @param {string} email
 * @param {object} registrationData
 * @param {number} ttlMinutes (default 15 mins)
 */
const createVerificationOtp = (email, registrationData, ttlMinutes = 15) => {
  const normalizedEmail = email.trim().toLowerCase();
  const code = generate6DigitCode();
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

  otpStore.set(`verify:${normalizedEmail}`, {
    code,
    expiresAt,
    data: registrationData
  });

  return code;
};

/**
 * Verify Registration OTP
 * @param {string} email
 * @param {string} inputCode
 */
const verifyRegistrationOtp = (email, inputCode) => {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(`verify:${normalizedEmail}`);

  if (!record) {
    return { valid: false, message: 'رمز التحقق غير صالح أو انتهت صلاحيته' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(`verify:${normalizedEmail}`);
    return { valid: false, message: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد' };
  }

  if (record.code !== inputCode.trim()) {
    return { valid: false, message: 'رمز التحقق غير صحيح' };
  }

  // Clear on successful match
  otpStore.delete(`verify:${normalizedEmail}`);
  return { valid: true, data: record.data };
};

/**
 * Save OTP for Password Reset
 * @param {string} email
 * @param {number} ttlMinutes
 */
const createPasswordResetOtp = (email, ttlMinutes = 15) => {
  const normalizedEmail = email.trim().toLowerCase();
  const code = generate6DigitCode();
  const expiresAt = Date.now() + ttlMinutes * 60 * 1000;

  otpStore.set(`reset:${normalizedEmail}`, {
    code,
    expiresAt
  });

  return code;
};

/**
 * Verify Password Reset OTP
 * @param {string} email
 * @param {string} inputCode
 * @param {boolean} keepRecord
 */
const verifyPasswordResetOtp = (email, inputCode, keepRecord = false) => {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(`reset:${normalizedEmail}`);

  if (!record) {
    return { valid: false, message: 'رمز إعادة التعيين غير صالح أو انتهت صلاحيته' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(`reset:${normalizedEmail}`);
    return { valid: false, message: 'انتهت صلاحية الرمز. يرجى طلب رمز جديد' };
  }

  if (record.code !== inputCode.trim()) {
    return { valid: false, message: 'رمز إعادة التعيين غير صحيح' };
  }

  if (!keepRecord) {
    otpStore.delete(`reset:${normalizedEmail}`);
  }

  return { valid: true };
};

module.exports = {
  createVerificationOtp,
  verifyRegistrationOtp,
  createPasswordResetOtp,
  verifyPasswordResetOtp
};
