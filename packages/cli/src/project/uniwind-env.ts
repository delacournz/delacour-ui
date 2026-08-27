/**
 * The one line that makes `className` a real prop in TypeScript.
 *
 * Uniwind augments React Native's types through a global `/// <reference>`, and
 * a declaration file is only loaded if it is part of the program — either
 * matched by `tsconfig`'s `include` or reachable by import. This file is neither
 * importable nor, in a shared package, inside the app's `include`, which is why
 * the app needs a copy of its own.
 *
 * Kept here rather than inlined so `init` and `doctor` agree on the contents.
 */
export const UNIWIND_ENV_FILENAME = "uniwind-env.d.ts";

export const UNIWIND_ENV_REFERENCE = '/// <reference types="uniwind/types" />';
