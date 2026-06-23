// Ambient type declarations for himalaya, which ships without TypeScript types.
// himalaya parses an HTML string into a JSON AST and serializes it back; both
// ends use the same node shape modeled by our own Node type.
declare module 'himalaya' {
  /** Parse an HTML string into a JSON AST of nodes. */
  export function parse(html: string): import('./component/node/Node').Node[];
  /** Serialize a node AST back into an HTML string. */
  export function stringify(
    nodes: import('./component/node/Node').Node[]
  ): string;
}
