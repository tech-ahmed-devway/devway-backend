// src/modules/sessions/sessions.service.js
const fs = require("fs");
const path = require("path");
const supabase = require("../../config/supabase");

const DATA_FILE = path.resolve(
  __dirname,
  "../../../database/sessions_data.json",
);

/**
 * Extract Google Drive Folder ID from a URL
 */
const extractDriveFolderId = (url) => {
  if (!url || typeof url !== "string") return null;
  const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return null;
};

/**
 * Extract Google Drive File ID from a URL
 */
const extractDriveFileId = (url) => {
  if (!url || typeof url !== "string") return null;
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return null;
};

/**
 * Convert any Google Drive or YouTube URL to an embed-friendly URL
 */
const getEmbedUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const url = rawUrl.trim();

  // 1. Google Drive Folder
  if (url.includes("drive.google.com") && url.includes("/folders/")) {
    const folderId = extractDriveFolderId(url);
    if (folderId) {
      return `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
    }
  }

  // 2. Google Drive File
  if (
    url.includes("drive.google.com") &&
    (url.includes("/file/d/") || url.includes("id="))
  ) {
    const fileId = extractDriveFileId(url);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  // 3. YouTube
  const ytMatch = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  return url;
};

// Fallback JSON File Helpers
const readLocalData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(
      "[Sessions Service] Error reading local sessions_data.json:",
      err.message,
    );
  }
  return {
    settings: {
      mainDriveFolder: {
        url: "https://drive.google.com/drive/folders/1onqpotGJh5VmOEf708S3e2btli6rCI1H?usp=sharing",
        folderId: "1onqpotGJh5VmOEf708S3e2btli6rCI1H",
        title: "مجلد السيشنات الرئيسي على Google Drive",
        description:
          "المجلد المباشر لجميع المحاضرات والسيشنات المسجلة لمسار Frontend",
      },
    },
    sessions: [],
  };
};

const writeLocalData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(
      "[Sessions Service] Error writing local sessions_data.json:",
      err.message,
    );
  }
};

/**
 * Format a session record with calculated fields (embedUrl, folderId, etc.)
 */
const formatSession = (session) => {
  if (!session) return null;
  const rawVideoUrl = session.video_url || session.videoUrl || "";
  const rawFolderUrl = session.drive_folder_url || session.driveFolderUrl || "";
  const embedUrl = getEmbedUrl(rawVideoUrl);
  const isDriveFolder =
    rawVideoUrl.includes("drive.google.com") &&
    rawVideoUrl.includes("/folders/");
  const isDriveFile =
    rawVideoUrl.includes("drive.google.com") && !isDriveFolder;

  let topics = session.topics || [];
  if (typeof topics === "string") {
    try {
      topics = JSON.parse(topics);
    } catch {
      topics = topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }

  let resources = session.resources || [];
  if (typeof resources === "string") {
    try {
      resources = JSON.parse(resources);
    } catch {
      resources = [];
    }
  }

  return {
    id: session.id,
    session_number: session.session_number || session.sessionNumber || "1",
    title: session.title || "",
    description: session.description || "",
    video_url: rawVideoUrl,
    embed_url: embedUrl,
    drive_folder_url: rawFolderUrl || (isDriveFolder ? rawVideoUrl : null),
    drive_folder_id: extractDriveFolderId(rawFolderUrl || rawVideoUrl),
    drive_file_id: extractDriveFileId(rawVideoUrl),
    is_drive_folder: isDriveFolder,
    is_drive_file: isDriveFile,
    duration: session.duration || "",
    order_index: Number(session.order_index ?? session.orderIndex ?? 1),
    topics: Array.isArray(topics) ? topics : [],
    resources: Array.isArray(resources) ? resources : [],
    notes: session.notes || "",
    is_published: session.is_published ?? session.isPublished ?? true,
    created_at: session.created_at || new Date().toISOString(),
    updated_at: session.updated_at || new Date().toISOString(),
  };
};

/**
 * Get Main Drive Settings
 */
const getMainDriveSettings = async () => {
  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from("session_settings")
      .select("value")
      .eq("key", "main_drive_folder")
      .maybeSingle();

    if (!error && data?.value) {
      const val = data.value;
      return {
        url: val.url,
        folderId: extractDriveFolderId(val.url) || val.folderId,
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${extractDriveFolderId(val.url) || val.folderId}#grid`,
        title: val.title || "مجلد السيشنات الرئيسي على Google Drive",
        description: val.description || "",
        updatedAt: val.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    // Ignore and fallback
  }

  // Fallback to local data
  const local = readLocalData();
  const folder = local.settings?.mainDriveFolder || {
    url: "https://drive.google.com/drive/folders/1onqpotGJh5VmOEf708S3e2btli6rCI1H?usp=sharing",
    folderId: "1onqpotGJh5VmOEf708S3e2btli6rCI1H",
    title: "مجلد السيشنات الرئيسي على Google Drive",
    description:
      "المجلد المباشر لجميع المحاضرات والسيشنات المسجلة لمسار Frontend",
  };

  const folderId =
    extractDriveFolderId(folder.url) ||
    folder.folderId ||
    "1onqpotGJh5VmOEf708S3e2btli6rCI1H";
  return {
    ...folder,
    folderId,
    embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
  };
};

