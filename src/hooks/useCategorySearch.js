import { useMemo, useCallback } from 'react';
import groceryItems from '../data/groceryItems.json';
import i18n from '../i18n';

const CATEGORY_IDS = [
  'produce', 'meat', 'dairy', 'bakery', 'pantry',
  'frozen', 'snacks_drinks', 'household', 'personal_care', 'pets', 'seafood'
];

const normalize = (value) =>
  (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const useCategorySearch = () => {

  const itemIndex = useMemo(() => {
    const index = new Map();
    groceryItems.forEach((item) => {
      const enKey = normalize(item.en);
      const frKey = normalize(item.fr);
      if (enKey && !index.has(enKey)) index.set(enKey, item);
      if (frKey && !index.has(frKey)) index.set(frKey, item);
    });
    return index;
  }, []);

  const getBestMatch = useCallback((query) => {
    const q = normalize(query);
    if (!q) return null;

    const exact = itemIndex.get(q);
    if (exact) return exact.category;

    for (const [key, item] of itemIndex) {
      if (key.startsWith(q) || q.startsWith(key)) return item.category;
    }
    for (const [key, item] of itemIndex) {
      if (key.includes(q) || q.includes(key)) return item.category;
    }
    return null;
  }, [itemIndex]);

  const getItemSuggestions = useCallback((query) => {
    const q = normalize(query);
    if (!q || q.length < 2) return [];

    const lang = (i18n.language || 'en').toLowerCase().split('-')[0];
    const seen = new Set();
    const results = [];

    for (const item of groceryItems) {
      const en = normalize(item.en);
      const fr = normalize(item.fr);
      const ru = normalize(item.ru);
      if (
        en.startsWith(q) ||
        fr.startsWith(q) ||
        ru.startsWith(q)
      ) {
        if (!seen.has(en)) {
          seen.add(en);
          let label = item.en;
          if (lang === 'fr') label = item.fr;
          else if (lang === 'ru') label = item.ru;
          results.push({ ...item, label });
        }
      }
    }
    if (results.length < 8) {
      for (const item of groceryItems) {
        const en = normalize(item.en);
        const fr = normalize(item.fr);
        const ru = normalize(item.ru);
        if (
          !seen.has(en) &&
          (en.includes(q) || fr.includes(q) || ru.includes(q))
        ) {
          seen.add(en);
          let label = item.en;
          if (lang === 'fr') label = item.fr;
          else if (lang === 'ru') label = item.ru;
          results.push({ ...item, label });
        }
        if (results.length >= 8) break;
      }
    }
    return results.slice(0, 8);
  }, []);

  const getAllCategoriesList = useCallback(() => {
    return CATEGORY_IDS.map(id => ({ id, names: { en: id, fr: id } }));
  }, []);

  const getOneCategory = useCallback((categoryId) => {
    const key = (categoryId || '').toString().trim().toLowerCase();
    if (!key) return '';
    const translated = i18n.t(`CATEGORIES.${key.toUpperCase()}`, { defaultValue: '' });
    return translated || categoryId;
  }, []);

  return { getBestMatch, getAllCategoriesList, getOneCategory, getItemSuggestions };
};