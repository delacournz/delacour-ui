export const PRESSABLE_FEEDBACKS = ["scale", "fade", "scale-fade", "none"] as const;

export type PressableFeedback = (typeof PRESSABLE_FEEDBACKS)[number];

/** What a press interpolates towards. 1 is the neutral value on either axis. */
export type PressedState = {
	opacity: number;
	scale: number;
};

/**
 * How a press moves each axis, by name.
 *
 * `scale-fade` is composed from the two single-axis modes rather than given
 * numbers of its own, so tuning `scale` or `fade` carries through to it and the
 * name keeps describing what the mode does.
 *
 * There is no mode involving a ripple, ink or highlight overlay — AGENTS.md
 * rules those out for every pressable in this library.
 *
 * Free of React Native imports so it stays unit-testable — it must not
 * pull in React Native's Flow-typed source. See AGENTS.md.
 */
export const PRESSABLE_FEEDBACK: Record<PressableFeedback, PressedState> = {
	scale: { opacity: 1, scale: 0.97 },
	fade: { opacity: 0.6, scale: 1 },
	"scale-fade": { opacity: 0.6, scale: 0.97 },
	none: { opacity: 1, scale: 1 },
};

/**
 * The pair a pressable uses with no `feedback` and no explicit values.
 *
 * Deliberately not one of the named modes. It fades less than `fade` does, so
 * naming it would either change what a bare `Pressable` has always done or
 * force `scale-fade` to fade less than `fade` — and a caller who wants a named
 * mode can just say so.
 */
export const PRESSABLE_FEEDBACK_FALLBACK: PressedState = { opacity: 0.9, scale: 0.97 };

/**
 * Folds a named feedback and any explicit values into the pair a press
 * interpolates towards.
 *
 * An explicit `pressedScale` / `pressedOpacity` wins on its own axis and leaves
 * the other one to the named mode, so `feedback="scale-fade"` with
 * `pressedOpacity={0.2}` is a deeper fade at the mode's scale rather than an
 * all-or-nothing choice between the two APIs.
 *
 * Pure, so the whole matrix is unit-testable. See AGENTS.md.
 */
export function resolvePressedState(
	feedback: PressableFeedback | undefined,
	pressedScale: number | undefined,
	pressedOpacity: number | undefined
): PressedState {
	const named = feedback ? PRESSABLE_FEEDBACK[feedback] : PRESSABLE_FEEDBACK_FALLBACK;

	return {
		opacity: pressedOpacity ?? named.opacity,
		scale: pressedScale ?? named.scale,
	};
}

/**
 * The opacity a pressable rests at, read from what its `className` resolved to.
 *
 * The press feedback is an animated style, and an animated style owns every
 * key it writes on the view — so a resting `opacity: 1` overwrote a caller's
 * `opacity-50` and a disabled `Button`, `Badge` or `ListGroup.Item` never
 * faded. The press now multiplies this in rather than replacing it. Uniwind
 * types the value as animatable, so anything that is not a finite number is
 * treated as unset, and a number is clamped into `[0, 1]`.
 *
 * Pure, so the whole matrix is unit-testable. See AGENTS.md.
 */
export function resolveRestOpacity(resolved: unknown): number {
	if (typeof resolved !== "number" || !Number.isFinite(resolved)) return 1;
	return Math.min(1, Math.max(0, resolved));
}

/** The two keys of React Native's `AccessibilityState` this resolver decides. Structural, so no RN import. */
type GatedAccessibilityState = { busy?: boolean; disabled?: boolean };

/**
 * The accessibility state a pressable announces.
 *
 * The `busy` and `disabled` props gate the gesture, so a gated control is
 * always announced as gated: a caller's state can only add `true`, never
 * override the props with `false`. Adding is the point for `busy`. A control
 * whose work is running but which must stay tappable — a `Marker` whose step
 * is still running, and which expands that step — announces busy through
 * `accessibilityState` without the `busy` prop blocking the press. Before this
 * the prop's default `false` overwrote it.
 *
 * Every other key a caller passes (`expanded`, `selected`, `checked`) goes
 * through untouched.
 */
