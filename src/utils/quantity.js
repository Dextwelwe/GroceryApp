/**
 * Quantity / unit-of-measure helpers shared by grocery items and recipe
 * ingredients.
 *
 * The project is plain JavaScript (CRA, no TypeScript pipeline), so the data
 * contracts are expressed as JSDoc typedefs — editors get the same IntelliSense
 * without a build-tool migration.
 */

/**
 * @typedef {'pcs'|'kg'|'g'|'l'|'ml'|'tbsp'|'tsp'|'cup'|'pack'} Uom
 */

/**
 * @typedef {Object} Quantity
 * @property {number|null} amount  - numeric quantity, null when unspecified
 * @property {Uom|string|null} uom - unit of measure, null when unspecified
 */

/**
 * @typedef {Object} GroceryItem
 * @property {string} name
 * @property {number|null} [amount]
 * @property {Uom|string|null} [uom]
 * @property {string} [category]
 * @property {string} [store]
 * @property {string} [recipe]
 * @property {'active'|'completed'} [status]
 * @property {string} [addedBy]
 */

/** Supported units of measure (extend freely). */
export const UOM_OPTIONS = ['pcs', 'kg', 'g', 'l', 'ml', 'tbsp', 'tsp', 'cup', 'pack'];

/**
 * Parses any raw input into a usable amount.
 * Empty strings, NaN, negatives and non-numeric values become null.
 * @param {unknown} raw
 * @returns {number|null}
 */
export function parseAmount(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const value = typeof raw === 'number' ? raw : Number.parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 1000) / 1000;
}

/**
 * Normalises a unit of measure to a lower-cased, trimmed code.
 * @param {unknown} raw
 * @returns {string|null}
 */
export function normalizeUom(raw) {
  if (!raw) return null;
  const value = String(raw).trim().toLowerCase();
  return value === '' ? null : value;
}

/**
 * True when a row carries a complete, displayable quantity.
 * @param {Partial<Quantity>} item
 * @returns {boolean}
 */
export function hasQuantity(item) {
  return parseAmount(item?.amount) !== null && normalizeUom(item?.uom) !== null;
}

/**
 * Renders a quantity for display: "2 kg", "500 g", "3" (amount only) or ''.
 * Never returns dashes/placeholders so plain items stay clean.
 * @param {number|null|undefined} amount
 * @param {string|null|undefined} uom
 * @returns {string}
 */
export function formatQuantity(amount, uom) {
  const parsed = parseAmount(amount);
  const unit = normalizeUom(uom);
  if (parsed === null && !unit) return '';
  if (parsed === null) return unit || '';
  const rounded = Number.isInteger(parsed) ? String(parsed) : String(parsed);
  return unit ? `${rounded} ${unit}` : rounded;
}

/**
 * Sums two amounts, treating null as "nothing to add".
 * @param {number|null|undefined} a
 * @param {number|null|undefined} b
 * @returns {number|null}
 */
export function addAmounts(a, b) {
  const left = parseAmount(a);
  const right = parseAmount(b);
  if (left === null && right === null) return null;
  return Math.round(((left ?? 0) + (right ?? 0)) * 1000) / 1000;
}

/**
 * Strips quantity fields down to the canonical shape stored in Firestore.
 * @param {Partial<GroceryItem>} item
 * @returns {{ amount: number|null, uom: string|null }}
 */
export function toQuantityFields(item) {
  return {
    amount: parseAmount(item?.amount),
    uom: normalizeUom(item?.uom),
  };
}
