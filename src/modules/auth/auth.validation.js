// src/modules/auth/auth.validation.js
const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string().trim().required().messages({
    'string.empty': 'الاسم الكامل مطلوب',
    'any.required': 'الاسم الكامل مطلوب'
  }),
  email: Joi.string().email().trim().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'string.empty': 'البريد الإلكتروني مطلوب',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'كلمة المرور يجب ألا تقل عن 6 أحرف',
    'string.empty': 'كلمة المرور مطلوبة',
    'any.required': 'كلمة المرور مطلوبة'
  }),
  phone: Joi.string().allow('', null).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'string.empty': 'البريد الإلكتروني مطلوب',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'كلمة المرور مطلوبة',
    'any.required': 'كلمة المرور مطلوبة'
  })
});

const verifyEmailSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'string.empty': 'البريد الإلكتروني مطلوب',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  code: Joi.string().trim().length(6).required().messages({
    'string.length': 'رمز التحقق يجب أن يتكون من 6 أرقام',
    'string.empty': 'رمز التحقق مطلوب',
    'any.required': 'رمز التحقق مطلوب'
  })
});

const resendCodeSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'string.empty': 'البريد الإلكتروني مطلوب',
    'any.required': 'البريد الإلكتروني مطلوب'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'string.empty': 'البريد الإلكتروني مطلوب',
    'any.required': 'البريد الإلكتروني مطلوب'
  })
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().trim().required().messages({
    'string.email': 'البريد الإلكتروني غير صالح',
    'string.empty': 'البريد الإلكتروني مطلوب',
    'any.required': 'البريد الإلكتروني مطلوب'
  }),
  code: Joi.string().trim().length(6).required().messages({
    'string.length': 'رمز التحقق يجب أن يتكون من 6 أرقام',
    'string.empty': 'رمز التحقق مطلوب',
    'any.required': 'رمز التحقق مطلوب'
  }),
  new_password: Joi.string().min(6).required().messages({
    'string.min': 'كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف',
    'string.empty': 'كلمة المرور الجديدة مطلوبة',
    'any.required': 'كلمة المرور الجديدة مطلوبة'
  })
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