export function resolvePressableAccessibilityState<S extends GatedAccessibilityState>({
	accessibilityState,
	busy,
	disabled,
}: {
	accessibilityState?: S;
	busy: boolean;
	disabled: boolean;
}): S & { busy: boolean; disabled: boolean } {
	return {
		...(accessibilityState as S),
		busy: busy || accessibilityState?.busy === true,
		disabled: disabled || accessibilityState?.disabled === true,
	};
}

/**
 * Whether a pressable takes a press at all — the one guard the tap gesture, the
 * long press and screen-reader activation all go through, so a gated control
 * cannot be reached by one of them and not the others.
 */
export function isPressableInteractive({ busy, disabled }: { busy: boolean; disabled: boolean }): boolean {
	return !disabled && !busy;
}

/** The shape of an entry in React Native's `accessibilityActions`. Structural, so no RN import. */
type PressableAccessibilityAction = { name: string; label?: string };

export type PressableActivation<A extends PressableAccessibilityAction> = {
	/** What the view's `accessibilityActions` becomes — the caller's own, plus `activate` / `longpress` on Android. */
	accessibilityActions: ReadonlyArray<A | { name: "activate" } | { name: "longpress" }> | undefined;
	/** The pressable consumes `activate` in `onAccessibilityAction` and calls `onPress` itself. */
	routesActivate: boolean;
	/** The pressable consumes `longpress` in `onAccessibilityAction` and calls `onLongPress` itself. */
	routesLongPress: boolean;
	/** The pressable sets `onAccessibilityTap`, which is what VoiceOver's double-tap reaches. */
	wiresAccessibilityTap: boolean;
};

/**
 * How a screen reader's activation reaches `onPress`, and its long press
 * `onLongPress`.
 *
 * The press is a Gesture Handler tap, which only ever sees touches. Each
 * platform's activation is something else:
 *
 * - **iOS.** A VoiceOver double-tap calls `accessibilityActivate`, which React
 *   Native answers only when `onAccessibilityTap` is set. Without it UIKit falls
 *   back to synthesising a touch at the element's centre, which the gesture
 *   happens to recognise — so it worked, but by accident. Setting it makes the
 *   call return `YES`, which also stops UIKit synthesising the touch: one
 *   activation, one `onPress`. An `activate` entry in `accessibilityActions` is
 *   no use here: Fabric lists every entry as a rotor custom action, so it would
 *   add a literal "activate" to every button's rotor. The same is true of
 *   `longpress`, and VoiceOver needs none: double-tap-and-hold passes a held
 *   touch through to the view, which the long-press gesture recognises.
 * - **Android.** A TalkBack double-tap performs `ACTION_CLICK`, which React
 *   Native routes to `onAccessibilityAction` only when `activate` is listed.
 *   Without it the click falls to `View.performClick`, with no listener behind
 *   it. Double-tap-and-hold performs `ACTION_LONG_CLICK`, which reaches
 *   `onAccessibilityAction` only when `longpress` is listed and otherwise falls
 *   to an equally empty `View.performLongClick`. React Native ignores
 *   `onAccessibilityTap` on Android.
 *
 * A caller that lists `activate` itself owns it on both platforms — a
 * `NumberInput` stepper, a `Message`, a `FlipCard` — and the pressable wires
 * nothing for it, so the press cannot fire twice. `longpress` is owned the same
 * way, by `SelectionMode.Item` and `Attachment`. A caller's own
 * `onAccessibilityTap` wins too. With no handler there is nothing to reach.
 *
 * A pressable that is not an accessibility element (`isAccessible: false`) —
 * a field's row, an input group's box, a scrim — wires nothing on either
 * platform. Its press is a touch convenience; listing `activate` would make the
 * node clickable to TalkBack, which then stops on an unnamed button in front of
 * the control it wraps. A caller's own actions are left as they are.
 *
 * The `disabled` / `busy` guard is not decided here: activation stays wired on
 * a gated control and the handler goes through `invokePressableHandler`, so a
 * gated control's double-tap is consumed and does nothing rather than falling
 * back to a synthesised touch.
 */
