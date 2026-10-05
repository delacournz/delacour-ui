# OVL-P0 — Overlay foundation (`overlay/`)

Built by the category lead in the category branch **before** any child is spawned. Children
consume it; they do not change it except where their spec says so.

`import { Overlay, OverlayProvider, useOverlayPresence } from "@delacour/react-native-ui/overlay";`

## Purpose

The shared layer under every overlay: one teleport portal provider for the whole app, a z-order
that sits above open bottom sheets, a scrim, a presence lifecycle that keeps an overlay mounted
through its exit animation, and an Android back button that closes only the topmost overlay.

## Public API

```tsx
/** Mount once, inside DelacourProvider, around BottomSheetProvider and the navigator. `Overlay` is the same component. */
<OverlayProvider>{children}</OverlayProvider>

type OverlayLayer = "modal" | "anchored" | "toast";

type OverlayPortalProps = {
	/** Which band of the z-order this overlay draws in. */
	layer: OverlayLayer;
	children: ReactNode;
	/** Registry id; pass the same id to useOverlayBackHandler. Defaults to useId(). */
	id?: string;
	/** Render where written instead of teleporting. Default false. */
	isInline?: boolean;
	/** Teleport host. Default "root" — the host OverlayProvider's teleport provider mounts. */
	hostName?: string;
};
<Overlay.Portal layer="modal">…</Overlay.Portal>

type OverlayScrimProps = Omit<PressableProps, "style" | "children"> & {
	/** 0 → 1 presence progress from useOverlayPresence; the scrim's opacity follows it. */
	progress: SharedValue<number>;
	/** Called on a tap. Omit and the scrim takes the touch but does nothing (non-dismissible). */
	onDismiss?: () => void;
	className?: string;
};
<Overlay.Scrim progress={progress} onDismiss={close} />

type OverlayPresence = {
	/** Keep the overlay mounted while true — true from open until the exit animation ends. */
	isPresent: boolean;
	/** 0 closed → 1 open, animated on the UI thread. Drive opacity / transforms from it. */
	progress: SharedValue<number>;
	/** Whether reduce motion is on: transforms should collapse to a fade. */
	isReduced: boolean;
};
function useOverlayPresence(options: {
	isOpen: boolean;
	/** Override durations, ms. Defaults OVERLAY_MOTION. */
	enterMs?: number;
	exitMs?: number;
	onEntered?: () => void;
	onExited?: () => void;
}): OverlayPresence;

/** Subscribes to Android's back button only while this overlay is the topmost back-capturing one. */
function useOverlayBackHandler(options: { id: string; isEnabled: boolean; onBack: () => void }): void;

/** True inside an OverlayProvider. */
function useOptionalOverlay(): OverlayContextValue | null;
```

## Files

| File | What |
| --- | --- |
| `index.ts` | → `@delacour/react-native-ui/overlay` |
| `overlay.tsx` | `Overlay` (alias `OverlayProvider`) — the root, `displayName` `DelacourUI.Overlay`, `Object.assign` of `Portal`, `Scrim`: teleport `PortalProvider` (skipped when one is already provided), registry provider, context |
| `overlay-portal.tsx` | `Overlay.Portal` — registers on mount, teleports to `"root"` inside an absolute-fill, `box-none` wrapper carrying the registry's `zIndex` |
| `overlay-scrim.tsx` | `Overlay.Scrim` — `Animated` absolute fill, `bg-overlay`, opacity = progress; not accessible |
| `overlay.context.tsx` | **Leaf.** `OverlayContext`, `TeleportProvidedContext`, `useOptionalOverlay`, `useIsTeleportProvided` — imported across folders by `bottom-sheet` |
| `overlay-registry.ts` | **Pure.** `reduceOverlayRegistry`, `zIndexOfOverlay`, `isTopOverlay`, `OVERLAY_LAYER_BASE` |
| `overlay-registry.test.ts` | z stamping per layer, re-open brings forward, close of unknown id is identity, top among back-capturing layers only |
| `overlay-presence.ts` | **Pure.** `reducePresence` — `closed → entering → open → exiting → closed`, re-open during exit, close during enter |
| `overlay-presence.test.ts` | every transition |
| `use-overlay-presence.ts` | the hook — `withTiming` on `progress`, `scheduleOnRN` to finish the exit |
| `use-overlay-back-handler.ts` | the hook — `BackHandler` subscription gated on `isTopOverlay` |
| `overlay.variants.ts` | **Pure.** `overlayVariants` (`scrim` slot), `OVERLAY_MOTION`, `OVERLAY_SCRIM_TOKEN` |
| `overlay.variants.test.ts` | tokens exist in both themes, motion constants finite and ordered |
| `AGENTS.md` | the folder doc |

