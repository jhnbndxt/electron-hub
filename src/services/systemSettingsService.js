import { supabase } from '../supabase';
import { createAuditLog, resolveUserId } from './adminService';

const STORAGE_KEY = 'electron_hub_system_settings';

function getCurrentAcademicYear(date = new Date()) {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getDefaultEnrollmentWindow(academicYear) {
  const startYear = Number.parseInt(String(academicYear || '').split('-')[0], 10);
  const fallbackYear = new Date().getFullYear();
  const normalizedStartYear = Number.isFinite(startYear) ? startYear : fallbackYear;

  return {
    start: `${normalizedStartYear}-03-01`,
    end: `${normalizedStartYear}-04-30`,
  };
}

const defaultAcademicYear = getCurrentAcademicYear();
const defaultEnrollmentWindow = getDefaultEnrollmentWindow(defaultAcademicYear);

export const SYSTEM_SETTINGS_DEFINITIONS = [
  {
    key: 'institution_name',
    type: 'string',
    defaultValue: 'Electron College of Technological Education',
    description: 'Institution name displayed across the public site and portals.',
  },
  {
    key: 'system_timezone',
    type: 'string',
    defaultValue: 'Asia/Manila',
    description: 'Primary timezone used for schedules, logs, and dashboard displays.',
  },
  {
    key: 'academic_year',
    type: 'string',
    defaultValue: defaultAcademicYear,
    description: 'Current academic year label used in registrar and coordinator workflows.',
  },
  {
    key: 'support_email',
    type: 'string',
    defaultValue: 'support@electronhub.edu.ph',
    description: 'Support email shown to students and staff when they need help.',
  },
  {
    key: 'enrollment_start_date',
    type: 'string',
    defaultValue: defaultEnrollmentWindow.start,
    description: 'Start date of the current enrollment window.',
  },
  {
    key: 'enrollment_end_date',
    type: 'string',
    defaultValue: defaultEnrollmentWindow.end,
    description: 'End date of the current enrollment window.',
  },
  {
    key: 'enrollment_open',
    type: 'boolean',
    defaultValue: true,
    description: 'Whether new student enrollment is currently open.',
  },
  {
    key: 'max_applications_per_day',
    type: 'number',
    defaultValue: 50,
    description: 'Maximum applications the branch should accept per day.',
  },
  {
    key: 'default_section_capacity',
    type: 'number',
    defaultValue: 50,
    description: 'Default section capacity used by the section management workflow.',
  },
  {
    key: 'max_upload_size_mb',
    type: 'number',
    defaultValue: 25,
    description: 'Maximum file upload size for enrollment documents in megabytes.',
  },
  {
    key: 'session_timeout_minutes',
    type: 'number',
    defaultValue: 30,
    description: 'Session timeout duration for portal users in minutes.',
  },
  {
    key: 'student_notifications_enabled',
    type: 'boolean',
    defaultValue: true,
    description: 'Allow student-facing notifications for important enrollment updates.',
  },
  {
    key: 'admin_alerts_enabled',
    type: 'boolean',
    defaultValue: true,
    description: 'Allow coordinator and registrar alert notifications.',
  },
  {
    key: 'email_notifications_enabled',
    type: 'boolean',
    defaultValue: true,
    description: 'Enable email-based notification delivery.',
  },
  {
    key: 'sms_notifications_enabled',
    type: 'boolean',
    defaultValue: false,
    description: 'Enable SMS notification delivery when an SMS provider is connected.',
  },
  {
    key: 'push_notifications_enabled',
    type: 'boolean',
    defaultValue: false,
    description: 'Enable browser or device push notifications.',
  },
  {
    key: 'maintenance_mode',
    type: 'boolean',
    defaultValue: false,
    description: 'Restrict general access for maintenance activities.',
  },
  {
    key: 'debug_mode',
    type: 'boolean',
    defaultValue: false,
    description: 'Expose extended debugging information for troubleshooting.',
  },
];

const SETTINGS_BY_KEY = SYSTEM_SETTINGS_DEFINITIONS.reduce((definitionMap, definition) => {
  definitionMap[definition.key] = definition;
  return definitionMap;
}, {});

function parseBoolean(value, fallbackValue) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'enabled', 'on'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'no', 'disabled', 'off'].includes(normalizedValue)) {
      return false;
    }
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return Boolean(fallbackValue);
}

function parseNumber(value, fallbackValue) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsedValue = Number.parseFloat(String(value ?? '').trim());
  return Number.isFinite(parsedValue) ? parsedValue : Number(fallbackValue || 0);
}

function parseStoredValue(value, type, fallbackValue) {
  if (type === 'boolean') {
    return parseBoolean(value, fallbackValue);
  }

  if (type === 'number') {
    return parseNumber(value, fallbackValue);
  }

  if (type === 'json') {
    if (value == null || value === '') {
      return fallbackValue;
    }

    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (_error) {
      return fallbackValue;
    }
  }

  const normalizedValue = String(value ?? '').trim();
  return normalizedValue || String(fallbackValue ?? '');
}

function serializeStoredValue(value, type) {
  if (type === 'json') {
    return JSON.stringify(value ?? null);
  }

  if (type === 'boolean') {
    return String(Boolean(value));
  }

  if (type === 'number') {
    const parsedValue = parseNumber(value, 0);
    return String(parsedValue);
  }

  return String(value ?? '').trim();
}

function buildDefaultSettings() {
  return SYSTEM_SETTINGS_DEFINITIONS.reduce((settings, definition) => {
    settings[definition.key] = definition.defaultValue;
    return settings;
  }, {});
}