export function resolvePressableActivation<A extends PressableAccessibilityAction>({
	accessibilityActions,
	hasAccessibilityTap,
	hasLongPress = false,
	hasPress,
	isAccessible = true,
	platform,
}: {
	accessibilityActions?: ReadonlyArray<A>;
	hasAccessibilityTap: boolean;
	hasLongPress?: boolean;
	hasPress: boolean;
	/** `false` when the pressable is not an accessibility element. Default `true`. */
	isAccessible?: boolean;
	platform: string;
}): PressableActivation<A> {
	const owns = (name: string) => accessibilityActions?.some((action) => action.name === name) === true;
	const wiresPress = isAccessible && hasPress && !owns("activate");
	const wiresLongPress = isAccessible && hasLongPress && !owns("longpress");

	if (platform === "android" && (wiresPress || wiresLongPress)) {
		return {
			accessibilityActions: [
				...(accessibilityActions ?? []),
				...(wiresPress ? [{ name: "activate" as const }] : []),
				...(wiresLongPress ? [{ name: "longpress" as const }] : []),
			],
			routesActivate: wiresPress,
			routesLongPress: wiresLongPress,
			wiresAccessibilityTap: false,
		};
	}

	return {
		accessibilityActions,
		routesActivate: false,
		routesLongPress: false,
		wiresAccessibilityTap: wiresPress && platform === "ios" && !hasAccessibilityTap,
	};
}

/**
 * Calls a pressable's handler behind `isPressableInteractive` — the one call
 * every screen-reader path makes, so a disabled or busy control can never be
 * reached by one. Returns whether the handler ran. Exactly one call per
 * invocation: nothing here retries, queues or re-dispatches.
 */
export function invokePressableHandler(
	handler: (() => void) | undefined,
	gate: { busy: boolean; disabled: boolean }
): boolean {
	if (!handler || !isPressableInteractive(gate)) return false;
	handler();
	return true;
}

/**
 * Routes one `onAccessibilityAction` event. `activate` and `longpress` are
 * consumed only when `resolvePressableActivation` added them — returning `true`
 * whether or not the gate let the handler run, so a gated control swallows the
 * action. Anything else returns `false` and belongs to the caller's own
 * `onAccessibilityAction`.
 */
export function dispatchPressableAccessibilityAction({
	actionName,
	activation,
	busy,
	disabled,
	onLongPress,
	onPress,
}: {
	actionName: string;
	activation: { routesActivate: boolean; routesLongPress: boolean };
	busy: boolean;
	disabled: boolean;
	onLongPress?: () => void;
	onPress?: () => void;
}): boolean {
	if (activation.routesActivate && actionName === "activate") {
		invokePressableHandler(onPress, { busy, disabled });
		return true;
	}
	if (activation.routesLongPress && actionName === "longpress") {
		invokePressableHandler(onLongPress, { busy, disabled });
		return true;
	}
	return false;
}

/** The smallest touch target, in points, a control is promised: Apple's HIG and WCAG 2.5.5's AAA size. */
export const MIN_HIT_TARGET = 44;

/** Material's minimum touch target, in dp — what an Android app opts into with `isMaterialHitTarget`. */
export const MATERIAL_MIN_HIT_TARGET = 48;

/**
 * The minimum touch target for this platform.
 *
 * 44 everywhere unless the app opts into Material's 48dp, and that opt-in only
 * moves Android: an iOS target sized to Material's number would be four points
 * bigger than the HIG asks for, for nothing.
 */
export function resolveMinimumHitTarget({
	isMaterialHitTarget = false,
	platform,
}: {
	isMaterialHitTarget?: boolean;
	platform: string;
}): number {
	return isMaterialHitTarget && platform === "android" ? MATERIAL_MIN_HIT_TARGET : MIN_HIT_TARGET;
}

/** Points per `rem` on native, Uniwind's and Tailwind's default root font size. */
const REM_IN_POINTS = 16;

/** A length a theme variable can hold: `32px`, `2.25rem` or a bare `32`. */
const THEME_LENGTH = /^(\d+(?:\.\d+)?|\.\d+)(px|rem)?$/;

