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
 * Free of React Native imports so it stays unit-testable — `bun test` cannot
 * parse React Native's Flow-typed source. See AGENTS.md.
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
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
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
 * Pure, so the whole matrix is reachable from `bun test`. See AGENTS.md.
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
	/** What the view's `accessibilityActions` becomes — the caller's own, plus `activate` on Android. */
	accessibilityActions: ReadonlyArray<A | { name: "activate" }> | undefined;
	/** The pressable consumes `activate` in `onAccessibilityAction` and calls `onPress` itself. */
	routesActivate: boolean;
	/** The pressable sets `onAccessibilityTap`, which is what VoiceOver's double-tap reaches. */
	wiresAccessibilityTap: boolean;
};

/**
 * How a screen reader's activation reaches `onPress`.
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
 *   add a literal "activate" to every button's rotor.
 * - **Android.** A TalkBack double-tap performs `ACTION_CLICK`, which React
 *   Native routes to `onAccessibilityAction` only when `activate` is listed.
 *   Without it the click falls to `View.performClick`, with no listener behind
 *   it. React Native ignores `onAccessibilityTap` on Android.
 *
 * A caller that lists `activate` itself owns it on both platforms — a
 * `NumberInput` stepper, a `Message`, a `FlipCard` — and the pressable wires
 * nothing, so the press cannot fire twice. A caller's own `onAccessibilityTap`
 * wins the same way. With no `onPress` there is nothing to reach.
 *
 * The `disabled` / `busy` guard is not decided here: activation stays wired on
 * a gated control and the handler checks `isPressableInteractive`, so a gated
 * control's double-tap is consumed and does nothing rather than falling back
 * to a synthesised touch.
 */
export function resolvePressableActivation<A extends PressableAccessibilityAction>({
	accessibilityActions,
	hasAccessibilityTap,
	hasPress,
	platform,
}: {
	accessibilityActions?: ReadonlyArray<A>;
	hasAccessibilityTap: boolean;
	hasPress: boolean;
	platform: string;
}): PressableActivation<A> {
	const ownedByCaller = accessibilityActions?.some((action) => action.name === "activate") === true;
	const wires = hasPress && !ownedByCaller;

	if (wires && platform === "android") {
		return {
			accessibilityActions: [...(accessibilityActions ?? []), { name: "activate" }],
			routesActivate: true,
			wiresAccessibilityTap: false,
		};
	}

	return {
		accessibilityActions,
		routesActivate: false,
		wiresAccessibilityTap: wires && platform === "ios" && !hasAccessibilityTap,
	};
}
