// src/config/env.js
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Joi = require('joi');

const envVarsSchema = Joi.object({
  PORT: Joi.number().default(5000),
  SUPABASE_URL: Joi.string().uri().required().description('Supabase Project URL'),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional().description('Supabase Service Role Key'),
  SUPABASE_SECRET_KEY: Joi.string().optional().description('Supabase Secret Key'),
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(465),
  SMTP_USER: Joi.string().allow('').default(''),
  SMTP_PASS: Joi.string().allow('').default(''),
  SMTP_FROM: Joi.string().allow('').default('DevWay Platform <no-reply@devway.com>')
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const secretKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SECRET_KEY;
if (!secretKey) {
  throw new Error('Config validation error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required');
}

module.exports = {
  port: envVars.PORT,
  supabaseUrl: envVars.SUPABASE_URL,
  supabaseServiceRoleKey: secretKey,
  smtp: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
    from: envVars.SMTP_FROM || 'DevWay Platform <no-reply@devway.com>'
  }
};
