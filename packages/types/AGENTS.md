# @delacour/types — Shared Utility Types

Types and helpers that more than one package needs. Small on purpose.

## Files

| File | What it holds |
| --- | --- |
| `src/index.ts` | `export * from "./result"` — the package's whole surface |
| `src/result.ts` | `Result` and its constructors |

Entry point is `main: "./src/index.ts"` — raw TypeScript, no build step, the
same trade `native-ui` makes. Consumers bundle it.

## Result

A discriminated union on `success`, which is the repo's standard shape for an
operation that can fail:

```ts
type SuccessResult<Success> = { success: true; data: Success };
type ErrorResult<Error = string> = { success: false; error: Error };
type Result<Success, Error = string> = SuccessResult<Success> | ErrorResult<Error>;
type AsyncResult<Success, Error = string> = Promise<Result<Success, Error>>;
```

- **The discriminant is `success`, not the presence of `data`.** Narrowing on a
  boolean literal is what makes `if (!r.success) return r.error;` typecheck
  without a cast — testing for `data` would leave `error` reachable in the
  success branch.
- **`ok(data)` and `err(error)` are the constructors.** `err` takes `unknown`
  and flattens it: an `Error` becomes its `message`, anything else its `String()`.
  So a `catch (e)` block hands its value straight in without the caller
  re-deriving what kind of thrown thing it caught.
- **`Error` defaults to `string`.** A caller wanting a typed failure supplies the
  second parameter; most do not, and a union of error codes is worth introducing
  only where something branches on it.
- **`AsyncResult<T>` is `Promise<Result<T>>`**, spelled out so an async signature
  reads as one type rather than two nested ones.

## Adding a type

It belongs here only if **two or more packages** need it. A type with one
consumer stays in that consumer — the same rule `native-ui` applies to its
`{name}.types.ts` files, and for the same reason: a shared file that accumulates
single-use types becomes a place to look rather than a thing to use.

`src/index.ts` re-exports whole modules (`export * from "./x"`), so a new module
is one line there.

## Commands

```bash
bun run check              # biome
bun run typecheck          # tsc --noEmit
```

There are no tests. `ok` and `err` are three lines each and the types are the
assertion; if a helper here ever grows a branch worth checking, colocate
`result.test.ts` beside it.
