# QRCode — design spec

A string a camera can read, drawn as one vector path, optionally with a logo in the middle.
`QRCode` root plus `QRCode.Logo`, and a pure encoder (`encodeQr`) the component sits on.
Folder `src/components/qr-code/`.

`import { QRCode, encodeQr } from "@delacour/react-native-ui/qr-code";`

## 1. Purpose on mobile

- **A QR code is an artefact for someone else's camera, not for this app's theme.** Dark-mode
  inversion (light modules on a dark tile) fails on a large share of scanners. The default tile is
  pinned to dark-on-light in both themes, and an inverted pair warns in development. This is the
  one place the token vocabulary yields to physics, and it says so.
- **The encoder is ours, with zero dependencies.** The registry copies source into someone else's
  repo; every npm package added is a package that lands in their `package.json` for a 400-line
  algorithm. Decision in section 9.
- **One `<Path>`, not one view per module.** A version-10 code has 3 249 modules. A `View` per
  module is a layout pass over thousands of nodes; one `d` string is a single Skia-free draw call
  through `react-native-svg`, which is already a hard peer.
- **A wrong code must fail loudly and early.** Too-long input, an empty value, a logo that eats
  more error-correction than the level has: each is a pure-function result, never a code that
  looks right and does not scan.
- **Scanning is the acceptance test.** Unit tests prove the bits; the checklist proves a phone
  camera reads the pixels.

## 2. Public API

```ts
export const QR_ERROR_CORRECTIONS = ["L", "M", "Q", "H"] as const;
export type QrErrorCorrection = (typeof QR_ERROR_CORRECTIONS)[number]; // ~7% / 15% / 25% / 30%

export const QR_MODULE_STYLES = ["square", "rounded", "dots"] as const;
export type QrModuleStyle = (typeof QR_MODULE_STYLES)[number];

export const QR_SIZES = ["sm", "md", "lg"] as const; // 128 / 192 / 256 dp
export type QrSize = (typeof QR_SIZES)[number];

export type QrMask = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type QrVersion = number; // 1..40, validated at runtime

/** The encoder's input and output: plain data, no React. */
export type QrEncodeOptions = {
  errorCorrection?: QrErrorCorrection; // default "M"
  minVersion?: QrVersion;              // default 1
  maxVersion?: QrVersion;              // default 40
  mask?: QrMask | "auto";              // default "auto" (lowest penalty)
  /** Grow the ECC level for free when the version's capacity allows it. Default false. */
  boostEcc?: boolean;
};

export type QrMode = "numeric" | "alphanumeric" | "byte";

export type QrMatrix = {
  version: QrVersion;
  errorCorrection: QrErrorCorrection;
  mask: QrMask;
  mode: QrMode;
  size: number;                    // modules per side = 17 + 4 * version
  /** Row-major, 1 = dark, length size * size. */
  modules: Uint8Array;
  /** Row-major; -1 for a function module, else the codeword (data then EC, interleaved order) that owns it. */
  owner: Int16Array;
};

export type QrEncodeError =
  | { kind: "empty" }
  | { kind: "too-long"; bytes: number; capacity: number; errorCorrection: QrErrorCorrection }
  | { kind: "invalid-option"; option: "minVersion" | "maxVersion" | "mask"; value: number };

/** Discriminated result, local to the folder: the registry cannot assume `@delacour/types`. */
export type QrEncodeResult = { ok: true; matrix: QrMatrix } | { ok: false; error: QrEncodeError };

export function encodeQr(value: string, options?: QrEncodeOptions): QrEncodeResult;

export type QRCodeProps = {
  /** The string to encode. UTF-8 bytes unless it is all digits / all QR-alphanumeric. */
  value: string;
  errorCorrection?: QrErrorCorrection; // default "M"; raised to "H" when a Logo is present
  moduleStyle?: QrModuleStyle;         // default "square"
  size?: QrSize | number;              // default "md"; a number is dp, the tile's side
  /** Quiet-zone width in modules. Default 4 (the spec's minimum); below 2 warns. */
  quietZone?: number;
  mask?: QrMask | "auto";
  minVersion?: QrVersion;
  /** Module colour: a theme token or a literal. Default is pinned black — see 4. */
  color?: string;
  /** Tile colour: a theme token or a literal. Default is pinned white. */
  backgroundColor?: string;
  /** Fraction of the code's side the Logo may occupy, 0.1–0.3. Default 0.2. Only meaningful with a Logo. */
  logoSize?: number;
  /** Names the code to assistive tech. Default: "QR code: <value>", truncated. */
  accessibilityLabel?: string;
  /** Hide from assistive tech (the value is shown as text beside it). */
  isDecorative?: boolean;
  onEncodeError?: (error: QrEncodeError) => void;
  className?: string; // the tile: corner, margin. Its fill is `backgroundColor`, never a class
  testID?: string;
  children?: ReactNode; // QRCode.Logo only
};

export type QRCodeLogoProps = { className?: string; children: ReactNode }; // the centred mark
export function useQRCode(value: string, options?: QrEncodeOptions): QrEncodeResult; // memoised
```

