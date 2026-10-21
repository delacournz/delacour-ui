# QRCode

A string a camera can read, drawn as one vector path, optionally with a logo in the middle.
Compound root plus `QRCode.Logo`, sitting on a pure, in-house encoder (`encodeQr`) that any other
renderer can use.

`import { QRCode, encodeQr } from "@delacour/react-native-ui/qr-code";`

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/qr-code` (+ `encodeQr`, `useQRCode`, tuples, types) |
| `qr-code.tsx` | Root: finds the `Logo`, plans the encode, pixel-snaps, draws the tile and the path, `Object.assign` |
| `qr-code-logo.tsx` | `QRCode.Logo`: the centred mark on a tile-coloured plate |
| `qr-code.context.tsx` | `QRCodeContext`, `useQRCodeContext()`, `useQRCodePart()` — the Logo's frame and colour |
| `qr-code.types.ts` | `QRCodeProps`, `QRCodeLogoProps` |
| `use-qr-code.ts` | `useQRCode(value, options)` — `encodeQr`, memoised, for a custom renderer |
| `qr-code.warn.ts` | One development warning per message |
| `qr-code.constants.ts` | The encoder's vocabulary: levels, masks, `QrMatrix`, `QrEncodeError`, `QrEncodeResult` |
| `qr-code.tables.ts` | EC codewords per block and block counts (4 levels x 40 versions), alphanumeric charset, closed forms |
| `qr-code.gf.ts` | GF(256) over 0x11D, `gfMultiply`, `rsGeneratorPolynomial`, `rsRemainder` |
| `qr-code.format.ts` | BCH(15,5) format word, BCH(18,6) version word, their placement |
| `qr-code.matrix.ts` | Function patterns, the reserved map, the zigzag that places data and builds `owner` |
| `qr-code.mask.ts` | The eight masks, the four penalty rules, `chooseMask` |
| `qr-code.encode.ts` | Mode choice, bit stream, version choice, blocks + interleave, `encodeQr` |
| `qr-code.logo.ts` | `resolveLogoRegion`, `fitLogoToEcc`, `planQrCode` |
| `qr-code.path.ts` | `buildQrPath` for the three module styles, `resolveRenderScale` |
| `qr-code.variants.ts` | Slotted `tv()`, sizes, label, level, contrast guard, `resolveQrWarnings` |
| `qr-code.test-helpers.ts` | **Test-only** reverse reader: format word → unmask → zigzag → de-interleave → syndromes → Reed–Solomon correction → decode |
| `qr-code.fixtures.ts` | **Test-only** golden matrices from an independent encoder |
| `qr-code.*.test.ts` | One per module: `gf`, `tables`, `format`, `matrix`, `mask`, `encode`, `logo`, `path`, `variants` |

Every `qr-code.*.ts` imports nothing from React or React Native, so the whole
encoder and the path builder are unit-testable. Only `qr-code.tsx`, `qr-code-logo.tsx`, `qr-code.context.tsx` and
`use-qr-code.ts` touch React. The registry ships `*.test-helpers.ts` and `*.fixtures.ts` with the
tests, in the item's `tests` — copied only by `delacour add qr-code --tests`.

## Design

- **The tile is literal dark-on-light in both themes.** This is the one place the token rule
  (rule 11) yields on purpose: a QR code is read by someone else's camera, and light modules on a
  dark tile fail a large share of scanners. `QR_DEFAULT_COLORS` is `#000000` on `#ffffff`, passed
  through `useThemeColor` (which hands literals straight through) and never as a class. A caller
  may pass tokens or literals; the code does not follow the theme unless they make it.
- **The encoder is ours, with zero dependencies.** The registry copies source into other
  people's repositories; a QR package would land in their `package.json` for some 650 lines of
  arithmetic, need a `PACKAGE_INSTALL` classification, and — for the popular ones — bring Node
  `Buffer` assumptions Metro polyfills badly. A logo also needs the codeword-owner map (`owner`)
  that off-the-shelf encoders do not expose.
- **Scope is bounded.** One segment per code (`selectMode`: all digits → numeric, all in the
  45-character set → alphanumeric, else UTF-8 byte), versions 1–40, levels L/M/Q/H. No Kanji, no
  ECI, no multi-segment optimisation, no Micro QR, no structured append.
- **One `<Path>`, not one view per module.** A version-10 code has 3 249 modules; a `View` each is
  a layout pass over thousands of nodes. The path is in module units with a `viewBox`, and `d` is
  memoised so a re-render with the same matrix does no work.
- **A wrong code fails loudly, never quietly.** Empty, too long and impossible options are
  `{ ok: false }` results; `onEncodeError` gets them and the tile renders empty with the label
  "QR code unavailable". Nothing throws.
- **`QrEncodeResult` is local, not `@delacour/types`' `Result`.** That package is private; the
  registry cannot assume it in a consumer's repo.

