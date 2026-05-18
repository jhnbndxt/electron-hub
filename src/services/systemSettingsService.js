import { supabase } from '../supabase';
import { createAuditLog, resolveUserId } from './adminService';
import { broadcastNotificationToStudents } from './notificationService';

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
    key: 'default_section_capacity',
    type: 'number',
    defaultValue: 50,
    description: 'Default section capacity used by the section management workflow.',
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
    key: 'payment_bank_enabled',
    type: 'boolean',
    defaultValue: true,
    description: 'Allow students to submit bank transfer payments.',
  },
  {
    key: 'payment_bank_account_name',
    type: 'string',
    defaultValue: 'Electron College of Technological Education',
    description: 'Bank account name shown to students.',
  },
  {
    key: 'payment_bank_account_number',
    type: 'string',
    defaultValue: '007-123-456789',
    description: 'Bank account number shown to students.',
  },
  {
    key: 'payment_bank_details',
    type: 'string',
    defaultValue: 'BDO Unibank',
    description: 'Bank name and transfer details shown to students.',
  },
  {
    key: 'payment_gcash_enabled',
    type: 'boolean',
    defaultValue: true,
    description: 'Allow students to submit GCash payments.',
  },
  {
    key: 'payment_gcash_account_name',
    type: 'string',
    defaultValue: 'Electron College',
    description: 'GCash account name shown to students.',
  },
  {
    key: 'payment_gcash_account_number',
    type: 'string',
    defaultValue: '0917-123-4567',
    description: 'GCash account number shown to students.',
  },
  {
    key: 'payment_gcash_details',
    type: 'string',
    defaultValue: 'Official Electron Hub GCash payment channel',
    description: 'GCash payment details shown to students.',
  },
  {
    key: 'payment_cash_enabled',
    type: 'boolean',
    defaultValue: true,
    description: 'Allow students to generate over-the-counter payment queue numbers.',
  },
  {
    key: 'payment_tuition_amount',
    type: 'number',
    defaultValue: 15000,
    description: 'Default tuition/payment amount used in student payment flows.',
  },
];

const SETTINGS_BY_KEY = SYSTEM_SETTINGS_DEFINITIONS.reduce((definitionMap, definition) => {
  definitionMap[definition.key] = definition;
  return definitionMap;
}, {});

const LEGACY_ENCODED_VALUE_PREFIX = 'enc:v1:';
const ENCRYPTED_VALUE_PREFIX = 'enc:aes-gcm:v1:';
const SENSITIVE_PAYMENT_SETTING_KEYS = new Set([
  'payment_bank_account_name',
  'payment_bank_account_number',
  'payment_bank_details',
  'payment_gcash_account_name',
  'payment_gcash_account_number',
  'payment_gcash_details',
]);

function getEncryptionSecret() {
  return (
    import.meta.env.VITE_PAYMENT_SETTINGS_ENCRYPTION_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'electron-hub-development-payment-settings-key'
  );
}

function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function getPaymentSettingsEncryptionKey() {
  if (
    typeof crypto === 'undefined' ||
    !crypto.subtle ||
    typeof TextEncoder === 'undefined'
  ) {
    return null;
  }

  const encodedSecret = new TextEncoder().encode(getEncryptionSecret());
  const keyMaterial = await crypto.subtle.digest('SHA-256', encodedSecret);

  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

function legacyEncodeSensitiveValue(value) {
  const normalizedValue = String(value ?? '').trim();
  if (!normalizedValue) return '';

  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return `${LEGACY_ENCODED_VALUE_PREFIX}${window.btoa(unescape(encodeURIComponent(normalizedValue)))}`;
    }
  } catch (_error) {
    return normalizedValue;
  }

  return normalizedValue;
}

function legacyDecodeSensitiveValue(value) {
  const normalizedValue = String(value ?? '');
  if (!normalizedValue.startsWith(LEGACY_ENCODED_VALUE_PREFIX)) {
    return normalizedValue;
  }

  try {
    const encodedValue = normalizedValue.slice(LEGACY_ENCODED_VALUE_PREFIX.length);
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      return decodeURIComponent(escape(window.atob(encodedValue)));
    }
  } catch (_error) {
    return '';
  }

  return '';
}