/**
 * Update Main Drive Settings (Admin only)
 */
const updateMainDriveSettings = async ({ url, title, description }) => {
  const folderId = extractDriveFolderId(url);
  const payload = {
    url,
    folderId,
    title: title || "مجلد السيشنات الرئيسي على Google Drive",
    description: description || "",
    updatedAt: new Date().toISOString(),
  };

  // Try Supabase
  let savedToSupabase = false;
  try {
    const { error } = await supabase.from("session_settings").upsert({
      key: "main_drive_folder",
      value: payload,
      updated_at: new Date().toISOString(),
    });
    if (!error) savedToSupabase = true;
  } catch (err) {
    // Supabase table might not exist yet
  }

  // Update local file
  const local = readLocalData();
  local.settings = local.settings || {};
  local.settings.mainDriveFolder = payload;
  writeLocalData(local);

  return {
    ...payload,
    embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
    savedToSupabase,
  };
};

/**
 * Get All Sessions
 * @param {boolean} isAdmin - If true, returns all sessions including unpublished
 */
const getAllSessions = async (isAdmin = false) => {
  // Try Supabase
  try {
    let query = supabase
      .from("sessions")
      .select("*")
      .order("order_index", { ascending: true });
    if (!isAdmin) {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return data.map(formatSession);
    }
  } catch (err) {
    // Fallback to local data
  }

  // Fallback to local data
  const local = readLocalData();
  let sessions = local.sessions || [];
  if (!isAdmin) {
    sessions = sessions.filter((s) => s.is_published !== false);
  }
  sessions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  return sessions.map(formatSession);
};

/**
 * Get Session by ID
 */
const getSessionById = async (id, isAdmin = false) => {
  // Try Supabase
  try {
    let query = supabase.from("sessions").select("*").eq("id", id);
    if (!isAdmin) {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return formatSession(data);
    }
  } catch (err) {
    // Fallback
  }

  // Local data fallback
  const local = readLocalData();
  const session = (local.sessions || []).find(
    (s) => String(s.id) === String(id),
  );
  if (!session) return null;
  if (!isAdmin && session.is_published === false) return null;
  return formatSession(session);
};

/**
 * Create a new session
 */