## Rendering

- **Modules are snapped to whole device pixels.** `resolveRenderScale(size, units, pixelRatio)`
  returns the largest per-module size that is a whole number of device pixels and an offset that
  centres the code on a device pixel. Fractional module edges are where hairline seams between
  abutting runs come from; the cost is a margin under one module, inside the tile.
- **`size` is the tile, quiet zone included.** Named sizes are 128 / 192 / 256 dp; a number is dp
  and never becomes a class (a runtime `w-[${n}px]` is never compiled).
- **`square` merges runs both ways** — horizontal runs, then identical runs on consecutive rows into
  one taller rect — so `d` stays short.
- **`rounded` rounds a corner only where neither orthogonal neighbour is dark**, so runs fuse into
  one liquid shape and an isolated module becomes a pill.
- **`dots` uses radius 0.42, never 0.5**, so neighbours do not touch and each module reads as a dot.
- **Finders are always a 7 x 7 ring and a 3 x 3 core** in `rounded` and `dots` (ring radius 1.75,
  core radius 1). A finder made of dots is one a decoder cannot lock onto.
- **No motion.** Moving modules mid-scan breaks the scan, and a transform blurs module edges at
  the pixel level. A caller who wants a fade wraps the tile in an opacity-only `Animated.View`.
  There is no `useCalmMotion` consumer, no gesture and no haptic.

## Logo

- **A logo is damage the code must correct.** Its presence forces level H
  (`resolveEffectiveEcc`); a lower explicit level is raised and warns, because a lower level with
  a hole in it is a code that does not scan.
- **The root finds `QRCode.Logo` before encoding**, by identity or by `displayName` (the dev bundle
  can wrap a type and break identity). It must be a direct child.
- **`fitLogoToEcc` keeps every block within budget.** It maps each cleared module to its codeword
  through `owner`, each codeword to its block through the interleave, and allows a block at most
  half of what it can correct (`floor(ecPerBlock / 2) * 0.5`) — the rest is left for real damage.
  Too big: it first grows the version, then shrinks the logo toward 0.1, and failing both drops the
  logo and warns. Version 1 at H with a 0.2 logo grows to version 2; the test pins it.
- **The cleared region never touches a finder, timing line, format strip or version block**
  (`regionClearsNoReservedModules`). It may cover the centre alignment pattern, as every
  logo-bearing code does.
- **The plate is one module wider than the mark on every side**, filled with the tile colour, so
  the mark never butts against a module.
- **The logo is decoration for assistive tech** (`no-hide-descendants`); the root's label names the
  code.

## Accessibility

- **`accessibilityRole="image"`** on the tile. It is not a control; a screen reader should not offer
  to activate it. An author who wants tap-to-copy wraps it in `Pressable`.
- **The label** is the caller's, else `"QR code: " + value` cut at 60 characters with an ellipsis,
  so a 500-character URL is not read character by character.
- **`isDecorative`** hides the code entirely, for when its value is printed beside it.
- **A value with no label and not decorative warns in development**: a URL means something to a
  sighted user and nothing to a screen reader unless the caller says what it is for.

## Development warnings

`resolveQrWarnings` is pure and tested; the root sends each message once through `warnQrOnce`:
a level raised for a logo, a dropped logo, a quiet zone under 2, an inverted or sub-3:1 colour
pair (an unparseable colour such as `oklch()` skips the check rather than guessing), and a missing
label.

## Verified against the standard

The spec's vectors were written from memory, and three were wrong:

- **BCH(15,5) has minimum distance 7, not 8.** The format-word test asserts 7; the version-word
  code (BCH(18,6)) does reach 8.
- **Mask 6 at (1, 1) is dark and mask 7 at (1, 1) is light**, by the standard's formulas.

The golden matrices in the test fixtures were generated once, offline, from an independent
encoder run from a throwaway script outside the repo — it is not a dependency. They cover numeric,
alphanumeric and byte modes, version 7 (version word) and 14, and a full 40-L symbol. The round-trip
test reads 192 generated payloads back through the reverse reader and requires zero syndromes and an
exact decode at every level across versions 1, 2, 6, 7, 14, 21, 32 and 40.

## Axes

| Prop | Values | Default |
| --- | --- | --- |
| `errorCorrection` | `QR_ERROR_CORRECTIONS` — `L` `M` `Q` `H` | `M`; `H` with a logo |
| `moduleStyle` | `QR_MODULE_STYLES` — `square` `rounded` `dots` | `square` |
| `size` | `QR_SIZES` — `sm` `md` `lg`, or dp | `md` (192) |
| `quietZone` | modules | 4 |
| `logoSize` | 0.1–0.3 of the side | 0.2 |
| `color` / `backgroundColor` | token or literal | `#000000` / `#ffffff` |