async function encodeSensitiveValue(value) {
  const normalizedValue = String(value ?? '').trim();
  if (!normalizedValue) return '';

  if (
    normalizedValue.startsWith(ENCRYPTED_VALUE_PREFIX) ||
    normalizedValue.startsWith(LEGACY_ENCODED_VALUE_PREFIX)
  ) {
    return normalizedValue;
  }

  try {
    const key = await getPaymentSettingsEncryptionKey();
    if (!key || typeof crypto === 'undefined' || !crypto.getRandomValues) {
      return legacyEncodeSensitiveValue(normalizedValue);
    }

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(normalizedValue)
    );

    return `${ENCRYPTED_VALUE_PREFIX}${bufferToBase64(iv)}.${bufferToBase64(encryptedBuffer)}`;
  } catch (error) {
    console.error('Payment settings encryption failed:', error);
    return legacyEncodeSensitiveValue(normalizedValue);
  }
}

async function decodeSensitiveValue(value) {
  const normalizedValue = String(value ?? '');

  if (normalizedValue.startsWith(LEGACY_ENCODED_VALUE_PREFIX)) {
    return legacyDecodeSensitiveValue(normalizedValue);
  }

  if (!normalizedValue.startsWith(ENCRYPTED_VALUE_PREFIX)) {
    return normalizedValue;
  }

  try {
    const key = await getPaymentSettingsEncryptionKey();
    if (!key) {
      return '';
    }

    const encryptedPayload = normalizedValue.slice(ENCRYPTED_VALUE_PREFIX.length);
    const [ivValue, encryptedValue] = encryptedPayload.split('.');

    if (!ivValue || !encryptedValue) {
      return '';
    }

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(ivValue) },
      key,
      base64ToBytes(encryptedValue)
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Payment settings decryption failed:', error);
    return '';
  }
}

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

async function parseStoredValue(value, type, fallbackValue) {
  const rawValue = await decodeSensitiveValue(value);

  if (type === 'boolean') {
    return parseBoolean(rawValue, fallbackValue);
  }

  if (type === 'number') {
    return parseNumber(rawValue, fallbackValue);
  }

  if (type === 'json') {
    if (rawValue == null || rawValue === '') {
      return fallbackValue;
    }

    try {
      return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    } catch (_error) {
      return fallbackValue;
    }
  }

  const normalizedValue = String(rawValue ?? '').trim();
  return normalizedValue || String(fallbackValue ?? '');
}

async function serializeStoredValue(value, type, key = '') {
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

  const normalizedValue = String(value ?? '').trim();
  return SENSITIVE_PAYMENT_SETTING_KEYS.has(key) ? encodeSensitiveValue(normalizedValue) : normalizedValue;
}

function buildDefaultSettings() {
  return SYSTEM_SETTINGS_DEFINITIONS.reduce((settings, definition) => {
    settings[definition.key] = definition.defaultValue;
    return settings;
  }, {});
}

async function normalizeSettings(input = {}) {
  const defaultSettings = buildDefaultSettings();
  const settingEntries = await Promise.all(
    SYSTEM_SETTINGS_DEFINITIONS.map(async (definition) => {
      const rawValue = input[definition.key];
      const parsedValue = await parseStoredValue(
        rawValue === undefined ? defaultSettings[definition.key] : rawValue,
        definition.type,
        definition.defaultValue
      );

      return [definition.key, parsedValue];
    })
  );

  return settingEntries.reduce((settings, [key, value]) => {
    settings[key] = value;
    return settings;
  }, {});
}

async function serializeSettingsForStorage(settings) {
  const serializedEntries = await Promise.all(
    SYSTEM_SETTINGS_DEFINITIONS.map(async (definition) => [
      definition.key,
      await serializeStoredValue(settings[definition.key], definition.type, definition.key),
    ])
  );

  return serializedEntries.reduce((serializedSettings, [key, value]) => {
    serializedSettings[key] = value;
    return serializedSettings;
  }, {});
}

