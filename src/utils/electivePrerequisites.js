export function normalizeElectiveName(name = "") {
  return String(name).trim().replace(/\s+/g, " ");
}

export function getElectivePrerequisite(electiveName = "", availableElectives = []) {
  const normalizedName = normalizeElectiveName(electiveName);
  const exactLevelMatch = normalizedName.match(/^(.+?)\s+2$/i);
  const colonLevelMatch = normalizedName.match(/^(.+?)\s+2\s*:(.+)$/i);

  if (!exactLevelMatch && !colonLevelMatch) {
    return null;
  }

  const prerequisiteName = exactLevelMatch ? `${exactLevelMatch[1]} 1` : `${colonLevelMatch[1]} 1`;
  const normalizedPrerequisite = normalizeElectiveName(prerequisiteName).toLowerCase();
  const matchedPrerequisite = availableElectives.find(
    (elective) => {
      const normalizedElective = normalizeElectiveName(elective).toLowerCase();
      return normalizedElective === normalizedPrerequisite || normalizedElective.startsWith(`${normalizedPrerequisite}:`);
    }
  );

  return matchedPrerequisite || prerequisiteName;
}

export function getPrerequisiteValidationMessage(electiveName, prerequisiteName) {
  return `${electiveName} requires ${prerequisiteName} first. Please select ${prerequisiteName} as Elective 1 before choosing ${electiveName}.`;
}

export function validateElectiveSequence(elective1, elective2, availableElectives = []) {
  const firstElective = normalizeElectiveName(elective1);
  const secondElective = normalizeElectiveName(elective2);
  const firstPrerequisite = firstElective ? getElectivePrerequisite(firstElective, availableElectives) : null;
  const secondPrerequisite = secondElective ? getElectivePrerequisite(secondElective, availableElectives) : null;

  if (firstPrerequisite) {
    return {
      valid: false,
      field: "elective1",
      message: getPrerequisiteValidationMessage(firstElective, firstPrerequisite),
      prerequisite: firstPrerequisite,
      elective: firstElective,
    };
  }

  if (secondPrerequisite && normalizeElectiveName(firstElective).toLowerCase() !== normalizeElectiveName(secondPrerequisite).toLowerCase()) {
    return {
      valid: false,
      field: "elective2",
      message: getPrerequisiteValidationMessage(secondElective, secondPrerequisite),
      prerequisite: secondPrerequisite,
      elective: secondElective,
    };
  }

  return { valid: true };
}

export function selectElectivesWithPrerequisites(rankedElectives = [], limit = 2) {
  const catalogNames = rankedElectives.map((elective) => elective?.name).filter(Boolean);
  const selected = [];
  const selectedNames = new Set();
  const findByName = (name) =>
    rankedElectives.find(
      (elective) => normalizeElectiveName(elective?.name).toLowerCase() === normalizeElectiveName(name).toLowerCase()
    );

  for (const elective of rankedElectives) {
    if (!elective?.name || selected.length >= limit) {
      break;
    }

    const normalizedName = normalizeElectiveName(elective.name);
    const normalizedKey = normalizedName.toLowerCase();

    if (selectedNames.has(normalizedKey)) {
      continue;
    }

    const prerequisiteName = getElectivePrerequisite(normalizedName, catalogNames);

    if (!prerequisiteName) {
      selected.push(elective);
      selectedNames.add(normalizedKey);
      continue;
    }

    const prerequisiteKey = normalizeElectiveName(prerequisiteName).toLowerCase();

    if (selectedNames.has(prerequisiteKey)) {
      selected.push(elective);
      selectedNames.add(normalizedKey);
      continue;
    }

    const prerequisiteElective = findByName(prerequisiteName);

    if (prerequisiteElective && selected.length === 0 && limit >= 2) {
      selected.push(prerequisiteElective, elective);
      selectedNames.add(prerequisiteKey);
      selectedNames.add(normalizedKey);
    }
  }

  return selected.slice(0, limit);
}
