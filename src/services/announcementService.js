import { supabase } from '../supabase';
import { createAuditLog } from './adminService';

const STORAGE_KEY = 'electron_hub_announcements';
const VALID_ACCENT_COLORS = new Set(['blue', 'red']);
const REMOTE_RESOURCE_TYPE = 'announcement';
const REMOTE_SNAPSHOT_ACTIONS = [
  'announcement_created',
  'announcement_updated',
  'announcement_deleted',
  'announcement_synced',
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Enrollment Period for SY 2026-2027 Now Open',
    content:
      'Online enrollment for incoming Senior High School students is now active. Complete your assessment and submit your application before April 30, 2026.',
    postedAt: '2026-03-01',
    accentColor: 'red',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    createdBy: null,
    updatedBy: null,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    title: 'New AI Assessment System Launched',
    content:
      'Experience our enhanced AI-powered strand recommendation system designed to provide more accurate and personalized academic guidance.',
    postedAt: '2026-02-15',
    accentColor: 'blue',
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: '2026-02-15T00:00:00.000Z',
    createdBy: null,
    updatedBy: null,
  },
];

const createAnnouncementId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const computedValue = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return computedValue.toString(16);
  });
};

const toIsoDate = (value) => {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString().split('T')[0];
  }

  return parsedDate.toISOString().split('T')[0];
};

const toIsoTimestamp = (value) => {
  if (!value) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString();
  }

  return parsedDate.toISOString();
};

const normalizeAccentColor = (value) => {
  return VALID_ACCENT_COLORS.has(value) ? value : 'blue';
};

const normalizeAnnouncement = (announcement = {}) => {
  return {
    id: String(announcement.id || createAnnouncementId()),
    title: String(announcement.title || '').trim(),
    content: String(announcement.content || '').trim(),
    postedAt: toIsoDate(announcement.postedAt || announcement.posted_at || announcement.created_at),
    accentColor: normalizeAccentColor(announcement.accentColor || announcement.accent_color),
    createdBy: announcement.createdBy || announcement.created_by || null,
    updatedBy: announcement.updatedBy || announcement.updated_by || null,
    createdAt: toIsoTimestamp(announcement.createdAt || announcement.created_at),
    updatedAt: toIsoTimestamp(announcement.updatedAt || announcement.updated_at),
  };
};

const sortAnnouncements = (announcements = []) => {
  return [...announcements].sort((leftAnnouncement, rightAnnouncement) => {
    const leftPostedAt = new Date(leftAnnouncement.postedAt).getTime();
    const rightPostedAt = new Date(rightAnnouncement.postedAt).getTime();

    if (rightPostedAt !== leftPostedAt) {
      return rightPostedAt - leftPostedAt;
    }

    const leftUpdatedAt = new Date(leftAnnouncement.updatedAt || leftAnnouncement.createdAt).getTime();
    const rightUpdatedAt = new Date(rightAnnouncement.updatedAt || rightAnnouncement.createdAt).getTime();

    return rightUpdatedAt - leftUpdatedAt;
  });
};

const serializeAnnouncements = (announcements = []) => {
  return JSON.stringify(
    sortAnnouncements(announcements).map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      postedAt: announcement.postedAt,
      accentColor: announcement.accentColor,
    }))
  );
};

const getDefaultAnnouncements = () => {
  return sortAnnouncements(DEFAULT_ANNOUNCEMENTS.map((announcement) => normalizeAnnouncement(announcement)));
};

export const hasCustomAnnouncements = (announcements = []) => {
  return serializeAnnouncements(announcements) !== serializeAnnouncements(getDefaultAnnouncements());
};

const readLocalAnnouncements = () => {
  if (typeof window === 'undefined') {
    return getDefaultAnnouncements();
  }

  const storedAnnouncements = window.localStorage.getItem(STORAGE_KEY);

  if (!storedAnnouncements) {
    const defaultAnnouncements = getDefaultAnnouncements();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnnouncements));
    return defaultAnnouncements;
  }

  try {
    const parsedAnnouncements = JSON.parse(storedAnnouncements);

    if (!Array.isArray(parsedAnnouncements) || parsedAnnouncements.length === 0) {
      const defaultAnnouncements = getDefaultAnnouncements();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnnouncements));
      return defaultAnnouncements;
    }

    return sortAnnouncements(parsedAnnouncements.map((announcement) => normalizeAnnouncement(announcement)));
  } catch (error) {
    const defaultAnnouncements = getDefaultAnnouncements();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultAnnouncements));
    return defaultAnnouncements;
  }
};

const writeLocalAnnouncements = (announcements = []) => {
  const normalizedAnnouncements = sortAnnouncements(
    announcements.map((announcement) => normalizeAnnouncement(announcement))
  );

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedAnnouncements));
  }

  return normalizedAnnouncements;
};

const fetchRemoteAnnouncementSnapshot = async () => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, changes, created_at')
    .eq('resource_type', REMOTE_RESOURCE_TYPE)
    .in('action', REMOTE_SNAPSHOT_ACTIONS)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return { error, data: null };
  }

  const snapshotLog = (data || []).find((log) => Array.isArray(log?.changes?.announcements));

  if (!snapshotLog) {
    return { error: null, data: null };
  }

  return {
    error: null,
    data: sortAnnouncements(snapshotLog.changes.announcements.map((announcement) => normalizeAnnouncement(announcement))),
  };
};

