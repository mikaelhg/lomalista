import { afterEach, expect } from '@rstest/core';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup, configure, getRoles } from '@testing-library/react';
import { computeAccessibleName } from 'dom-accessibility-api';

expect.extend(matchers);
afterEach(cleanup);

const MAX_ROLE_LINES = 40;
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

// A failed query normally appends the whole page's HTML to the error, and "role not found" errors
// also list every element's HTML; both are long and mostly class names. Keep the message and list
// the page's named or interactive roles instead: that is what queries match against.
configure({
  getElementError(message, container) {
    // Without a message, Testing Library wants one matching element described ("found multiple")
    if (!message && container instanceof Element) {
      return new Error(`  <${container.tagName.toLowerCase()}> "${computeAccessibleName(container)}"`);
    }
    // findBy* passes an error that was already formatted here back in when it times out
    if (message?.includes(ROLES_HEADING)) return new Error(message);
    const summary = (message ?? '').split('\n\nHere are the accessible roles:')[0];
    const roles = container instanceof HTMLElement ? getRoles(container) : {};
    const lines = Object.entries(roles).flatMap(([role, els]) =>
      els
        .map((el) => ({ role, name: computeAccessibleName(el) }))
        .filter(({ role, name }) => name || INTERACTIVE.has(role))
        .map(({ role, name }) => `  ${role} "${name}"`),
    );
    const shown = lines.slice(0, MAX_ROLE_LINES);
    if (lines.length > shown.length) shown.push(`  … ${lines.length - shown.length} more`);
    const error = new Error([summary, '', ROLES_HEADING, ...shown].join('\n'));
    error.name = 'TestingLibraryElementError';
    return error;
  },
});
