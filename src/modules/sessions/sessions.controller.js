// src/modules/sessions/sessions.controller.js
const sessionsService = require('./sessions.service');
const AppError = require('../../utils/AppError');

/**
 * Get all sessions + main drive folder info
 */
const getSessions = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const [sessions, mainDriveFolder] = await Promise.all([
      sessionsService.getAllSessions(isAdmin),
      sessionsService.getMainDriveSettings()
    ]);

    return res.status(200).json({
      success: true,
      sessions,
      mainDriveFolder,
      total: sessions.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single session by ID
 */
const getSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';
    const session = await sessionsService.getSessionById(id, isAdmin);

    if (!session) {
      return next(new AppError('السيشن المطلوب غير موجود أو غير متاح', 404));
    }

    return res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new session (Admin only)
 */
const createSession = async (req, res, next) => {
  try {
    const session = await sessionsService.createSession(req.body);

    return res.status(201).json({
      success: true,
      message: 'تم إضافة السيشن بنجاح',
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing session (Admin only)
 */
const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await sessionsService.updateSession(id, req.body);

    if (!session) {
      return next(new AppError('السيشن المطلوب تحديثه غير موجود', 404));
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث بيانات السيشن بنجاح',
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a session (Admin only)
 */
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await sessionsService.deleteSession(id);

    if (!deleted) {
      return next(new AppError('السيشن المطلوب حذفه غير موجود', 404));
    }

    return res.status(200).json({
      success: true,
      message: 'تم حذف السيشن بنجاح'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Main Drive Settings
 */
const getMainDriveSettings = async (req, res, next) => {
  try {
    const mainDriveFolder = await sessionsService.getMainDriveSettings();
    return res.status(200).json({
      success: true,
      mainDriveFolder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Main Drive Settings (Admin only)
 */
const updateMainDriveSettings = async (req, res, next) => {
  try {
    const mainDriveFolder = await sessionsService.updateMainDriveSettings(req.body);
    return res.status(200).json({
      success: true,
      message: 'تم تحديث رابط مجلد Google Drive الرئيسي بنجاح',
      mainDriveFolder
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contents of a Google Drive folder (subfolders and files)
 */
const getDriveFolderContents = async (req, res, next) => {
  try {
    const { folderId, url, refresh } = req.query;
    const forceRefresh = refresh === 'true' || refresh === '1';
    const folderIdentifier = folderId || url;

    const data = await sessionsService.getDriveFolderContents(folderIdentifier, forceRefresh);

    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
  getMainDriveSettings,
  updateMainDriveSettings,
  getDriveFolderContents
};