/**
 * A theme variable's value — what Uniwind's `useCSSVariable` returns — as points,
 * or `fallback` when it holds no length.
 *
 * On native Uniwind resolves `px` to a number, but a value written with
 * `updateCSSVariables` arrives as written, so `"32px"` and `"2rem"` are read too.
 * Anything else (a percentage, `em`, `calc()`, a variable that is not defined)
 * is not a length a hit target can be sized from, so it falls back rather than
 * guessing. The fallback is the default token, so a theme that never touches the
 * variable gets exactly what it got before.
 *
 * Pure, so the matrix is unit-testable. See AGENTS.md.
 */
export function resolveThemeLength(value: unknown, fallback: number): number {
	if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : fallback;
	if (typeof value !== "string") return fallback;
	const match = THEME_LENGTH.exec(value.trim());
	if (!match) return fallback;
	const amount = Number(match[1]);
	return match[2] === "rem" ? amount * REM_IN_POINTS : amount;
}

/** What a target draws at: one edge for a square, or both for anything else. */
export type HitTargetSize = number | { height: number; width: number };

/** Slop on each side, in points. Structural, so no RN import — it is React Native's `Insets` with every key set. */
export type HitSlopInsets = { bottom: number; left: number; right: number; top: number };

/** A non-finite or negative edge is nothing drawn. */
function drawnEdge(edge: number): number {
	return Number.isFinite(edge) && edge > 0 ? edge : 0;
}

/**
 * The `hitSlop` that grows a target drawn at `size` to `min` points, without
 * growing anything drawn.
 *
 * Half the shortfall goes on each side of an axis, so `size + 2 × slop` always
 * reaches `min`. A square, or any target short by the same amount on both axes,
 * gets a single number; a wide one gets insets that grow only the short axis.
 * A target already at `min` gets `undefined`, so the prop can be passed as is.
 *
 * `cap` bounds the slop on every side, for targets packed closer than the slop
 * would need — a swatch row, a day grid. Two siblings' slop must not overlap:
 * React Native hit-tests the later sibling first, so an overlap hands the press
 * to whichever sits later in the tree, not to the one under the finger. Keep
 * `cap` at half the gap between neighbours; the target then falls short of
 * `min`, which is the honest trade for a layout that dense.
 *
 * Pure, so the whole matrix is unit-testable. See AGENTS.md.
 */
export function resolveMinimumHitSlop(
	size: HitTargetSize,
	min: number = MIN_HIT_TARGET,
	{ cap = Number.POSITIVE_INFINITY }: { cap?: number } = {}
): number | HitSlopInsets | undefined {
	const width = drawnEdge(typeof size === "number" ? size : size.width);
	const height = drawnEdge(typeof size === "number" ? size : size.height);
	const bound = Math.max(0, cap);
	const horizontal = Math.min(bound, Math.max(0, (min - width) / 2));
	const vertical = Math.min(bound, Math.max(0, (min - height) / 2));

	if (horizontal === 0 && vertical === 0) return undefined;
	if (horizontal === vertical) return horizontal;
	return { bottom: vertical, left: horizontal, right: horizontal, top: vertical };
}

/**
 * Any `hitSlop` React Native accepts, as four numbers — or `undefined` when it
 * grows nothing.
 *
 * `Pressable` hands its slop to the tap gesture as well as the view, and a
 * gesture is memoised on primitives: a fresh insets object each render would
 * rebuild it every render.
 */
export function normalizeHitSlop(
	hitSlop: number | Partial<HitSlopInsets> | null | undefined
): HitSlopInsets | undefined {
	if (hitSlop === null || hitSlop === undefined) return undefined;
	const insets =
		typeof hitSlop === "number"
			? { bottom: hitSlop, left: hitSlop, right: hitSlop, top: hitSlop }
			: { bottom: hitSlop.bottom ?? 0, left: hitSlop.left ?? 0, right: hitSlop.right ?? 0, top: hitSlop.top ?? 0 };
	return insets.bottom || insets.left || insets.right || insets.top ? insets : undefined;
}
