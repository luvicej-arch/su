export function countText(text) {
  return { withSpaces: Array.from(text.replace(/[\r\n\t\f\v\u2028\u2029]/gu, '')).length,
    withoutSpaces: Array.from(text.replace(/\s/gu, '')).length };
}
export function extractText(items) {
  return items.filter(item => typeof item.str === 'string').map(item => item.str + (item.hasEOL ? '\n' : '')).join('');
}
