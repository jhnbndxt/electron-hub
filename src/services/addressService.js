const API = "https://psgc.gitlab.io/api";

const cache = new Map();

async function fetchPsgc(path) {
  if (cache.has(path)) {
    return cache.get(path);
  }

  const response = await fetch(`${API}${path}`);

  if (!response.ok) {
    throw new Error(`PSGC request failed: ${response.status}`);
  }

  const data = await response.json();
  const sortedData = Array.isArray(data)
    ? [...data].sort((first, second) => String(first.name || "").localeCompare(String(second.name || "")))
    : data;

  cache.set(path, sortedData);
  return sortedData;
}

export async function getRegions() {
  return fetchPsgc("/regions/");
}

export async function getProvinces(regionCode) {
  if (!regionCode) return [];
  return fetchPsgc(`/regions/${regionCode}/provinces/`);
}

export async function getCities(regionCode) {
  if (!regionCode) return [];
  return fetchPsgc(`/regions/${regionCode}/cities-municipalities/`);
}

export async function getCitiesByProvince(provinceCode) {
  if (!provinceCode) return [];
  return fetchPsgc(`/provinces/${provinceCode}/cities-municipalities/`);
}

export async function getBarangays(cityCode) {
  if (!cityCode) return [];
  return fetchPsgc(`/cities-municipalities/${cityCode}/barangays/`);
}
