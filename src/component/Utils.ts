import { parseHTML } from 'linkedom';

export function splitParagraphImages(html: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = parseHTML(html) as any;

  // Always treat content as a fragment (RSS-safe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root: any =
    parsed.fragment ??
    parsed.document ??
    (() => {
      throw new Error('Unable to parse HTML snippet');
    })();

  const paragraphs = Array.from(root.querySelectorAll('p'));

  for (const paragraph of paragraphs) {
    const p = paragraph as Element;
    const parent = p.parentNode;
    if (!parent) continue;

    const children = Array.from(p.childNodes);
    let buffer: ChildNode[] = [];

    // Extract original attributes once
    const originalAttrs = Array.from(p.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));

    const createNewP = () => {
      const newP = root.createElement('p');
      // copy attributes
      for (const { name, value } of originalAttrs) {
        newP.setAttribute(name, value);
      }
      return newP;
    };

    const flushBuffer = () => {
      if (buffer.length === 0) return;
      const newP = createNewP();
      for (const node of buffer) {
        newP.appendChild(node);
      }
      parent.insertBefore(newP, p);
      buffer = [];
    };

    for (const node of children) {
      const isImg =
        node.nodeType === node.ELEMENT_NODE &&
        (node as Element).tagName.toLowerCase() === 'img';

      if (isImg) {
        flushBuffer();
        parent.insertBefore(node, p); // move the img out
      } else {
        buffer.push(node);
      }
    }

    flushBuffer();
    parent.removeChild(p);
  }

  return root.toString().trim();
}
