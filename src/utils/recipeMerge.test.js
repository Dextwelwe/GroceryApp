import { planRecipeMerge } from './recipeMerge';
import { formatQuantity, parseAmount, normalizeUom, hasQuantity, addAmounts } from './quantity';

describe('quantity helpers', () => {
  test('parseAmount accepts numbers/strings and rejects junk', () => {
    expect(parseAmount('2.5')).toBe(2.5);
    expect(parseAmount('1,5')).toBe(1.5);
    expect(parseAmount(3)).toBe(3);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount(-2)).toBeNull();
    expect(parseAmount(null)).toBeNull();
  });

  test('normalizeUom lower-cases and trims', () => {
    expect(normalizeUom(' KG ')).toBe('kg');
    expect(normalizeUom('')).toBeNull();
    expect(normalizeUom(undefined)).toBeNull();
  });

  test('formatQuantity never renders placeholders', () => {
    expect(formatQuantity(2, 'kg')).toBe('2 kg');
    expect(formatQuantity(1.5, 'l')).toBe('1.5 l');
    expect(formatQuantity(3, null)).toBe('3');
    expect(formatQuantity(null, 'pcs')).toBe('pcs');
    expect(formatQuantity(null, null)).toBe('');
    expect(formatQuantity(undefined, '')).toBe('');
  });

  test('hasQuantity requires both parts', () => {
    expect(hasQuantity({ amount: 2, uom: 'kg' })).toBe(true);
    expect(hasQuantity({ amount: 2, uom: null })).toBe(false);
    expect(hasQuantity({ amount: null, uom: 'kg' })).toBe(false);
  });

  test('addAmounts sums, treating null as zero', () => {
    expect(addAmounts(2, 3)).toBe(5);
    expect(addAmounts(null, 4)).toBe(4);
    expect(addAmounts(null, null)).toBeNull();
  });
});

describe('planRecipeMerge', () => {
  const existing = [
    { id: 'i1', name: 'Bananas', amount: 1, uom: 'kg', status: 'active', category: 'produce' },
    { id: 'i2', name: 'Milk', amount: null, uom: null, status: 'active', category: 'dairy' },
    { id: 'i3', name: 'Bread', amount: 2, uom: 'pcs', status: 'completed' },
  ];

  test('case A — same name + same UOM aggregates into the existing row', () => {
    const plan = planRecipeMerge(existing, [{ name: ' bananas ', amount: 2, uom: 'KG', category: 'produce' }]);
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates).toEqual([{ id: 'i1', name: 'Bananas', amount: 3, uom: 'kg' }]);
  });

  test('case B — same name, incompatible UOM creates a separate row', () => {
    const plan = planRecipeMerge(existing, [{ name: 'Bananas', amount: 200, uom: 'g' }]);
    expect(plan.updates).toHaveLength(0);
    expect(plan.creates).toHaveLength(1);
    expect(plan.creates[0]).toMatchObject({ name: 'Bananas', amount: 200, uom: 'g', status: 'active' });
  });

  test('case B — existing item without UOM is not merged with a united ingredient', () => {
    const plan = planRecipeMerge(existing, [{ name: 'Milk', amount: 1, uom: 'l' }]);
    expect(plan.updates).toHaveLength(0);
    expect(plan.creates[0]).toMatchObject({ name: 'Milk', amount: 1, uom: 'l' });
  });

  test('case C — unknown name is created with recipe + addedBy metadata', () => {
    const plan = planRecipeMerge(existing, [{ name: 'Basil', amount: 20, uom: 'g', category: 'produce' }], {
      recipeName: 'Pesto',
      addedBy: 'Daniil',
    });
    expect(plan.updates).toHaveLength(0);
    expect(plan.creates[0]).toMatchObject({
      name: 'Basil', amount: 20, uom: 'g', category: 'produce', recipe: 'Pesto', addedBy: 'Daniil',
    });
  });

  test('bought items are ignored and duplicates inside one recipe accumulate', () => {
    const plan = planRecipeMerge(existing, [
      { name: 'Bread', amount: 1, uom: 'pcs' },
      { name: 'Flour', amount: 500, uom: 'g' },
      { name: 'flour', amount: 250, uom: 'g' },
    ]);
    expect(plan.updates).toHaveLength(0);
    expect(plan.creates).toHaveLength(2);
    expect(plan.creates.find((item) => item.name === 'Flour')).toMatchObject({ amount: 750, uom: 'g' });
  });

  test('items without amount/uom still merge with an existing bare row', () => {
    const plan = planRecipeMerge(
      [{ id: 'i9', name: 'Salt', amount: null, uom: null, status: 'active' }],
      [{ name: 'salt', amount: null, uom: null }],
    );
    expect(plan.creates).toHaveLength(0);
    expect(plan.updates).toEqual([{ id: 'i9', name: 'Salt', amount: null, uom: null }]);
  });
});