function normalizeSettings(input = {}) {
  const defaultSettings = buildDefaultSettings();

  return SYSTEM_SETTINGS_DEFINITIONS.reduce((settings, definition) => {
    const rawValue = input[definition.key];
    settings[definition.key] = parseStoredValue(
      rawValue === undefined ? defaultSettings[definition.key] : rawValue,
      definition.type,
      definition.defaultValue
    );
    return settings;
  }, {});
}

function getLocalPayload() {
  if (typeof window === 'undefined') {
    return {
      settings: buildDefaultSettings(),
      lastUpdatedAt: null,
    };
  }

  const storedPayload = window.localStorage.getItem(STORAGE_KEY);
  if (!storedPayload) {
    return {
      settings: buildDefaultSettings(),
      lastUpdatedAt: null,
    };
  }

  try {
    const parsedPayload = JSON.parse(storedPayload);

    if (parsedPayload && typeof parsedPayload === 'object' && parsedPayload.settings) {
      return {
        settings: normalizeSettings(parsedPayload.settings),
        lastUpdatedAt: parsedPayload.lastUpdatedAt || null,
      };
    }

    return {
      settings: normalizeSettings(parsedPayload),
      lastUpdatedAt: null,
    };
  } catch (_error) {
    return {
      settings: buildDefaultSettings(),
      lastUpdatedAt: null,
    };
  }
}

function writeLocalPayload(settings, lastUpdatedAt = new Date().toISOString()) {
  const normalizedSettings = normalizeSettings(settings);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: normalizedSettings,
        lastUpdatedAt,
      })
    );
  }

  return {
    settings: normalizedSettings,
    lastUpdatedAt,
  };
}

function getLatestTimestamp(records = []) {
  return records
    .map((record) => record.updated_at)
    .filter(Boolean)
    .sort((leftTimestamp, rightTimestamp) => {
      return new Date(rightTimestamp).getTime() - new Date(leftTimestamp).getTime();
    })[0] || null;
}

async function ensureRemoteDefaults(existingKeys, resolvedUserId) {
  const missingDefinitions = SYSTEM_SETTINGS_DEFINITIONS.filter(
    (definition) => !existingKeys.has(definition.key)
  );

  if (missingDefinitions.length === 0) {
    return;
  }

  const timestamp = new Date().toISOString();
  const payload = missingDefinitions.map((definition) => ({
    setting_key: definition.key,
    setting_value: serializeStoredValue(definition.defaultValue, definition.type),
    description: definition.description,
    setting_type: definition.type,
    updated_at: timestamp,
    updated_by: resolvedUserId || null,
  }));

  await supabase.from('system_settings').upsert(payload, { onConflict: 'setting_key' });
}

export async function getSystemSettings() {
  const localPayload = getLocalPayload();

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value, setting_type, description, updated_at, updated_by');

    if (error) {
      throw error;
    }

    const remoteSettings = buildDefaultSettings();
    const existingKeys = new Set();

    (data || []).forEach((record) => {
      const definition = SETTINGS_BY_KEY[record.setting_key];
      if (!definition) {
        return;
      }

      existingKeys.add(record.setting_key);
      remoteSettings[record.setting_key] = parseStoredValue(
        record.setting_value,
        record.setting_type || definition.type,
        definition.defaultValue
      );
    });

    await ensureRemoteDefaults(existingKeys, null);

    const mergedSettings = normalizeSettings({
      ...localPayload.settings,
      ...remoteSettings,
    });
    const lastUpdatedAt = getLatestTimestamp(data || []) || localPayload.lastUpdatedAt;

    writeLocalPayload(mergedSettings, lastUpdatedAt || undefined);

    return {
      error: null,
      data: mergedSettings,
      source: 'supabase',
      lastUpdatedAt,
      warning: null,
    };
  } catch (error) {
    const fallbackPayload = writeLocalPayload(localPayload.settings, localPayload.lastUpdatedAt || undefined);

    return {
      error: null,
      data: fallbackPayload.settings,
      source: 'local',
      lastUpdatedAt: fallbackPayload.lastUpdatedAt,
      warning: error?.message || 'System settings table is unavailable. Using browser-local settings instead.',
    };
  }
}

export async function saveSystemSettings(nextSettings, actorReference) {
  const timestamp = new Date().toISOString();
  const localPayload = writeLocalPayload(nextSettings, timestamp);

  try {
    const resolvedUserId = actorReference ? await resolveUserId(actorReference) : null;
    const payload = SYSTEM_SETTINGS_DEFINITIONS.map((definition) => ({
      setting_key: definition.key,
      setting_value: serializeStoredValue(localPayload.settings[definition.key], definition.type),
      description: definition.description,
      setting_type: definition.type,
      updated_at: timestamp,
      updated_by: resolvedUserId || null,
    }));

    const { error } = await supabase
      .from('system_settings')
      .upsert(payload, { onConflict: 'setting_key' });

    if (error) {
      throw error;
    }

    try {
      await createAuditLog(
        actorReference || 'system',
        'SYSTEM_SETTINGS_UPDATED',
        'Updated system configuration settings.',
        'success',
        {
          resourceType: 'system_setting',
          changes: {
            updated_keys: SYSTEM_SETTINGS_DEFINITIONS.map((definition) => definition.key),
            settings: localPayload.settings,
          },
        }
      );
    } catch (auditError) {
      console.error('System settings audit log error:', auditError);
    }

    return {
      error: null,
      data: localPayload.settings,
      source: 'supabase',
      lastUpdatedAt: timestamp,
      warning: null,
    };
  } catch (error) {
    return {
      error: null,
      data: localPayload.settings,
      source: 'local',
      lastUpdatedAt: timestamp,
      warning: error?.message || 'Unable to save settings to Supabase. Changes were saved only in this browser.',
    };
  }
}