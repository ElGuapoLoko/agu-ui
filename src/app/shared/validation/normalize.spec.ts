import { normalizeMultiLine, normalizeSingleLine, normalizeUsername } from './normalize';

describe('normalize', () => {
  describe('normalizeSingleLine', () => {
    const cases: [unknown, string][] = [
      ['  Comprar   café  ', 'Comprar café'],
      ['linha 1\nlinha 2', 'linha 1 linha 2'],
      ['a\u0000b\u0007c', 'a b c'],
      ['   ', ''],
      [null, ''],
      [undefined, ''],
      [123, '123'],
      ['Ação 😀', 'Ação 😀'],
    ];

    cases.forEach(([input, expected]) => {
      it(`normalizes ${JSON.stringify(input)}`, () => {
        expect(normalizeSingleLine(input)).toBe(expected);
      });
    });
  });

  describe('normalizeMultiLine', () => {
    it('keeps line breaks and trims each line', () => {
      expect(normalizeMultiLine('  a  \r\n\r\n  b  ')).toBe('a\n\nb');
    });

    it('collapses spaces and removes control characters', () => {
      expect(normalizeMultiLine('a    b\u0000c')).toBe('a b c');
    });

    it('returns an empty string for blank input', () => {
      expect(normalizeMultiLine(' \n \r\n ')).toBe('');
    });
  });

  it('normalizes usernames to trimmed lowercase', () => {
    expect(normalizeUsername('  Ana.Silva ')).toBe('ana.silva');
  });
});