- **Compound surface**: `Object.assign(QRCodeRoot, { Logo })`. `Logo` is detected by a child
  partition in the root (Chart's pattern), because the root must know *before* encoding that a
  logo exists to raise the correction level and reserve the centre.
- **`errorCorrection` + Logo**: effective level is `resolveEffectiveEcc(requested, hasLogo)` — `"H"`
  whenever a logo is present. A lower explicit level with a logo warns once in development
  (it is raised, not obeyed: a lower level with a hole punched in it is a code that does not scan).
- **Numbers vs named size**: `size` accepts `QrSize | number`; a numeric size is `dp`, never a
  class (a runtime `w-[${n}px]` is never compiled). The tile is `size` square including the quiet zone.

## 3. File map

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/qr-code` (+ `encodeQr`, tuples, types) |
| `qr-code.tsx` | Root: child partition, encode, effective level, colours, `Object.assign` |
| `qr-code-logo.tsx` | `QRCode.Logo`: centred, tile-coloured plate, rounded |
| `qr-code.context.tsx` | `QRCodeContext`, `useQRCode`-adjacent `useQRCodePart()` (logo reads region + colours) |
| `qr-code.types.ts` | Prop types shared by the root and `Logo` |
| `qr-code.variants.ts` | Slotted `tv()` for the tile, size table, label/colour/logo resolvers — no RN imports |
| `qr-code.variants.test.ts` | |
| `qr-code.path.ts` | `buildQrPath` and its three module-style builders, `resolveRenderScale` — pure, no RN imports |
| `qr-code.path.test.ts` | |
| `qr-code.encode.ts` | `encodeQr`: mode choice, bit stream, segmentation, version/ECC choice, orchestration |
| `qr-code.tables.ts` | Capacity tables: EC codewords per block and block counts for 4 levels x 40 versions, alphanumeric charset, format/version constants |
| `qr-code.gf.ts` | GF(256) log/antilog tables over 0x11D, `gfMultiply`, `rsGeneratorPolynomial`, `rsRemainder` |
| `qr-code.matrix.ts` | Function-pattern placement, reserved-area map, zigzag data placement (builds `owner`), alignment positions |
| `qr-code.mask.ts` | Eight mask predicates, `applyMask`, the four penalty rules, `scorePenalty`, `chooseMask` |
| `qr-code.format.ts` | BCH(15,5) format word, BCH(18,6) version word, their placement |
| `qr-code.logo.ts` | `resolveLogoRegion`, `countAffectedCodewords`, `fitLogoToEcc` — pure |
| `qr-code.test-helpers.ts` | **Test-only** reverse reader (unmask → codewords → syndrome check). Not exported, not in the registry (`*.test-helpers.ts` excluded) |
| `qr-code.fixtures.ts` | **Test-only** golden matrices as ASCII; excluded from the registry |
| `qr-code.*.test.ts` | One per module above (`gf`, `tables`, `matrix`, `mask`, `format`, `encode`, `logo`, `path`, `variants`) |
| `AGENTS.md` | Design decisions; Components-table row |

Every `qr-code.*.ts` imports nothing from React or React Native, so `bun test` reaches the whole
encoder and the path builder. Only `qr-code.tsx`, `qr-code-logo.tsx` and `qr-code.context.tsx` render.

## 4. Variants & sizes

- **`moduleStyle`**
  - `square`: horizontal runs merged, vertically-identical runs merged again into taller rects;
    `shapeRendering="crispEdges"`.
  - `rounded`: each dark module with corner radius `0.5` only on corners with **no** dark
    orthogonal neighbours — blobs fuse into liquid shapes, isolated modules become pills. One path.
  - `dots`: a circle of radius `0.42` per data module (never full 0.5, so neighbours do not touch
    and the module reads as a dot); alignment patterns drawn as dots too.
  - **Finder patterns are always drawn as the three concentric shapes** (7x7 ring, gap, 3x3 core) —
    square in `square`, ring corner radius `1.75` and core radius `1` in `rounded`/`dots`. A finder
    made of dots is a finder a decoder cannot lock onto.
- **`size`**: `sm` 128, `md` 192, `lg` 256 dp. The tile is this wide; the quiet zone is *inside* it.
  `resolveRenderScale(size, moduleCount + 2 * quietZone, pixelRatio)` returns the largest
  per-module dp that is a **whole number of device pixels**, and the drawn code is centred in the
  tile. Fractional module edges are where hairline seams between abutting runs come from; this
  eliminates them, and the cost is a margin of at most one module.
- **Colours**: `color` default `#000000`, `backgroundColor` default `#ffffff`, both literals. The
  tile and path colours are plain strings through `useThemeColor` (which passes literals
  through) — never a class, because a QR is not allowed to follow the theme. The pair is exported
  as `QR_DEFAULT_COLORS`.
- **Contrast guard**: `contrastRatio(color, background)` and `isInvertedQr`. Below 3:1, or modules
  lighter than the tile, warn once in development. Unparseable (an `oklch()` token string) skips the
  check rather than guessing.
- **Corner**: `rounded-lg` on the tile through `className`, `overflow-hidden`; the tile's own
  padding is zero because the quiet zone is a real part of the code.
- **Logo plate**: the logo sits on a `backgroundColor` plate `rounded-lg`, one module larger than
  the logo on each side so the cleared area has a margin of tile colour.

## 5. States

| State | Behaviour |
| --- | --- |
| encoded | Tile + path (+ Logo) |
| empty value | `{ kind: "empty" }` -> `onEncodeError`; tile renders with nothing drawn and label "QR code unavailable" |
| too long | `{ kind: "too-long" }` -> `onEncodeError`; same empty tile; the error carries bytes and capacity so the caller can show a message |
| logo too big for the level | `fitLogoToEcc` first raises `minVersion`, then shrinks `logoSize` to the 0.1 floor, then drops the logo's cleared area and warns — the code stays scannable |
| inverted / low contrast | renders as asked, warns in development |
| value changes | New matrix on the next render; no animation. Memoised on `(value, ecc, minVersion, mask, hasLogo, logoSize)` |
| unmeasured | Not applicable: size is explicit, no `onLayout` |

No press/disabled states: it is not interactive. An author who wants "tap to copy" wraps it in
`Pressable`.

## 6. Accessibility

- **`accessibilityRole="image"`, `accessible`**, on the tile. An image is the correct role: it is
  not a control, and a screen reader should not offer to activate it.
- **`accessibilityLabel`**: the caller's wins outright. Otherwise
  `resolveQrLabel(value)` -> `"QR code: " + value`, truncated to 60 characters plus an ellipsis, so a
  500-character URL is not read character by character. For an encode error: "QR code unavailable".
- **`isDecorative`** -> `accessible={false}` and `importantForAccessibility="no-hide-descendants"`,
  for the case where the value is printed next to it (a Wi-Fi password under the code).
- **The Logo is decoration** for assistive tech: `importantForAccessibility="no"`; the author's
  label on the root names the thing.
- **A development warning** fires for a code with a non-trivial value, no label, and not decorative:
  a URL is meaningful to a sighted user and opaque to a screen reader unless the caller says what
  it is for.
- Contrast: the pinned pair is 21:1. Colour choices are the caller's, with the guard above.

## 7. Motion

None. **A QR code does not animate**: motion shifts modules mid-scan, and a transform on the tile
can blur at the pixel level. The Logo, the tile and the path are static; there is no
`useCalmMotion` consumer, no haptic, no gesture. Re-encoding on `value` change is instant. If a
caller wants a fade-in they wrap the tile in their own `Animated.View` with opacity only — a
transform or scale changes the module edge grid and is documented as a scanning hazard.

(`react-native-svg` 15 draws a `<Path>` with a single `d`; building `d` is memoised so a re-render
with the same matrix does no work. Encoding a version-40 byte payload on the JS thread takes tens of
milliseconds; the docs recommend a stable `value` and warn against encoding inside a list row's
render without `useMemo` upstream. A worker/UI-thread encode is explicitly out of scope.)

## 8. Reuses

- `react-native-svg` (`Svg`, `Path`, `Rect`) — a hard peer already; `Svg` is **not** wrapped with
  `withUniwind` (rule 7), the tile `View` carries the className.
- `useThemeColor` (literal passthrough, `lib/color.ts`'s `isLiteralColor`) for both colours.
- `lib/cn`, `lib/tv`; `Text` is not used (no text). `Surface`'s `rounded-lg` step by class only.
- No `Pressable`, no gesture handler, no Reanimated.

## 9. Dependencies

**Decision: in-house encoder, byte/alphanumeric/numeric, versions 1-40, ECC L/M/Q/H, zero new
dependencies.**

Why in-house and why it is not "unreasonably large":
- Size, honestly: tables ~120 lines (two 4x41 integer tables, charset), GF + RS ~60, matrix
  placement ~140, mask + penalty ~110, format/version ~40, encode orchestration ~130, logo ~60.
  About **650 lines of plain TypeScript**, almost all of it pure arithmetic over `Uint8Array`.
- Testability: every module is reachable from `bun test`, with spec vectors and an independent
  reverse-reader. A dependency would be a black box the registry copies into other people's repos.
- Dependency cost: a pure-JS QR package would be a runtime dependency of a copy-source library —
  `PACKAGE_INSTALL` classification, a version for every consumer, supply-chain review, and (for the
  popular ones) Node `Buffer`/`stream` assumptions Metro polyfills badly. The registry builder
  throws on an unclassified import; we would be adding a decision to avoid writing arithmetic.
- Control: logo support needs the codeword-owner map (`owner`) and mask/penalty control, which
  off-the-shelf encoders do not expose.

Scope to keep it bounded:
- **Single segment per code** (`selectMode(value)`: all digits -> numeric; all in the 45-char set ->
  alphanumeric; else byte). No multi-segment optimisation, no Kanji, no ECI header, no FNC1,
  no Micro QR, no structured append. UTF-8 for byte mode.
- **No `any`.** All tables `readonly (readonly number[])[]` with a `const` assertion; indexing
  is guarded with `noUncheckedIndexedAccess`-safe helpers.

Registry:
- `ITEM_META["qr-code"]`: `{ title: "QRCode", description: "A string a camera can read, drawn as one vector path, with an optional centre logo.", categories: ["display"] }`.
- `dependencies`: none to add; the scan sees `react-native-svg`, already `"expo"` in `PACKAGE_INSTALL`.
- The registry builder must **exclude** `*.test.ts`, `qr-code.test-helpers.ts` and
  `qr-code.fixtures.ts` from the copied files (check the builder's existing test-file exclusion
  and extend it if the helper suffix is not covered; name them `*.test.ts`-adjacent accordingly).
- Peers: unchanged. `react-native-svg` is `>=15` and required.

## 10. Sibling / cross-category dependencies

- **Siblings (compare, flip-card): none.** Independent branch, no wave order.
- **Cross-category**: depends only on `react-native-svg` (existing). Gaps and scoping:
  - **No `Image` primitive for the logo**: `QRCode.Logo` takes children; the author passes an
    `Image` or an `Icon`. Not solved here.
  - **No Result type in the registry's import closure**: the folder defines its own
    `QrEncodeResult`; do not import `@delacour/types` (it is private, not published).
  - **Scanner verification tooling**: no QR *decoder* exists in the repo. Section 14 states how to
    check (decode a screenshot with an offline tool, else manual) without adding a dependency.
  - Pinned light tile colours are literals, not tokens: a deliberate, documented departure from
    rule 11 (the tokens are theme-dependent, the artefact is not).

## 11. Pure logic to unit-test (TDD)

Write each module's test first. Test files import only their module + fixtures.

**`qr-code.gf.ts`**
```ts
gfMultiply(a: number, b: number): number
// (2, 128) -> 29 (256 ^ 0x11D); (3, 7) -> 9; (0, x) -> 0; (1, x) -> x; commutative over all 256x256
gfExp(i: number): number; gfLog(x: number): number
// exp[0]=1, exp[1]=2, exp[8]=29, exp[255]=1 (cycle length 255); log[2]=1, log[29]=8; log is the inverse of exp for 1..255
rsGeneratorPolynomial(degree: number): readonly number[]
// degree 7 (alpha exponents): 0 87 229 146 149 238 102 21
// degree 10: 0 251 67 46 61 118 70 64 94 32 45
// degree 13: 0 74 152 176 100 86 100 106 104 130 218 206 140 78
// monic, length degree+1, and every alpha^0..alpha^(degree-1) is a root (evaluate to 0)
rsRemainder(data: readonly number[], degree: number): number[]
// "HELLO WORLD" 1-M data [32,91,11,120,209,114,220,77,67,64,236,17,236,17,236,17], 10 -> [196,35,39,119,235,215,231,226,93,23]
// ISO example "01234567" 1-M data [16,32,12,86,97,128,236,17,236,17,236,17,236,17,236,17], 10 -> [165,36,212,193,237,54,199,135,44,85]
// all-zero data -> all-zero remainder; data ++ remainder has zero syndromes
```

**`qr-code.tables.ts`**
```ts
totalCodewords(version): number            // 1 -> 26, 2 -> 44, 7 -> 196, 40 -> 3706
dataCodewords(version, ecc): number         // 1-L 19, 1-M 16, 1-Q 13, 1-H 9; 40-L 2956, 40-H 1276
blockLayout(version, ecc): { blocks: number; ecPerBlock: number; short: { count: number; data: number }; long: { count: number; data: number } }
// 5-Q: 4 blocks, ecPerBlock 18, short {count 2, data 15}, long {count 2, data 16}
byteCapacity(version, ecc): number          // 1-L 17, 1-M 14, 1-Q 11, 1-H 7, 10-M 213, 40-L 2953, 40-M 2331, 40-Q 1663, 40-H 1273
// invariants for every version/level: blocks * ecPerBlock + dataCodewords === totalCodewords;
// totalCodewords equals floor(rawDataModules(version) / 8) from the closed-form module count
// (catches any table typo); remainderBits(version) in {0, 3, 4, 7}
alignmentPositions(version): number[]
// 1 -> []; 2 -> [6,18]; 7 -> [6,22,38]; 32 -> [6,34,60,86,112,138]; 40 -> [6,30,58,86,114,142,170]
```

**`qr-code.encode.ts`**
```ts
selectMode(value: string): QrMode            // "0123" numeric; "HELLO WORLD" alphanumeric; "hello" byte; "" handled earlier
characterCountBits(mode, version): number    // byte: 8 (v1-9), 16 (v10-40); numeric 10/12/14; alphanumeric 9/11/13
encodeBitStream(value, mode, version, ecc): number[]  // data codewords incl. terminator + 0xEC/0x11 pad
// "01234567" 1-M -> [16,32,12,86,97,128,236,17,...] (16 codewords)
// "HELLO WORLD" 1-M -> [32,91,11,120,209,114,220,77,67,64,236,17,236,17,236,17]; 1-Q -> 13 codewords ending 236
// byte "A" (0x41) 1-L -> [64,20,16,236,17,...]; UTF-8: "é" is 2 bytes, "€" 3, an emoji 4
selectVersion(value, ecc, min, max): { ok: true; version } | { ok: false; capacity }
// "HELLO WORLD" 1-M -> 1; 15 bytes 1-M -> 2; 14 bytes 1-M -> 1; 2953 bytes 1-L -> 40; 2954 -> too-long
interleave(blocksData, blocksEc): number[]  // 5-Q interleaves long blocks' last byte after the short ones
encodeQr(value, opts)                        // empty -> {kind:"empty"}; opts.mask out of 0..7 -> invalid-option
// result.matrix.size === 17 + 4 * version; deterministic (same input -> identical modules)
// golden: "HELLO WORLD" 1-Q auto mask === fixtures.helloWorld1Q; "https://delacour.co.nz" M; 40-L max payload
```

**`qr-code.format.ts`**
```ts
formatWord(ecc, mask): number               // 15-bit, already XOR 0x5412
// M0 101010000010010; M1 101000100100101; M2 101111001111100; M3 101101101001011; M4 100010111111001; M5 100000011001110; M6 100111110010111; M7 100101010100000
// L0 111011111000100; Q0 011010101011111; H0 001011010001001
// property: pairwise Hamming distance of all 32 words >= 8 (BCH(15,5) minimum distance)
versionWord(version): number | null          // null for v1-6; 7 000111110010010100; 8 001000010110111100; 40 101000110001101001
// property: Hamming distance between any two version words >= 8; remainder of (word) mod 0x1F25 === 0
```

**`qr-code.matrix.ts`**
```ts
buildFunctionMap(version): { size: number; isFunction: Uint8Array }
// v1: 21 x 21; finder 8x8 regions (incl. separators) at three corners, timing row/col 6, dark module at (4v+9, 8), format areas reserved
// count of data modules === rawDataModules(version) (v1 -> 208, v2 -> 359, v7 -> 1568, v40 -> 29648)
placeData(codewords, version): { modules: Uint8Array; owner: Int16Array }
// first codeword's MSB lands bottom-right (20,20) on v1; skips column 6 (timing); zigzag direction flips each column pair
// every non-function module has owner >= 0; owner covers 0..totalCodewords-1; remainder bits owner -1 treated as light
```

**`qr-code.mask.ts`**
```ts
maskPredicate(mask: QrMask, row: number, col: number): boolean
// 0: (r+c)%2==0; 1: r%2==0; 2: c%3==0; 3: (r+c)%3==0; 4: (floor(r/2)+floor(c/3))%2==0;
// 5: (r*c)%2+(r*c)%3==0; 6: ((r*c)%2+(r*c)%3)%2==0; 7: ((r+c)%2+(r*c)%3)%2==0
applyMask(modules, isFunction, size, mask): Uint8Array   // involution: apply twice -> original; never flips a function module
penaltyRule1(modules, size): number   // run of 5 same-colour -> 3; 6 -> 4; per row and per column; (3 + (len - 5))
penaltyRule2(modules, size): number   // each 2x2 same-colour block -> 3; a solid 3x3 -> 4 blocks -> 12
penaltyRule3(modules, size): number   // each 1:1:3:1:1 dark-light-dark pattern with 4 light on either side -> 40
penaltyRule4(modules, size): number   // 10 * floor(|dark% - 50| / 5): 50% -> 0; 100% -> 100; 45% -> 10
chooseMask(matrixBuilder, ecc): QrMask  // lowest total; ties -> lowest mask index (determinism)
```

**`qr-code.logo.ts`**
```ts
resolveLogoRegion(size: number, fraction: number): { start: number; side: number }
// centred; side has the same parity as size so it is symmetric; 21 @ 0.2 -> side 5 (start 8); clamps fraction to [0.1, 0.3]
countAffectedCodewords(owner: Int16Array, size: number, region): number
// codewords owning at least one cleared module; function modules never counted
fitLogoToEcc(opts): { version: number; fraction: number; clearsLogo: boolean }
// affected <= floor(ecCodewords / 2) * 0.5 (a 50% margin); too big -> raise version, then shrink to 0.1, then clearsLogo=false
// H-level 21x21 with 0.2 fails (needs v>=4?) — pin whichever the implementation computes with a regression test
regionClearsNoReservedModules(version, region): boolean  // never clears finders, timing, format or version areas
```

**`qr-code.path.ts` / `qr-code.variants.ts`**
```ts
buildQrPath(matrix: QrMatrix, style: QrModuleStyle, quietZone: number, clear?: LogoRegion): string
// 2x2 all dark, square, quietZone 0 -> "M0 0h2v2h-2z"  (runs merged both ways)
// L-shaped 3 modules -> two rects; gap in a row -> two runs; clear region omits those modules
// rounded: isolated module -> pill path with four arcs; neighbour present removes that corner's arc
// dots: n circles for n data modules; finder 7x7 ring present in every style
// path never contains NaN/undefined; d length scales ~ linearly with dark runs
resolveRenderScale(size: number, units: number, pixelRatio: number): { moduleDp: number; offset: number }
// (192, 29, 3) -> moduleDp 6.333.. -> floor(192*3/29)/3 = 6.333; drawn = moduleDp*29 <= 192; offset centres
resolveEffectiveEcc(requested, hasLogo): QrErrorCorrection   // hasLogo -> "H"; otherwise unchanged
resolveQrLabel(value: string, custom?: string): string        // custom wins; 500-char URL -> "QR code: " + 60 chars + "..."; "" -> "QR code unavailable"
contrastRatio(a: string, b: string): number | null            // #000 vs #fff -> 21; same -> 1; "oklch(...)" -> null
isInvertedQr(color: string, background: string): boolean | null
resolveQrSize(size: QrSize | number): number                  // "sm" 128; "md" 192; "lg" 256; 200 -> 200; NaN/<=0 -> 192
```

**Cross-cutting tests**
- **Round-trip property test** (`qr-code.encode.test.ts` with `qr-code.test-helpers.ts`): for 200
  generated payloads across all four levels and a spread of versions (1, 2, 6, 7, 14, 21, 32, 40),
  the reader unmasks using the format word it reads off the matrix, recovers the codewords by the
  same zigzag, and asserts **every block has zero syndromes** and the data portion decodes back to
  the input. This is a real correctness check independent of the golden matrices.
- **Golden matrices**: committed ASCII fixtures generated *once* offline by running an independent
  encoder (any well-known library, kept in a throwaway script outside the repo, not committed and
  not a dependency) for: "HELLO WORLD" 1-Q, "01234567" 1-M, "https://delacour.co.nz" M, a 7-version
  payload (exercises version info), a 14-version payload, and 40-L maximum. Compare full matrices;
  a failing golden prints a row-diff.
- **Determinism**: identical input yields byte-identical `modules` across runs; `mask: "auto"`
  equals the explicit mask it picked.
- **Display-name sweep** is the package-wide `display-name.test.ts`; nothing extra needed.

## 12. Playground demos

`apps/playground/src/demos/qr-code/`, ordered `index.ts` via `defineDemoGroup("qr-code", …)`.
`testID`s: `qr-code`. All values are fixed strings (deterministic captures).

| File | What it shows | Capture |
| --- | --- | --- |
| `anatomy.tsx` | A URL at `md`, `M`, `square`, in a hairlined tile | `hero` |
| `module-styles.tsx` | `QR_MODULE_STYLES.map` — square / rounded / dots side by side | capture |
| `with-logo.tsx` | `QRCode.Logo` with a Central Icon; correction raised to H; `logoSize` | capture |
| `error-correction.tsx` | `QR_ERROR_CORRECTIONS.map`, the same value at four levels (density visibly differs) | capture |
| `colours.tsx` | Pinned default vs a brand colour pair that stays dark-on-light; includes the inverted-warning case in the note, not drawn | capture |
| `sizes.tsx` | `sm` / `md` / `lg` and a numeric size | gallery only |
| `wifi-share.tsx` | A realistic `WIFI:T:WPA;S:Delacour;P:…;;` payload with the value as text beside it (`isDecorative`) | gallery only |
| `too-long.tsx` | `onEncodeError` with a 4 000-byte value, rendering a message beside the empty tile | gallery only |
| `dark-theme.tsx` | The tile stays light in dark theme | gallery only |

Five captured, one hero. Labels via `Record<QrModuleStyle, string>` etc. Route
`(components)/qr-code.tsx` -> `<DemoGallery demos={qrCodeDemos} title="QRCode" />`; row in
`src/app/index.tsx`; `bun run gen-demos`. All stills (no `flow`): a QR code has no interaction.

## 13. Docs page

`apps/web/content/docs/native/components/qr-code.mdx`:

1. `<Preview id="qr-code/anatomy" title={null} />`
2. **Installation** — `<ComponentInstall name="qr-code" />`; no extra packages beyond `react-native-svg`.
3. **Usage** — `<QRCode value="https://…" accessibilityLabel="…" />`.
4. **Module styles** — three previews; the finder-pattern note.
5. **Error correction** — what L/M/Q/H trade (density vs damage tolerance) with a table of byte
   capacities at a few versions.
6. **A logo in the middle** — `QRCode.Logo`, the auto-H rule, `logoSize`, the callout that the
   code may grow a version to keep the logo recoverable.
7. **Colours** — why the tile does not follow the theme; the contrast guard; "never invert".
8. **Using the encoder directly** — `encodeQr` and `QrMatrix` for a custom renderer (e.g. Skia).
9. **Errors** — `onEncodeError`, the two error kinds.
10. **Accessibility** — role image, label rules, `isDecorative`.
11. **Printing and size** — minimum 2x2 cm print guidance, quiet zone, pixel-snapping.
12. **API Reference** — Anatomy; `TypeTable` for `QRCode`, `QRCode.Logo`, `QrEncodeOptions`,
    `QrMatrix`, `QrEncodeError`.

`meta.json`: add `"qr-code"` under `---Data Display---` (after `kpi`), or the media section if
created.

## 14. Acceptance checklist

- [ ] Each `qr-code.*.test.ts` written first, failing, then passing (`bun test src/components/qr-code`), in dependency order: gf -> tables -> format -> matrix -> mask -> encode -> logo -> path -> variants
- [ ] `tables` closed-form invariant passes for **all** 160 version/level pairs (typo net)
- [ ] Round-trip / zero-syndrome property test passes for every level and the listed versions
- [ ] Golden matrices match the independent encoder's output (generated offline, not a dependency)
- [ ] `bun run typecheck` clean; no `any`; `QrEncodeResult` and `QrEncodeError` are discriminated unions
- [ ] `bun run check` clean; no comments in JSX; `qr-code.*.ts` import no React/RN
- [ ] `AGENTS.md` + Components-table row (`docs.test.ts`)
- [ ] `displayName`: `DelacourUI.QRCode`, `DelacourUI.QRCode.Logo`, context provider (`display-name.test.ts`)
- [ ] `bun run gen-exports` (adds `./qr-code`)
- [ ] Demos + `bun run gen-demos`; exactly one `hero`; route file + `src/app/index.tsx` row
- [ ] Docs page + `meta.json`
- [ ] `ITEM_META["qr-code"]`; `bun run registry:build` passes and copies **no** test-helper/fixture files; no unknown package
- [ ] Changeset (`@delacour/react-native-ui`, minor)
- [ ] Simulator check via `warden claim ios|android` + `agent-device`: renders crisp at 1x/2x/3x pixel ratios with no hairline seams between runs (zoom a screenshot)
- [ ] **Scans**: for each of `square`, `rounded`, `dots`, with and without a logo, at ECC L and H: decode the simulator screenshot with an offline decoder if one is available on the machine (e.g. a CLI such as `zbarimg` or an OS image-based detector); otherwise **manual**: point a phone camera at the simulator and record the result in the PR. Include a worst-case: version-10+ payload, `dots`, logo at 0.3
- [ ] Dark theme: tile stays light, default colours unchanged
- [ ] Inverted colour pair warns in development; `oklch()` token skips the guard without throwing
- [ ] VoiceOver / TalkBack: reads "QR code: <value>" or the caller's label; `isDecorative` is skipped
- [ ] Too-long and empty values call `onEncodeError` and render an empty tile, never throw
