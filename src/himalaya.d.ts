// Ambient type declarations for himalaya@1.1.1, which ships without TypeScript
// types. himalaya parses an HTML string into a JSON AST and serializes it back;
// both ends use the same node shape modeled by our own Node type.
//
// WARNING: himalaya is pinned to exactly 1.1.1 in package.json because this
// shim was written against that release. Do not upgrade himalaya without
// auditing every declaration below against the new release's actual API and
// node shape — a silent mismatch here will not produce a compile error.
declare module 'himalaya' {
  /** Parse an HTML string into a JSON AST of nodes. */
  export function parse(html: string): import('./component/node/Node').Node[];
  /** Serialize a node AST back into an HTML string. */
  export function stringify(
    nodes: import('./component/node/Node').Node[]
  ): string;
}
