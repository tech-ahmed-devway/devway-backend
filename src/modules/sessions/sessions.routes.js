// src/modules/sessions/sessions.routes.js
const express = require('express');
const sessionsController = require('./sessions.controller');
const { auth, authorize } = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const { sessionSchema, driveSettingsSchema } = require('./sessions.validation');

const router = express.Router();

// Retrieve all sessions and main Google Drive settings (Authenticated users & admins)
router.get('/', auth, sessionsController.getSessions);

// Get main drive folder settings
router.get('/settings/drive', auth, sessionsController.getMainDriveSettings);

// Update main drive folder settings (Admin only)
router.put('/settings/drive', auth, authorize('admin'), validate(driveSettingsSchema), sessionsController.updateMainDriveSettings);

// Get live contents of Google Drive folder (subfolders, videos, files)
router.get('/drive/contents', auth, sessionsController.getDriveFolderContents);

// Retrieve a specific session
router.get('/:id', auth, sessionsController.getSession);

// Create new session (Admin only)
router.post('/', auth, authorize('admin'), validate(sessionSchema), sessionsController.createSession);

// Update session (Admin only)
router.put('/:id', auth, authorize('admin'), validate(sessionSchema), sessionsController.updateSession);

// Delete session (Admin only)
router.delete('/:id', auth, authorize('admin'), sessionsController.deleteSession);

module.exports = router;