async function getLocalPayload() {
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
        settings: await normalizeSettings(parsedPayload.settings),
        lastUpdatedAt: parsedPayload.lastUpdatedAt || null,
      };
    }

    return {
      settings: await normalizeSettings(parsedPayload),
      lastUpdatedAt: null,
    };
  } catch (_error) {
    return {
      settings: buildDefaultSettings(),
      lastUpdatedAt: null,
    };
  }
}

async function writeLocalPayload(settings, lastUpdatedAt = new Date().toISOString()) {
  const normalizedSettings = await normalizeSettings(settings);
  const serializedSettings = await serializeSettingsForStorage(normalizedSettings);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings: serializedSettings,
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
  const payload = await Promise.all(missingDefinitions.map(async (definition) => ({
    setting_key: definition.key,
    setting_value: await serializeStoredValue(definition.defaultValue, definition.type, definition.key),
    description: definition.description,
    setting_type: definition.type,
    updated_at: timestamp,
    updated_by: resolvedUserId || null,
  })));

  await supabase.from('system_settings').upsert(payload, { onConflict: 'setting_key' });
}

export async function getSystemSettings() {
  const localPayload = await getLocalPayload();

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value, setting_type, description, updated_at, updated_by');

    if (error) {
      throw error;
    }

    const remoteSettings = buildDefaultSettings();
    const existingKeys = new Set();

    for (const record of data || []) {
      const definition = SETTINGS_BY_KEY[record.setting_key];
      if (!definition) {
        continue;
      }

      existingKeys.add(record.setting_key);
      remoteSettings[record.setting_key] = await parseStoredValue(
        record.setting_value,
        record.setting_type || definition.type,
        definition.defaultValue
      );
    }

    await ensureRemoteDefaults(existingKeys, null);

    const mergedSettings = await normalizeSettings({
      ...localPayload.settings,
      ...remoteSettings,
    });
    const lastUpdatedAt = getLatestTimestamp(data || []) || localPayload.lastUpdatedAt;

    await writeLocalPayload(mergedSettings, lastUpdatedAt || undefined);

    return {
      error: null,
      data: mergedSettings,
      source: 'supabase',
      lastUpdatedAt,
      warning: null,
    };
  } catch (error) {
    const fallbackPayload = await writeLocalPayload(localPayload.settings, localPayload.lastUpdatedAt || undefined);

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
  const localPayload = await writeLocalPayload(nextSettings, timestamp);

  const previousSettingsResult = await getSystemSettings();
  const previousSettings = previousSettingsResult?.data || buildDefaultSettings();
  const previousEnrollmentOpen = previousSettings.enrollment_open !== false;
  const nextEnrollmentOpen = localPayload.settings.enrollment_open !== false;
  const studentNotificationsEnabled = localPayload.settings.student_notifications_enabled !== false;

  try {
    const resolvedUserId = actorReference ? await resolveUserId(actorReference) : null;
    const payload = await Promise.all(SYSTEM_SETTINGS_DEFINITIONS.map(async (definition) => ({
      setting_key: definition.key,
      setting_value: await serializeStoredValue(localPayload.settings[definition.key], definition.type, definition.key),
      description: definition.description,
      setting_type: definition.type,
      updated_at: timestamp,
      updated_by: resolvedUserId || null,
    })));

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
            sensitive_payment_settings_encrypted: true,
          },
        }
      );
    } catch (auditError) {
      console.error('System settings audit log error:', auditError);
    }

    if (studentNotificationsEnabled && previousEnrollmentOpen !== nextEnrollmentOpen) {
      try {
        const enrollmentTrigger = nextEnrollmentOpen ? 'ENROLLMENT_OPENED' : 'ENROLLMENT_CLOSED';
        await broadcastNotificationToStudents(enrollmentTrigger);
      } catch (broadcastError) {
        console.error('Error broadcasting enrollment status notifications:', broadcastError);
      }
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
