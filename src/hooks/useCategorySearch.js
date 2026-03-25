import { useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import categoriesData from '../categories.json';
import i18n from '../i18n';

export const useCategorySearch = () => {

  const fuse = useMemo(() => {
    return new Fuse(categoriesData, {
      keys: [
        { name: "names.en", weight: 2 },
        { name: "names.ru", weight: 2 },
        { name: "names.fr", weight: 2 },
        { name: "keywords.en", weight: 1 },
        { name: "keywords.ru", weight: 1 },
        { name: "keywords.fr", weight: 1 }
      ],
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      minMatchCharLength: 3
    });
  }, []);

  const getBestMatch = useCallback((query) => {
    const trimmed = query?.trim();
    if (!trimmed) return null;
    
    const results = fuse.search(trimmed);
    return results.length > 0 ? results[0].item.id : null;
  }, [fuse]);

  const getAllCategoriesList = useCallback(() => {
    return categoriesData.map(item => ({
      id: item.id,
      names: item.names
    }));
  }, []);

  const getOneCategory = useCallback((categoryId) => {
    const key = (categoryId || '').toString().trim().toLowerCase();
    if (!key) return '';

    const category = categoriesData.find((item) => item.id === key);
    if (!category) return categoryId;

    const lang = (i18n.language || 'en').toLowerCase().split('-')[0];
    return category.names?.[lang] || category.names?.en || category.id;
  }, []);

  return { getBestMatch, getAllCategoriesList, getOneCategory, fuse };
};