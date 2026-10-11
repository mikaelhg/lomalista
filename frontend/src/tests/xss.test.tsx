import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { Timeline } from '../components/Timeline';
import type { Doc } from '../lib/api';
import { nameError } from '../lib/validation';

const PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '"><svg/onload=alert(1)>',
  "'; DROP TABLE people;--",
  'javascript:alert(1)',
  '{{7*7}}',
  'a"b',
  "a'b",
  'a​b',
  'a‮b',
  '＜script＞',
  'Z͓͑͒',
  'a\0b',
  '😀',
];

describe('name validation (XSS)', () => {
  it('rejects hostile names', () => {
    for (const p of PAYLOADS) expect(nameError(p), JSON.stringify(p)).not.toBeNull();
  });
});

describe('name validation (Unicode)', () => {
  it('rejects look-alikes and non-ASCII separators', () => {
    for (const n of [
      '\u0430nna',
      'Ann\u03b1',
      '\uFF21nna',
      '\uFB01na',
      'Anna\u00A0B',
      'Anna\u2010B',
      '\u0131da',
    ]) {
      expect(nameError(n), JSON.stringify(n)).toBe('name_chars');
    }
  });
  it('normalises to NFC before counting and matching', () => {
    expect(nameError('a\u030A'.repeat(15))).toBeNull();
    expect(nameError('\u212Bsa')).toBeNull(); // Angstrom sign normalises to Å
    expect(nameError('\u00E5'.repeat(16))).toBe('name_too_long');
  });
});

describe('rendering escapes hostile data', () => {
  // Defence in depth: even if a hostile name reached the client (e.g. a tampered database),
  // React must render it as text and attribute values, never as markup.
  const doc: Doc = {
    season_start: '2027-06-01',
    season_end: '2027-06-30',
    archived: false,
    people: PAYLOADS.map((name, i) => ({
      id: i + 1,
      name,
      vacations: [{ id: i + 1, start: '2027-06-02', end: '2027-06-05' }],
    })),
  };

  it('timeline never emits raw markup from names', () => {
    const html = renderToStaticMarkup(<Timeline doc={doc} mine={new Set()} />);
    // only the component's own tags may appear: any injected element would add a new tag name
    const tags = new Set([...html.matchAll(/<\/?([a-z][a-z0-9-]*)/gi)].map((m) => m[1].toLowerCase()));
    expect([...tags].sort()).toEqual(['div', 'span']);
    // no event-handler attributes outside quoted attribute values
    const tagSources = html.replace(/"[^"]*"/g, '""').match(/<[^>]*>/g) ?? [];
    for (const tag of tagSources) expect(tag).not.toMatch(/\son\w+=/i);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    // quotes inside the title attribute are escaped, so they cannot close it
    expect(html).toContain('&quot;&gt;&lt;svg/onload=alert(1)&gt;');
  });
});

describe('source hygiene', () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) files.push(p);
    }
  };
  walk(join(import.meta.dirname, '..'));

  it('has source files to scan', () => expect(files.length).toBeGreaterThan(5));

  it.each([
    ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
    ['innerHTML / outerHTML', /\.(inner|outer)HTML/],
    ['insertAdjacentHTML', /insertAdjacentHTML/],
    ['document.write', /document\.write/],
    ['eval / new Function', /\beval\(|new Function\(/],
    ['javascript: URLs', /javascript:/],
    ['href built from data', /href=\{(?!["'])/],
  ])('does not use %s', (_label, re) => {
    const hits = files.filter((f) => re.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });
});
