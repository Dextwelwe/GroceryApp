/* eslint-disable testing-library/no-node-access */
import { render, screen, fireEvent } from '@testing-library/react';
import AddItems from './addItems';
import Popup from '../popup/Popup';

function getSuggestionList() {
  return screen.queryByRole('list');
}

test('suggestions are portaled to the body with a usable height', () => {
  render(<AddItems onSave={() => {}} storesList={[]} userName='Test' />);

  const input = screen.getByRole('textbox');
  expect(getSuggestionList()).toBeNull();

  fireEvent.change(input, { target: { value: 'app' } });

  const list = getSuggestionList();
  expect(list).not.toBeNull();
  // rendered outside the popup / component tree so a short popup cannot clip it
  expect(list.parentElement).toBe(document.body);
  expect(list.getAttribute('data-popup-keep-open')).toBe('true');
  // inline geometry is applied (max height matches the CSS cap)
  expect(list.style.position).toBe('fixed');
  expect(list.style.maxHeight).toBe('220px');
  expect(list.style.top).toBe('6px');
  expect(list.style.width.endsWith('px')).toBe(true);
  expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
});

test('opens above the field when there is no room below', () => {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () {
    return {
      top: 700, bottom: 746, left: 10, right: 300, width: 290, height: 46, x: 10, y: 700,
      toJSON() { return this; },
    };
  };

  try {
    render(<AddItems onSave={() => {}} storesList={[]} userName='Test' />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'app' } });

    const list = getSuggestionList();
    expect(list).not.toBeNull();
    // opened above the field: anchored with `bottom`, no top offset
    expect(list.style.top).not.toMatch(/px$/);
    expect(list.style.bottom).toBe(`${window.innerHeight - 700 + 6}px`);
    expect(list.style.maxHeight).toBe('220px');
  } finally {
    Element.prototype.getBoundingClientRect = original;
  }
});

test('clicking a suggestion does not close the parent popup', () => {
  window.matchMedia = () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });

  const close = jest.fn();
  render(
    <Popup title='Add items' close={close}>
      <AddItems onSave={() => {}} storesList={[]} userName='Test' />
    </Popup>
  );

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'app' } });
  expect(getSuggestionList()).not.toBeNull();

  fireEvent.mouseDown(screen.getAllByRole('listitem')[0]);
  expect(close).not.toHaveBeenCalled();

  fireEvent.mouseDown(document.body);
  expect(close).toHaveBeenCalled();
});

test('clicking a suggestion adds the item and closes the list', () => {
  render(<AddItems onSave={() => {}} storesList={[]} userName='Test' />);

  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'app' } });

  fireEvent.click(screen.getAllByRole('listitem')[0]);

  expect(getSuggestionList()).toBeNull();
  expect(input.value).toBe('');
});

test('the category chip shows only the selected label and keeps a native select overlay', () => {
  render(
    <AddItems
      onSave={() => {}}
      storesList={[{ desc: 'A very long supermarket name that would stretch the chip' }]}
      userName='Test'
    />
  );

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'app' } });
  fireEvent.click(screen.getAllByRole('listitem')[0]);

  const chips = document.body.querySelectorAll('.add-items-select-chip');
  expect(chips.length).toBe(2);

  const categoryChip = chips[0];
  const select = categoryChip.querySelector('select');
  const value = categoryChip.querySelector('.add-items-select-value');

  // the visible label mirrors the current option (that is what sizes the chip)
  expect(value.textContent).toBe(select.options[select.selectedIndex].text);

  fireEvent.change(select, { target: { value: 'dairy' } });
  expect(value.textContent).toBe(select.options[select.selectedIndex].text);
  expect(select.options[select.selectedIndex].text).not.toBe('');
});
