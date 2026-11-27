export interface GameTextSegment {
  readonly text: string;
  readonly emphasis: boolean | 'primary';
}

/** Interpret the text markers published in item descriptions. */
export function formatGameText({
  text,
}: {
  readonly text: string;
}): readonly GameTextSegment[] {
  const normalized = text.replace(/\\r\\n|\\n|\\r|\r\n|[\r\n]/gu, ' ');
  const segments: GameTextSegment[] = [];
  let emphasis = false;
  let pending = '';

  const append = (value: string) => {
    pending += value;
  };
  const flush = () => {
    if (pending) segments.push({ text: pending, emphasis });
    pending = '';
  };

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (character !== '#') {
      append(character ?? '');
      continue;
    }
    const code = normalized[index + 1];
    if (
      code === 'c' ||
      code === 'b' ||
      code === 'r' ||
      code === 'd' ||
      code === 'g' ||
      code === 'e'
    ) {
      flush();
      emphasis = true;
      index += 1;
    } else if (code === 'k' || code === 'n') {
      flush();
      emphasis = false;
      index += 1;
    } else if (!emphasis && code !== undefined && /[a-z]/iu.test(code)) {
      // An unknown code outside emphasis is dropped.
      index += 1;
    } else if (emphasis) {
      // Inside emphasis any other # closes it; the next character is text.
      flush();
      emphasis = false;
    }
  }
  flush();

  const collapsed: GameTextSegment[] = [];
  let needsSpace = false;
  for (const segment of segments) {
    const words = segment.text.replace(/\s+/gu, ' ').trim();
    if (words) {
      let previous = collapsed.at(-1);
      if (previous && needsSpace) {
        previous = { ...previous, text: `${previous.text} ` };
        collapsed[collapsed.length - 1] = previous;
      }
      const value = `${previous && !needsSpace && /^\s/u.test(segment.text) ? ' ' : ''}${words}`;
      if (previous?.emphasis === segment.emphasis) {
        collapsed[collapsed.length - 1] = {
          ...previous,
          text: previous.text + value,
        };
      } else {
        collapsed.push({ text: value, emphasis: segment.emphasis });
      }
    }
    needsSpace = /\s$/u.test(segment.text);
  }
  return collapsed;
}
