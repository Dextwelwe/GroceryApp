import { useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import categoriesData from '../categories.json';

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
    return results.length > 0 ? results[0].item : null;
  }, [fuse]);

  const getAllCategoriesList = useCallback(() => {
    return categoriesData.map(item => ({
      id: item.id,
      names: item.names
    }));
  }, []);

  return { getBestMatch, getAllCategoriesList, fuse };
};