// TypeScript 6 checks side-effect imports by default, and `_layout.tsx`'s
// `import "../styles/global.css"` has no declaration — Metro and Uniwind
// resolve it, `tsc` cannot. One ambient module keeps the check on for
// everything else.
declare module "*.css";