const createSession = async (sessionData) => {
  const normalizedData = {
    session_number: sessionData.session_number,
    title: sessionData.title,
    description: sessionData.description || "",
    video_url: sessionData.video_url,
    drive_folder_url: sessionData.drive_folder_url || "",
    duration: sessionData.duration || "",
    order_index: Number(sessionData.order_index || 1),
    topics:
      typeof sessionData.topics === "string"
        ? JSON.parse(sessionData.topics || "[]")
        : sessionData.topics || [],
    resources:
      typeof sessionData.resources === "string"
        ? JSON.parse(sessionData.resources || "[]")
        : sessionData.resources || [],
    notes: sessionData.notes || "",
    is_published: sessionData.is_published ?? true,
  };

  // Try Supabase
  try {
    const { data, error } = await supabase
      .from("sessions")
      .insert(normalizedData)
      .select("*")
      .single();

    if (!error && data) {
      // Also update local file in background for sync
      const local = readLocalData();
      local.sessions = local.sessions || [];
      local.sessions.push(data);
      writeLocalData(local);
      return formatSession(data);
    }
  } catch (err) {
    // Supabase fallback
  }

  // Local fallback
  const local = readLocalData();
  local.sessions = local.sessions || [];
  const nextId =
    local.sessions.length > 0
      ? Math.max(...local.sessions.map((s) => Number(s.id) || 0)) + 1
      : 1;
  const newSession = {
    id: nextId,
    ...normalizedData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  local.sessions.push(newSession);
  writeLocalData(local);

  return formatSession(newSession);
};

/**
 * Update a session
 */
const updateSession = async (id, updateData) => {
  const fields = {};
  if (updateData.session_number !== undefined)
    fields.session_number = updateData.session_number;
  if (updateData.title !== undefined) fields.title = updateData.title;
  if (updateData.description !== undefined)
    fields.description = updateData.description;
  if (updateData.video_url !== undefined)
    fields.video_url = updateData.video_url;
  if (updateData.drive_folder_url !== undefined)
    fields.drive_folder_url = updateData.drive_folder_url;
  if (updateData.duration !== undefined) fields.duration = updateData.duration;
  if (updateData.order_index !== undefined)
    fields.order_index = Number(updateData.order_index);
  if (updateData.topics !== undefined) {
    fields.topics =
      typeof updateData.topics === "string"
        ? JSON.parse(updateData.topics || "[]")
        : updateData.topics;
  }
  if (updateData.resources !== undefined) {
    fields.resources =
      typeof updateData.resources === "string"
        ? JSON.parse(updateData.resources || "[]")
        : updateData.resources;
  }
  if (updateData.notes !== undefined) fields.notes = updateData.notes;
  if (updateData.is_published !== undefined)
    fields.is_published = updateData.is_published;
  fields.updated_at = new Date().toISOString();

  // Try Supabase
  try {
    const { data, error } = await supabase
      .from("sessions")
      .update(fields)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (!error && data) {
      // Sync local file
      const local = readLocalData();
      const idx = (local.sessions || []).findIndex(
        (s) => String(s.id) === String(id),
      );
      if (idx !== -1) {
        local.sessions[idx] = data;
        writeLocalData(local);
      }
      return formatSession(data);
    }
  } catch (err) {
    // Supabase fallback
  }

  // Local fallback
  const local = readLocalData();
  const idx = (local.sessions || []).findIndex(
    (s) => String(s.id) === String(id),
  );
  if (idx === -1) return null;

  local.sessions[idx] = {
    ...local.sessions[idx],
    ...fields,
  };
  writeLocalData(local);

  return formatSession(local.sessions[idx]);
};

/**
 * Delete a session
 */
const deleteSession = async (id) => {
  // Try Supabase
  try {
    const { data, error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id)
      .select("id, title")
      .maybeSingle();

    if (!error && data) {
      // Sync local file
      const local = readLocalData();
      local.sessions = (local.sessions || []).filter(
        (s) => String(s.id) !== String(id),
      );
      writeLocalData(local);
      return data;
    }
  } catch (err) {
    // Supabase fallback
  }

  // Local fallback
  const local = readLocalData();
  const session = (local.sessions || []).find(
    (s) => String(s.id) === String(id),
  );
  if (!session) return null;

  local.sessions = (local.sessions || []).filter(
    (s) => String(s.id) !== String(id),
  );
  writeLocalData(local);

  return { id: session.id, title: session.title };
};

// In-memory cache for drive folder contents (TTL: 2 minutes)
const driveCache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Fetch and parse Google Drive folder contents (subfolders and files)
 */
const getDriveFolderContents = async (
  rawFolderIdOrUrl,
  forceRefresh = false,
) => {
  let folderId = extractDriveFolderId(rawFolderIdOrUrl) || rawFolderIdOrUrl;
  if (!folderId || folderId === "root" || folderId === "main") {
    const mainSettings = await getMainDriveSettings();
    folderId = mainSettings.folderId || "1onqpotGJh5VmOEf708S3e2btli6rCI1H";
  }

  // Check cache
  if (!forceRefresh) {
    const cached = driveCache.get(folderId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const response = await fetch(
      `https://drive.google.com/embeddedfolderview?id=${folderId}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "ar,en-US,en;q=0.9",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Google Drive returned status ${response.status}`);
    }

    const html = await response.text();

    // Parse Title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const folderTitle = titleMatch
      ? titleMatch[1].trim()
      : "Google Drive Folder";

    // Parse Items
    const items = [];
    const parts = html.split('<div class="flip-entry" id="entry-');
    for (let i = 1; i < parts.length; i++) {
      const chunk = parts[i];
      const id = chunk.substring(0, chunk.indexOf('"'));
      if (!id) continue;

      const isFolder =
        chunk.includes("drive-sprite-folder") || chunk.includes("/folders/");

      // Title
      const titleM = chunk.match(
        /<div class="flip-entry-title">([^<]+)<\/div>/,
      );
      const name = titleM ? titleM[1].trim() : "عنصر بدون عنوان";

      // Thumbnail
      const thumbM = chunk.match(
        /<div class="flip-entry-thumb"><img src="([^"]+)"/,
      );
      const thumbnail = thumbM ? thumbM[1].replace(/&amp;/g, "&") : null;

      // Icon / mime type
      const iconM = chunk.match(
        /<div class="flip-entry-list-icon"><img src="([^"]+)"/,
      );
      const iconUrl = iconM ? iconM[1] : null;

      // Determine item type
      let type = "file";
      if (isFolder) {
        type = "folder";
      } else if (
        (iconUrl &&
          (iconUrl.includes("video") ||
            iconUrl.includes("matroska") ||
            iconUrl.includes("mp4"))) ||
        name.match(/\.(mp4|mkv|mov|avi|webm)$/i) ||
        name.toLowerCase().includes("session") ||
        name.toLowerCase().includes("lecture") ||
        name.toLowerCase().includes("lifecycle") ||
        name.toLowerCase().includes("فيديو") ||
        name.toLowerCase().includes("محاضرة")
      ) {
        type = "video";
      } else if (
        (iconUrl && iconUrl.includes("pdf")) ||
        name.match(/\.pdf$/i)
      ) {
        type = "pdf";
      } else if (
        (iconUrl &&
          (iconUrl.includes("document") || iconUrl.includes("word"))) ||
        name.match(/\.(doc|docx|odt|rtf|txt)$/i)
      ) {
        type = "document";
      } else if (
        (iconUrl && iconUrl.includes("archive")) ||
        name.match(/\.(zip|rar|7z|tar|gz)$/i)
      ) {
        type = "archive";
      }

      items.push({
        id,
        name,
        isFolder,
        type,
        thumbnail,
        iconUrl,
        driveUrl: isFolder
          ? `https://drive.google.com/drive/folders/${id}`
          : `https://drive.google.com/file/d/${id}/view?usp=sharing`,
        embedUrl: isFolder
          ? `https://drive.google.com/embeddedfolderview?id=${id}#grid`
          : `https://drive.google.com/file/d/${id}/preview`,
        downloadUrl: !isFolder
          ? `https://drive.google.com/u/0/uc?id=${id}&export=download`
          : null,
      });
    }

    // Sort items: folders first (natural sort), then files
    items.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const result = {
      folderId,
      folderTitle,
      folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
      embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
      items,
      count: items.length,
    };

    driveCache.set(folderId, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error(
      `[Sessions Service] Failed to fetch drive contents for ${folderId}:`,
      error.message,
    );

    // Fallback for default known folders if Google blocks or network fails
    if (folderId === "1onqpotGJh5VmOEf708S3e2btli6rCI1H") {
      return {
        folderId,
        folderTitle: "GDGoC Frontend",
        folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
        items: [
          {
            id: "1-rOHwOK8Yx4-S5rf-Aio0FI2LRVBi5OS",
            name: "Session 1",
            isFolder: true,
            type: "folder",
            thumbnail: null,
            iconUrl: null,

            driveUrl:
              "https://drive.google.com/drive/folders/1-rOHwOK8Yx4-S5rf-Aio0FI2LRVBi5OS",
            embedUrl:
              "https://drive.google.com/embeddedfolderview?id=1-rOHwOK8Yx4-S5rf-Aio0FI2LRVBi5OS#grid",
          },
        ],
        count: 1,
      };
    } else if (folderId === "1-rOHwOK8Yx4-S5rf-Aio0FI2LRVBi5OS") {
      return {
        folderId,
        folderTitle: "Session 1",
        folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
        embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`,
        items: [
          {
            id: "1WeZ0uhDnrQA-LFHsiGhYEUQ-iZc4P3bH",
            name: "internet_lifecycle",
            isFolder: false,
            type: "video",
            thumbnail:
              "https://lh3.googleusercontent.com/drive-storage/AJQWtBNq-HQ0eySkuWZvdhfdqDKCqbu2nBY737wPf2G5exX2dMB_NW7L7vzGzRYqayJP8xSgYyBFlVhuKlsPslphvV2UmFNygmCy4WKghRQ_=s190",
            iconUrl:
              "https://drive-thirdparty.googleusercontent.com/16/type/video/matroska",

            driveUrl:
              "https://drive.google.com/file/d/1WeZ0uhDnrQA-LFHsiGhYEUQ-iZc4P3bH/view?usp=sharing",
            embedUrl:
              "https://drive.google.com/file/d/1WeZ0uhDnrQA-LFHsiGhYEUQ-iZc4P3bH/preview",
            downloadUrl:
              "https://drive.google.com/u/0/uc?id=1WeZ0uhDnrQA-LFHsiGhYEUQ-iZc4P3bH&export=download",
          },
        ],
        count: 1,
      };
    }

    throw error;
  }
};

module.exports = {
  extractDriveFolderId,
  extractDriveFileId,
  getEmbedUrl,
  getMainDriveSettings,
  updateMainDriveSettings,
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  getDriveFolderContents,
};
