export const norm = s => (s ?? '').toString().trim().toLowerCase();

export function validateInput(value) {
  if (value == null) return false;
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed.length <= 50;
  }
  return false;
}

export function getDate(d) {
  if (!d) return null;
  try { return typeof d?.toDate === 'function' ? d.toDate() : new Date(d); }
  catch { return null; }
}

export function resolveCategoryId(categoryValue, getAllCategoriesList) {
  const raw = (categoryValue || '').toString().trim();
  if (!raw) return '';
  const allCategories = getAllCategoriesList();
  const lowerRaw = raw.toLowerCase();
  const match = allCategories.find((cat) => {
    if (cat.id === raw) return true;
    const names = Object.values(cat.names || {}).map((name) => (name || '').toString().trim().toLowerCase());
    return names.includes(lowerRaw);
  });
  return match ? match.id : raw;
}
