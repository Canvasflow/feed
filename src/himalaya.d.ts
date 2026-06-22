// Ambient type declarations for himalaya, which ships without TypeScript types.
// himalaya parses an HTML string into a JSON AST and serializes it back; both
// ends use the same node shape modeled by our own Node type.
declare module 'himalaya' {
  export function parse(html: string): import('./component/Node').Node[];
  export function stringify(nodes: import('./component/Node').Node[]): string;
}
