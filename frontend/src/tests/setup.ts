import { afterEach, expect } from '@rstest/core';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, configure, getRoles } from '@testing-library/react';
import { computeAccessibleName } from 'dom-accessibility-api';

expect.extend(matchers);
afterEach(cleanup);

const MAX_ROLE_LINES = 40;
/** Runs at least this long of same-role elements with same-shaped numbered names (calendar days) are collapsed. */
const MIN_COLLAPSED_RUN = 5;
const ROLES_HEADING = 'Named or interactive roles on the page:';
/** Roles worth listing even without a name: an unlabelled control is a common cause of failed queries. */
const INTERACTIVE = new Set([
  'button',
  'link',
  'textbox',
  'checkbox',
  'radio',
  'combobox',
  'spinbutton',
  'dialog',
  'alertdialog',
]);
/** Attributes that tell apart elements with the same role and name, e.g. a visible and a hidden button. */
const DISTINGUISHING = [
  'slot',
  'tabindex',
  'hidden',
  'aria-hidden',
  'disabled',
  'aria-disabled',
  'aria-selected',
];

function describeElement(el: Element): string {
  const attrs = DISTINGUISHING.filter((a) => el.hasAttribute(a)).map((a) => {
    const v = el.getAttribute(a);
    return v ? `${a}="${v}"` : a;
  });
  return `  <${[el.tagName.toLowerCase(), ...attrs].join(' ')}> "${computeAccessibleName(el)}"`;
}

/** A name's pattern with words and numbers blanked out: "Monday, 31 May 2027" → "a, # a #". */
const shape = (name: string) => name.replace(/\p{L}+/gu, 'a').replace(/\d+/g, '#');

/**
 * One line per element, with long runs of numbered names of the same shape (like calendar days)
 * collapsed into one. Runs of different shapes, such as week labels then vacation bars, stay apart.
 */
function roleLines(role: string, names: string[]): string[] {
  const lines: string[] = [];
  for (let i = 0; i < names.length; ) {
    const s = shape(names[i]);
    let j = i;
    while (j < names.length && s.includes('#') && shape(names[j]) === s) j++;
    if (j - i >= MIN_COLLAPSED_RUN) {
      lines.push(`  ${role} "${names[i]}" … "${names[j - 1]}" (${j - i})`);
      i = j;
    } else {
      lines.push(`  ${role} "${names[i]}"`);
      i++;
    }
  }
  return lines;
}

// A failed query normally appends the whole page's HTML to the error, and "role not found" errors
// also list every element's HTML; both are long and mostly class names. Keep the message and list
// the page's named or interactive roles instead: that is what queries match against.
function getElementError(message: string | null, container: Element | null): Error {
  let text: string;
  if (!message && container) {
    // Without a message, Testing Library wants one matching element described ("found multiple")
    text = describeElement(container);
  } else if (message?.includes(ROLES_HEADING)) {
    // findBy* passes an error that was already formatted here back in when it times out
    text = message;
  } else {
    const summary = (message ?? '').split('\n\nHere are the accessible roles:')[0];
    const roles = container instanceof HTMLElement ? getRoles(container) : {};
    const lines = Object.entries(roles).flatMap(([role, els]) =>
      roleLines(
        role,
        els.map((el) => computeAccessibleName(el)).filter((name) => name || INTERACTIVE.has(role)),
      ),
    );
    const shown = lines.slice(0, MAX_ROLE_LINES);
    if (lines.length > shown.length) shown.push(`  … ${lines.length - shown.length} more`);
    text = [summary, '', ROLES_HEADING, ...shown].join('\n');
  }
  const error = new Error(text);
  error.name = 'TestingLibraryElementError';
  // Start the stack at the caller, so the reported code frame is the test rather than this file
  Error.captureStackTrace?.(error, getElementError);
  return error;
}

configure({ getElementError });
