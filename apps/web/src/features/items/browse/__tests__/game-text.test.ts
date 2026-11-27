import { describe, expect, it } from 'vitest';

import { formatGameText } from '../game-text';

describe('formatGameText', () => {
  it.each(['c', 'b', 'r', 'd', 'g', 'e'])(
    'starts emphasis with #%s and ends it at the next #',
    (code) => {
      expect(formatGameText({ text: `Read #${code}bright# words` })).toEqual([
        { text: 'Read ', emphasis: false },
        { text: 'bright', emphasis: true },
        { text: ' words', emphasis: false },
      ]);
    },
  );

  it.each(['k', 'n'])('ends emphasis with #%s', (code) => {
    expect(formatGameText({ text: `#eBright#${code} words` })).toEqual([
      { text: 'Bright', emphasis: true },
      { text: ' words', emphasis: false },
    ]);
  });

  it('drops unknown codes and lone markers while keeping their text', () => {
    expect(formatGameText({ text: 'A #xword# and #zmore#' })).toEqual([
      { text: 'A word and more', emphasis: false },
    ]);
  });

  it('collapses literal line escapes, real newlines, and whitespace', () => {
    expect(
      formatGameText({
        text: '  One\\n  two\\r\\nthree\\rfour\r\nfive\nsix  ',
      }),
    ).toEqual([{ text: 'One two three four five six', emphasis: false }]);
  });

  it('keeps emphasis through the end when no closing marker is published', () => {
    expect(formatGameText({ text: 'A #cbright ending' })).toEqual([
      { text: 'A ', emphasis: false },
      { text: 'bright ending', emphasis: true },
    ]);
  });

  it('keeps a letter that follows a closing marker', () => {
    expect(formatGameText({ text: 'Wear the #cMossy Cap#s here' })).toEqual([
      { text: 'Wear the ', emphasis: false },
      { text: 'Mossy Cap', emphasis: true },
      { text: 's here', emphasis: false },
    ]);
  });
});
