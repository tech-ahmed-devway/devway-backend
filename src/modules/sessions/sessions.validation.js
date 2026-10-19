// src/modules/sessions/sessions.validation.js
const Joi = require('joi');

const sessionSchema = Joi.object({
  session_number: Joi.string().trim().required().messages({
    'string.empty': 'رقم أو اسم السيشن مطلوب',
    'any.required': 'رقم أو اسم السيشن مطلوب'
  }),
  title: Joi.string().trim().required().messages({
    'string.empty': 'عنوان السيشن مطلوب',
    'any.required': 'عنوان السيشن مطلوب'
  }),
  description: Joi.string().allow('', null).optional(),
  video_url: Joi.string().trim().required().messages({
    'string.empty': 'رابط الفيديو أو الفولدر على Google Drive مطلوب',
    'any.required': 'رابط الفيديو أو الفولدر على Google Drive مطلوب'
  }),
  drive_folder_url: Joi.string().allow('', null).optional(),
  duration: Joi.string().allow('', null).optional(),
  order_index: Joi.number().integer().min(0).default(1),
  topics: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  resources: Joi.alternatives().try(
    Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        url: Joi.string().uri().required(),
        type: Joi.string().optional().default('link')
      })
    ),
    Joi.string()
  ).optional(),
  notes: Joi.string().allow('', null).optional(),
  is_published: Joi.boolean().default(true)
}).unknown(true);

const driveSettingsSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.empty': 'رابط مجلد Google Drive مطلوب',
    'string.uri': 'يرجى إدخال رابط صحيح لمجلد Google Drive',
    'any.required': 'رابط مجلد Google Drive مطلوب'
  }),
  title: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional()
});

module.exports = {
  sessionSchema,
  driveSettingsSchema
};
