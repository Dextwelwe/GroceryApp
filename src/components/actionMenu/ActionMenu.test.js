/* eslint-disable testing-library/no-node-access */
import { useRef, useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionMenu from './ActionMenu';

function Harness({ items, onClose }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);

  return (
    <div>
      <button type='button' ref={buttonRef} onClick={() => setOpen(prev => !prev)}>more</button>
      <ActionMenu
        open={open}
        onClose={() => { setOpen(false); onClose && onClose(); }}
        anchorRef={buttonRef}
        items={items}
        label='Options'
      />
    </div>
  );
}

const twoItems = (handler) => [
  { key: 'edit', label: 'Edit', icon: <span>e</span>, onSelect: handler },
  { key: 'delete', label: 'Delete', tone: 'danger', onSelect: handler },
];

test('stays hidden until the trigger is used', () => {
  render(<Harness items={twoItems(jest.fn())} />);

  expect(screen.queryByRole('menu')).toBeNull();
  expect(screen.queryByRole('menuitem')).toBeNull();
});

test('is portaled to the body and anchored under the trigger', () => {
  render(<Harness items={twoItems(jest.fn())} />);

  fireEvent.click(screen.getByRole('button', { name: 'more' }));

  const menu = screen.getByRole('menu');
  // rendered outside the component tree so no scroll container can clip it
  expect(menu.parentElement).toBe(document.body);
  expect(menu.getAttribute('aria-label')).toBe('Options');
  expect(menu.style.position).toBe('fixed');
  expect(menu.style.width).toBe('200px');
  // jsdom measures the trigger at 0,0 -> docked to the viewport margins
  expect(menu.style.top).toBe('6px');
  expect(menu.style.left).toBe('8px');
  expect(screen.getAllByRole('menuitem').map(node => node.textContent)).toEqual(['eEdit', 'Delete']);
});

test('selecting an entry fires it and closes the menu', () => {
  const handler = jest.fn();
  const onClose = jest.fn();
  render(<Harness items={twoItems(handler)} onClose={onClose} />);

  fireEvent.click(screen.getByRole('button', { name: 'more' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

  expect(handler).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalled();
  expect(screen.queryByRole('menu')).toBeNull();
});

test('closes on escape, outside press, scroll and resize', () => {
  render(<Harness items={twoItems(jest.fn())} />);
  const trigger = screen.getByRole('button', { name: 'more' });

  fireEvent.click(trigger);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();

  fireEvent.click(trigger);
  fireEvent.mouseDown(document.body);
  expect(screen.queryByRole('menu')).toBeNull();

  fireEvent.click(trigger);
  fireEvent.scroll(window);
  expect(screen.queryByRole('menu')).toBeNull();

  fireEvent.click(trigger);
  fireEvent(window, new Event('resize'));
  expect(screen.queryByRole('menu')).toBeNull();
});

test('pressing inside the menu or the trigger keeps it open', () => {
  render(<Harness items={twoItems(jest.fn())} />);
  const trigger = screen.getByRole('button', { name: 'more' });

  fireEvent.click(trigger);
  fireEvent.mouseDown(trigger);
  expect(screen.getByRole('menu')).toBeTruthy();

  fireEvent.mouseDown(screen.getByRole('menu'));
  expect(screen.getByRole('menu')).toBeTruthy();
});

test('opens upwards when there is no room below the trigger', () => {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function () {
    return {
      top: 700, bottom: 746, left: 10, right: 300, width: 290, height: 46, x: 10, y: 700,
      toJSON() { return this; },
    };
  };

  try {
    render(<Harness items={twoItems(jest.fn())} />);
    fireEvent.click(screen.getByRole('button', { name: 'more' }));

    const menu = screen.getByRole('menu');
    expect(menu.style.bottom).toBe(`${window.innerHeight - 700 + 6}px`);
    expect(menu.style.top).not.toMatch(/px$/);
    // right edge lines up with the trigger (rect.right 300 - menu width 200)
    expect(menu.style.left).toBe('100px');
  } finally {
    Element.prototype.getBoundingClientRect = original;
  }
});

test('supports custom rows such as the language picker', () => {
  render(
    <Harness
      items={[
        { key: 'logout', label: 'Logout', tone: 'danger', onSelect: jest.fn() },
        { key: 'language', node: <span>language picker</span> },
      ]}
    />
  );

  fireEvent.click(screen.getByRole('button', { name: 'more' }));

  const menu = screen.getByRole('menu');
  expect(menu.textContent).toContain('language picker');
  expect(screen.getAllByRole('menuitem')).toHaveLength(1);
});
