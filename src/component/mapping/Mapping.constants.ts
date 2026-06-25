export const CF_IGNORE_ATTR = 'data-cf-ignore';

export const imageTags = new Set(['img', 'picture']);

export const textTags = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'footer',
  'blockquote',
  'ol',
  'ul',
  'a',
];

export const textTagsSet = new Set(textTags);
export const mappingTagsSet: Set<string> = new Set([
  ...textTags,
  'recipe',
  'container',
]);

export const textAllowedAttributes: Record<string, Array<string>> = {
  a: ['href', 'target', 'rel'],
};

for (const tag of textTags) {
  let attributes = ['id', 'role', 'style', 'class'];
  const allowedAttributes = textAllowedAttributes[tag] || [];
  if (allowedAttributes.length) {
    attributes = attributes.concat(allowedAttributes);
  }
  textAllowedAttributes[tag] = attributes;
}

export const allowedTags = [
  // Structure
  'p',
  'blockquote',
  'footer',
  'ol',
  'ul',
  'li',
  // Headings
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Inline
  'a',
  'strong',
  'b',
  'em',
  'i',
  'br',
  'sup',
  'sub',
  'del',
  's',
  'small',
  'span',
  'u',
];

export const textAllowedTags = [
  ...new Set([
    'strong',
    'b',
    'em',
    'i',
    'a',
    'ul',
    'ol',
    'li',
    'br',
    'sup',
    'sub',
    'del',
    's',
    'p',
    'span',
    'small',
  ]),
];

export const allowedCaptionTags = ['b', 'strong', 'em', 'i'];
export const allowedFigcaptionTags = ['span', ...allowedCaptionTags];

export const htmlTableAllowedTags = [
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'em',
  'i',
  'b',
  'strong',
  'sup',
  'sub',
  'span',
  'br',
  'small',
  's',
  'a',
];
