import { supabase } from "../../supabase";

const PROFILE_IMAGE_BUCKET = "enrollment_documents";
const PROFILE_IMAGE_DIRECTORY = "profile-pictures";
const PROFILE_IMAGE_MAX_SIZE = 2 * 1024 * 1024;
const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROFILE_IMAGE_STORAGE_PREFIX = "profile_picture";

function normalizeIdentifier(identifier?: string | null) {
  return typeof identifier === "string" ? identifier.trim() : "";
}

function buildStorageKey(identifier: string) {
  return `${PROFILE_IMAGE_STORAGE_PREFIX}_${identifier}`;
}

function inferFileExtension(file: File) {
  const nameParts = file.name.split(".");
  const extension = nameParts.length > 1 ? nameParts.pop()?.toLowerCase() : "";

  if (extension) {
    return extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function isMissingProfileImageColumn(error: unknown) {
  const message =
    typeof error === "object" && error !== null
      ? [
          (error as { message?: string }).message,
          (error as { details?: string }).details,
          (error as { hint?: string }).hint,
        ]
          .filter(Boolean)
          .join(" ")
      : "";

  return /profile_picture_url/i.test(message);
}

function getTimestampFromFileName(fileName: string) {
  const baseName = fileName.split(".")[0] || "";
  const timestamp = Number.parseInt(baseName, 10);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function loadLatestProfileImageFromStorage(userId?: string | null) {
  const normalizedUserId = normalizeIdentifier(userId);

  if (!normalizedUserId) {
    return "";
  }

  const folderPath = `${PROFILE_IMAGE_DIRECTORY}/${normalizedUserId}`;
  const { data, error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .list(folderPath, { limit: 100 });

  if (error) {
    console.error("Error loading profile picture from storage:", error);
    return "";
  }

  const latestFile = [...(data || [])]
    .filter((file) => typeof file.name === "string" && file.name.includes("."))
    .sort((left, right) => getTimestampFromFileName(right.name) - getTimestampFromFileName(left.name))[0];

  if (!latestFile) {
    return "";
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .getPublicUrl(`${folderPath}/${latestFile.name}`);

  return publicUrlData?.publicUrl || "";
}

export function validateProfileImageFile(file: File) {
  if (!PROFILE_IMAGE_TYPES.has(file.type)) {
    return "Please upload a JPG, PNG, or WebP image.";
  }

  if (file.size > PROFILE_IMAGE_MAX_SIZE) {
    return "Profile photos must be 2 MB or smaller.";
  }

  return null;
}

export function getStoredProfileImageUrl(userId?: string | null, email?: string | null) {
  if (typeof window === "undefined") {
    return "";
  }

  const identifiers = [normalizeIdentifier(userId), normalizeIdentifier(email)].filter(Boolean);

  for (const identifier of identifiers) {
    const storedUrl = localStorage.getItem(buildStorageKey(identifier));

    if (storedUrl) {
      return storedUrl;
    }
  }

  return "";
}

export function persistProfileImageUrl(
  imageUrl: string,
  userId?: string | null,
  email?: string | null
) {
  if (typeof window === "undefined" || !imageUrl) {
    return;
  }

  const identifiers = [normalizeIdentifier(userId), normalizeIdentifier(email)].filter(Boolean);

  for (const identifier of identifiers) {
    localStorage.setItem(buildStorageKey(identifier), imageUrl);
  }
}

export async function loadProfileImageUrl(userId?: string | null, email?: string | null) {
  const fallbackImageUrl = getStoredProfileImageUrl(userId, email);
  const normalizedUserId = normalizeIdentifier(userId);
  const normalizedEmail = normalizeIdentifier(email);

  if (!normalizedUserId && !normalizedEmail) {
    return fallbackImageUrl;
  }

  const profileLookup = normalizedUserId
    ? supabase.from("users").select("profile_picture_url").eq("id", normalizedUserId).maybeSingle()
    : supabase.from("users").select("profile_picture_url").eq("email", normalizedEmail).maybeSingle();

  const { data, error } = await profileLookup;
  const storageImageUrl = await loadLatestProfileImageFromStorage(normalizedUserId);

  if (error) {
    if (!isMissingProfileImageColumn(error)) {
      console.error("Error loading profile picture:", error);
    }

    if (storageImageUrl) {
      persistProfileImageUrl(storageImageUrl, normalizedUserId, normalizedEmail);
      return storageImageUrl;
    }

    return fallbackImageUrl;
  }

  const remoteImageUrl = typeof data?.profile_picture_url === "string" ? data.profile_picture_url : "";

  if (remoteImageUrl) {
    persistProfileImageUrl(remoteImageUrl, normalizedUserId, normalizedEmail);
    return remoteImageUrl;
  }

  if (storageImageUrl) {
    persistProfileImageUrl(storageImageUrl, normalizedUserId, normalizedEmail);
    return storageImageUrl;
  }

  return fallbackImageUrl;
}

export async function uploadProfileImage({
  userId,
  email,
  file,
}: {
  userId: string;
  email?: string | null;
  file: File;
}) {
  const validationError = validateProfileImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const storagePath = `${PROFILE_IMAGE_DIRECTORY}/${userId}/${Date.now()}.${inferFileExtension(file)}`;

  const { error: storageError } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(storagePath, file, { upsert: true });

  if (storageError) {
    throw new Error(storageError.message || "Failed to upload profile photo.");
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .getPublicUrl(storagePath);

  const imageUrl = publicUrlData?.publicUrl || "";

  if (!imageUrl) {
    throw new Error("Failed to generate the uploaded profile photo URL.");
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      profile_picture_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  const usedStorageFallback = Boolean(updateError && isMissingProfileImageColumn(updateError));

  if (updateError && !usedStorageFallback) {
    throw new Error(updateError.message || "Failed to save the profile photo.");
  }

  persistProfileImageUrl(imageUrl, userId, email);

  return {
    imageUrl,
    storagePath,
    usedStorageFallback,
  };
}