## Z-order

`OVERLAY_LAYER_BASE = { modal: 1000, anchored: 2000, toast: 3000 }`. The bottom-sheet engine's
registry stamps sheets from 1 upward, so every overlay draws above every sheet in the shared
`"root"` host; within a layer the later open draws on top. Toasts draw above everything, including
a dialog. A sheet opened *from* a dialog draws under it — documented, and the reason a sheet is
not opened from a dialog.

`isTopOverlay` considers `modal` and `anchored` only — a toast never captures the back button.
React Native calls the most recently added `BackHandler` listener first, so a dialog over a sheet
handles back before the sheet does.

## Bottom-sheet integration (part of P0)

- **Engine** (`packages/react-native-bottom-sheet/src/portal/bottom-sheet-provider.tsx`):
  `BottomSheetProvider` gains `hasPortalProvider?: boolean` (default `false`). When `true` it
  skips teleport's `PortalProvider` and mounts only the registry and host-name context. Patch
  changeset on `@delacour/react-native-bottom-sheet`. The portal `AGENTS.md` documents it.
- **Skin** (`react-native-ui/src/components/bottom-sheet/`): `BottomSheetProvider` stops being a
  bare re-export and becomes `bottom-sheet-provider.tsx`, which reads `useIsTeleportProvided()`
  from `../overlay/overlay.context` (a leaf — rule 3) and passes it through. Mount order is then
  `DelacourProvider → OverlayProvider → BottomSheetProvider → navigator`, and either provider
  alone still works.
- **Playground** `_layout.tsx` mounts `OverlayProvider` in that order.

## Motion

`OVERLAY_MOTION = { enterMs: 220, exitMs: 160 }`, `Easing.out(Easing.cubic)` in,
`Easing.in(Easing.cubic)` out. Under `useReducedMotion()` the hook still animates `progress` (a
fade is fine under reduce motion) but reports `isReduced` so the component drops its scale and
translate. `isMotionCalm` does not change overlay motion: it is behaviour and finite.

## A11y

The scrim is `accessible={false}` and `importantForAccessibility="no"`. The portal wrapper is
`box-none` so an overlay with no scrim (toast, tooltip) never blocks the app underneath.

## Pure logic to unit-test (first)

`reduceOverlayRegistry`, `zIndexOfOverlay`, `isTopOverlay`, `reducePresence`, `overlayVariants`,
`OVERLAY_MOTION`.

## Playground & docs

No gallery route — like `DelacourProvider`, the foundation has nothing to show on its own; the
Dialog / Drawer / Popover galleries are its harness. `apps/web/content/docs/native/components/overlay.mdx`
documents the provider mount order (under `---Utilities---`, beside `provider`). Registry
`ITEM_META.overlay`, category `overlays`, dependency `react-native-teleport`.

## Acceptance

- [ ] `bun test` green, including `docs.test.ts` and `display-name.test.ts` for the new folder.
- [ ] `bun run typecheck` and `bun run check` green.
- [ ] Playground boots with `OverlayProvider` + `BottomSheetProvider`; an existing bottom sheet
      still teleports over the navigator (one `"root"` host).
- [ ] `bun run gen-exports`; `registry:build` committed.
- [ ] Changesets: `@delacour/react-native-ui` minor, `@delacour/react-native-bottom-sheet` patch.
