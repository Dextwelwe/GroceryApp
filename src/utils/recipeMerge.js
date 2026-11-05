import { addAmounts, normalizeUom, parseAmount, toQuantityFields } from './quantity';

/** @typedef {import('./quantity').GroceryItem} GroceryItem */

/**
 * @typedef {Object} MergeUpdate
 * @property {string} id
 * @property {string} name
 * @property {number|null} amount
 * @property {string|null} uom
 */

/**
 * @typedef {Object} MergePlan
 * @property {MergeUpdate[]} updates  - existing active items whose amount grows
 * @property {GroceryItem[]} creates  - brand new rows (unknown name, or incompatible UOM)
 */

const keyOf = (name) => (name || '').trim().toLowerCase();

/**
 * Plans how recipe ingredients merge into an existing grocery list.
 *
 * - Case A: same name **and** same UOM  -> the existing item's amount is summed.
 * - Case B: same name, different/absent UOM -> a separate row is created
 *   (never sum incompatible units, e.g. 200 g + 2 pcs).
 * - Case C: no match -> a new row is created.
 *
 * Only *active* (unbought) items are considered for aggregation.
 *
 * @param {GroceryItem[]} existingItems
 * @param {GroceryItem[]} ingredients
 * @param {{ recipeName?: string, addedBy?: string }} [meta]
 * @returns {MergePlan}
 */
export function planRecipeMerge(existingItems = [], ingredients = [], meta = {}) {
  /** @type {Map<string, any>} */
  const slots = new Map();

  (existingItems || [])
    .filter((item) => item && item.status !== 'completed' && (item.name || '').trim())
    .forEach((item) => {
      const uom = normalizeUom(item.uom);
      const slot = `${keyOf(item.name)}|${uom ?? ''}`;
      if (slots.has(slot)) return;
      slots.set(slot, {
        kind: 'update',
        id: item.id,
        name: item.name,
        amount: parseAmount(item.amount),
        uom,
        dirty: false,
      });
    });

  (ingredients || []).forEach((ingredient) => {
    const name = (ingredient?.name || '').trim();
    if (!name) return;

    const { amount, uom } = toQuantityFields(ingredient);
    const slot = `${keyOf(name)}|${uom ?? ''}`;
    const target = slots.get(slot);

    if (target) {
      target.amount = addAmounts(target.amount, amount);
      target.dirty = true;
      return;
    }

    slots.set(slot, {
      kind: 'create',
      name,
      amount,
      uom,
      category: ingredient.category || '',
      recipe: meta.recipeName || '',
      addedBy: meta.addedBy || '',
      status: 'active',
    });
  });

  /** @type {MergeUpdate[]} */
  const updates = [];
  /** @type {GroceryItem[]} */
  const creates = [];

  slots.forEach((entry) => {
    if (entry.kind === 'update') {
      if (!entry.dirty) return;
      updates.push({ id: entry.id, name: entry.name, amount: entry.amount, uom: entry.uom });
      return;
    }
    creates.push({
      name: entry.name,
      amount: entry.amount,
      uom: entry.uom,
      category: entry.category,
      recipe: entry.recipe,
      addedBy: entry.addedBy,
      status: entry.status,
    });
  });

  return { updates, creates };
}