const writeRemoteAnnouncementSnapshot = async ({
  announcements,
  actorReference,
  action,
  details,
  announcement,
  resourceId,
}) => {
  const normalizedAnnouncements = sortAnnouncements(
    announcements.map((announcementItem) => normalizeAnnouncement(announcementItem))
  );

  const { error } = await createAuditLog(actorReference, action, details, 'success', {
    resourceType: REMOTE_RESOURCE_TYPE,
    resourceId,
    changes: {
      title: announcement?.title || '',
      content: announcement?.content || '',
      posted_at: announcement?.postedAt || '',
      accent_color: announcement?.accentColor || 'blue',
      announcements: normalizedAnnouncements,
      announcement: announcement ? normalizeAnnouncement(announcement) : null,
      count: normalizedAnnouncements.length,
    },
  });

  return { error };
};

export const getAnnouncements = async () => {
  const localAnnouncements = readLocalAnnouncements();

  try {
    const { data, error } = await fetchRemoteAnnouncementSnapshot();

    if (error) {
      return { error: null, data: localAnnouncements, source: 'local' };
    }

    if (!data || data.length === 0) {
      return { error: null, data: localAnnouncements, source: 'local' };
    }

    const remoteAnnouncements = writeLocalAnnouncements(data);
    return { error: null, data: remoteAnnouncements, source: 'supabase' };
  } catch (error) {
    return { error: null, data: localAnnouncements, source: 'local' };
  }
};

export const syncAnnouncementsToRemote = async (announcements, actorReference) => {
  const normalizedAnnouncements = writeLocalAnnouncements(announcements);

  try {
    const { error } = await writeRemoteAnnouncementSnapshot({
      announcements: normalizedAnnouncements,
      actorReference,
      action: 'announcement_synced',
      details: 'Synchronized public announcements to the shared announcement feed.',
      resourceId: normalizedAnnouncements[0]?.id,
      announcement: normalizedAnnouncements[0] || null,
    });

    if (error) {
      return { error, data: normalizedAnnouncements, source: 'local' };
    }
  } catch (error) {
    return { error: null, data: normalizedAnnouncements, source: 'local' };
  }

  return { error: null, data: normalizedAnnouncements, source: 'supabase' };
};

export const createAnnouncement = async (announcementInput) => {
  const localAnnouncements = readLocalAnnouncements();
  const timestamp = new Date().toISOString();
  const nextAnnouncement = normalizeAnnouncement({
    id: createAnnouncementId(),
    ...announcementInput,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const actorReference = announcementInput.actorReference || announcementInput.updatedBy || announcementInput.createdBy || null;

  const updatedAnnouncements = writeLocalAnnouncements([nextAnnouncement, ...localAnnouncements]);

  try {
    const { error } = await writeRemoteAnnouncementSnapshot({
      announcements: updatedAnnouncements,
      actorReference,
      action: 'announcement_created',
      details: `Created announcement "${nextAnnouncement.title}" posted on ${nextAnnouncement.postedAt}.`,
      resourceId: nextAnnouncement.id,
      announcement: nextAnnouncement,
    });

    if (error) {
      return { error, data: nextAnnouncement, source: 'local' };
    }
  } catch (error) {
    return { error: null, data: nextAnnouncement, source: 'local' };
  }

  return { error: null, data: nextAnnouncement, source: 'supabase' };
};

export const updateAnnouncement = async (announcementId, announcementInput) => {
  const localAnnouncements = readLocalAnnouncements();
  const existingAnnouncement = localAnnouncements.find((announcement) => announcement.id === announcementId);

  if (!existingAnnouncement) {
    return { error: 'Announcement not found.', data: null, source: 'local' };
  }

  const updatedAnnouncement = normalizeAnnouncement({
    ...existingAnnouncement,
    ...announcementInput,
    id: existingAnnouncement.id,
    createdAt: existingAnnouncement.createdAt,
    updatedAt: new Date().toISOString(),
  });
  const actorReference = announcementInput.actorReference || announcementInput.updatedBy || announcementInput.createdBy || null;

  const updatedAnnouncements = writeLocalAnnouncements(
    localAnnouncements.map((announcement) => {
      return announcement.id === announcementId ? updatedAnnouncement : announcement;
    })
  );

  try {
    const { error } = await writeRemoteAnnouncementSnapshot({
      announcements: updatedAnnouncements,
      actorReference,
      action: 'announcement_updated',
      details: `Updated announcement "${updatedAnnouncement.title}" posted on ${updatedAnnouncement.postedAt}.`,
      resourceId: updatedAnnouncement.id,
      announcement: updatedAnnouncement,
    });

    if (error) {
      return { error, data: updatedAnnouncement, source: 'local' };
    }
  } catch (error) {
    return { error: null, data: updatedAnnouncement, source: 'local' };
  }

  return { error: null, data: updatedAnnouncement, source: 'supabase' };
};

export const deleteAnnouncement = async (announcementId, actorReference) => {
  const localAnnouncements = readLocalAnnouncements();
  const effectiveActorReference = actorReference || null;
  const deletedAnnouncement = localAnnouncements.find((announcement) => announcement.id === announcementId) || null;
  const remainingAnnouncements = writeLocalAnnouncements(
    localAnnouncements.filter((announcement) => announcement.id !== announcementId)
  );

  try {
    const { error } = await writeRemoteAnnouncementSnapshot({
      announcements: remainingAnnouncements,
      actorReference: effectiveActorReference,
      action: 'announcement_deleted',
      details: deletedAnnouncement
        ? `Deleted announcement "${deletedAnnouncement.title}" posted on ${deletedAnnouncement.postedAt}.`
        : 'Deleted a public announcement.',
      resourceId: announcementId,
      announcement: deletedAnnouncement,
    });

    if (error) {
      return { error, data: remainingAnnouncements, source: 'local' };
    }
  } catch (error) {
    return { error: null, data: remainingAnnouncements, source: 'local' };
  }

  return { error: null, data: remainingAnnouncements, source: 'supabase' };
};