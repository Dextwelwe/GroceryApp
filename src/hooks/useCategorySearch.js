import { useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import categoriesData from '../categories.json';
import i18n from '../i18n';

export const useCategorySearch = () => {

  const normalizeTerm = useCallback((value) => {
    return (value || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }, []);

  const singularizeWord = useCallback((word) => {
    if (word.length <= 3) return word;
    if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
    if (/(xes|zes|ches|shes|ses|oes)$/i.test(word) && word.length > 4) return word.slice(0, -2);
    if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
    return word;
  }, []);

  const getQueryVariants = useCallback((query) => {
    const normalized = normalizeTerm(query);
    if (!normalized) return [];

    const variants = new Set([normalized]);
    variants.add(singularizeWord(normalized));

    const words = normalized.split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      variants.add(words.map((w) => singularizeWord(w)).join(' '));
    }

    return [...variants].filter(Boolean);
  }, [normalizeTerm, singularizeWord]);

  const exactCategoryIndex = useMemo(() => {
    const index = new Map();

    categoriesData.forEach((category) => {
      const id = category.id;
      const names = Object.values(category.names || {});
      const keywords = Object.values(category.keywords || {}).flat();
      const terms = [...names, ...keywords];

      terms.forEach((term) => {
        const variants = getQueryVariants(term);
        variants.forEach((variant) => {
          if (!index.has(variant)) {
            index.set(variant, id);
          }
        });
      });
    });

    return index;
  }, [getQueryVariants]);

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

    const queryVariants = getQueryVariants(trimmed);
    for (const variant of queryVariants) {
      const exactMatch = exactCategoryIndex.get(variant);
      if (exactMatch) return exactMatch;
    }
    
    const results = fuse.search(trimmed);
    return results.length > 0 ? results[0].item.id : null;
  }, [exactCategoryIndex, fuse, getQueryVariants]);

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