// src/app.js

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");

// Module routers
const authRoutes = require("./modules/auth/auth.routes");
const profilesRoutes = require("./modules/profiles/profiles.routes");
const examsRoutes = require("./modules/exams/exams.routes");
const questionsRoutes = require("./modules/questions/questions.routes");
const attachmentsRoutes = require("./modules/attachments/attachments.routes");
const assignmentsRoutes = require("./modules/assignments/assignments.routes");
const sessionsRoutes = require("./modules/sessions/sessions.routes");

const app = express();

/* =========================================================
   CORS
   ========================================================= */

const allowedOrigins = [
  "https://frontend-gdgoc-mocha.vercel.app",
  "http://localhost:8080",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, server-to-server, health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new AppError("Origin غير مسموح له بالوصول إلى API", 403));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);

/*
 * No need for:
 *
 * app.options('*', cors());
 *
 * The cors middleware above automatically handles
 * preflight OPTIONS requests.
 */

/* =========================================================
   SECURITY
   ========================================================= */

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

/* =========================================================
   COMPRESSION
   ========================================================= */

app.use(compression());

/* =========================================================
   RATE LIMITING
   ========================================================= */

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,

  message: {
    success: false,
    message:
      "لقد تجاوزت الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً بعد دقيقة.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

/* =========================================================
   BODY PARSING
   ========================================================= */

app.use(
  express.json({
    limit: "500mb",
  }),
);

app.use(
  express.urlencoded({
    limit: "500mb",
    extended: true,
  }),
);

/* =========================================================
   API ROUTES
   ========================================================= */

app.use("/api/auth", authRoutes);

app.use("/api/profiles", profilesRoutes);

app.use("/api/exams", examsRoutes);

app.use("/api", questionsRoutes);

app.use("/api/attachments", attachmentsRoutes);

app.use("/api/assignments", assignmentsRoutes);

app.use("/api/sessions", sessionsRoutes);

/* =========================================================
   404 - ROUTE NOT FOUND
   ========================================================= */

app.all(/.*/, (req, res, next) => {
  next(new AppError(`المسار المطلوب غير موجود: ${req.originalUrl}`, 404));
});

/* =========================================================
   GLOBAL ERROR HANDLER
   ========================================================= */

app.use(errorHandler);

module.exports = app;
