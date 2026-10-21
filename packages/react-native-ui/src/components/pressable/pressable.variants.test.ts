import { describe, expect, test } from "bun:test";
import {
	dispatchPressableAccessibilityAction,
	invokePressableHandler,
	isPressableInteractive,
	PRESSABLE_FEEDBACK,
	PRESSABLE_FEEDBACK_FALLBACK,
	PRESSABLE_FEEDBACKS,
	resolvePressableAccessibilityState,
	resolvePressableActivation,
	resolvePressedState,
	resolveRestOpacity,
} from "./pressable.variants";

describe("PRESSABLE_FEEDBACK", () => {
	test("covers every named feedback", () => {
		for (const feedback of PRESSABLE_FEEDBACKS) {
			expect(PRESSABLE_FEEDBACK[feedback]).toBeDefined();
		}
	});

	test("gives every named feedback a distinct pair", () => {
		const seen = new Set(PRESSABLE_FEEDBACKS.map((feedback) => JSON.stringify(PRESSABLE_FEEDBACK[feedback])));
		expect(seen.size).toBe(PRESSABLE_FEEDBACKS.length);
	});

	// 1 is the neutral value on either axis, so a single-axis mode leaves the
	// other one alone rather than nudging it.
	test("scale shrinks without dimming", () => {
		expect(PRESSABLE_FEEDBACK.scale.opacity).toBe(1);
		expect(PRESSABLE_FEEDBACK.scale.scale).toBeLessThan(1);
	});

	test("fade dims without scaling", () => {
		expect(PRESSABLE_FEEDBACK.fade.scale).toBe(1);
		expect(PRESSABLE_FEEDBACK.fade.opacity).toBeLessThan(1);
	});

	test("none moves neither axis", () => {
		expect(PRESSABLE_FEEDBACK.none).toEqual({ opacity: 1, scale: 1 });
	});

	// The load-bearing one: `scale-fade` is the union of the two single-axis
	// modes, not a third set of numbers. Tuning `scale` or `fade` has to carry
	// through, or the name stops describing what the mode does.
	test("scale-fade takes each axis from the mode that owns it", () => {
		expect(PRESSABLE_FEEDBACK["scale-fade"]).toEqual({
			opacity: PRESSABLE_FEEDBACK.fade.opacity,
			scale: PRESSABLE_FEEDBACK.scale.scale,
		});
	});

	test("every mode stays within the range the press interpolates over", () => {
		for (const feedback of PRESSABLE_FEEDBACKS) {
			const { opacity, scale } = PRESSABLE_FEEDBACK[feedback];
			expect(opacity).toBeGreaterThan(0);
			expect(opacity).toBeLessThanOrEqual(1);
			expect(scale).toBeGreaterThan(0);
			expect(scale).toBeLessThanOrEqual(1);
		}
	});
});

describe("resolvePressedState", () => {
	test("maps each named feedback to its pair", () => {
		for (const feedback of PRESSABLE_FEEDBACKS) {
			expect(resolvePressedState(feedback, undefined, undefined)).toEqual(PRESSABLE_FEEDBACK[feedback]);
		}
	});

	// Naming the fallback would either change what a bare Pressable has always
	// done or make `scale-fade` fade less than `fade`. It stays unnamed instead.
	test("falls back to the pair a bare pressable has always used", () => {
		expect(resolvePressedState(undefined, undefined, undefined)).toEqual(PRESSABLE_FEEDBACK_FALLBACK);
		expect(PRESSABLE_FEEDBACK_FALLBACK).toEqual({ opacity: 0.9, scale: 0.97 });
	});

	test("an explicit value beats the fallback on its own axis", () => {
		expect(resolvePressedState(undefined, 1, undefined)).toEqual({
			opacity: PRESSABLE_FEEDBACK_FALLBACK.opacity,
			scale: 1,
		});
		expect(resolvePressedState(undefined, undefined, 1)).toEqual({
			opacity: 1,
			scale: PRESSABLE_FEEDBACK_FALLBACK.scale,
		});
	});

	test("an explicit value beats a named feedback on its own axis", () => {
		expect(resolvePressedState("scale-fade", undefined, 0.2)).toEqual({
			opacity: 0.2,
			scale: PRESSABLE_FEEDBACK["scale-fade"].scale,
		});
		expect(resolvePressedState("none", 0.5, undefined)).toEqual({ opacity: 1, scale: 0.5 });
	});

	test("both explicit values leave nothing of the named feedback", () => {
		expect(resolvePressedState("scale", 0.5, 0.5)).toEqual({ opacity: 0.5, scale: 0.5 });
	});

	// 0 is a legitimate value on either axis and must not read as "unset".
	test("treats an explicit zero as a value, not an absence", () => {
		expect(resolvePressedState("scale", 0, 0)).toEqual({ opacity: 0, scale: 0 });
	});
});

describe("resolveRestOpacity", () => {
	// The animated style owns `opacity` on the view, so a caller's `opacity-50`
	// would be overwritten by the resting `1` unless the press multiplies it in.
	test("keeps an opacity the className resolved to", () => {
		expect(resolveRestOpacity(0.5)).toBe(0.5);
		expect(resolveRestOpacity(0)).toBe(0);
		expect(resolveRestOpacity(1)).toBe(1);
	});

	test("falls back to fully opaque when the className sets none", () => {
		expect(resolveRestOpacity(undefined)).toBe(1);
	});

	// Uniwind types `opacity` as an animatable value, so anything that is not a
	// plain number is treated as unset rather than multiplied in as NaN.
	test("ignores a value that is not a finite number", () => {
		expect(resolveRestOpacity(Number.NaN)).toBe(1);
		expect(resolveRestOpacity(Number.POSITIVE_INFINITY)).toBe(1);
		expect(resolveRestOpacity("0.5")).toBe(1);
		expect(resolveRestOpacity({})).toBe(1);
	});

	test("clamps a number into the unit range", () => {
		expect(resolveRestOpacity(1.5)).toBe(1);
		expect(resolveRestOpacity(-0.2)).toBe(0);
	});
});

describe("resolvePressableAccessibilityState", () => {
	test("announces the gating props", () => {
		expect(resolvePressableAccessibilityState({ busy: true, disabled: false })).toEqual({
			busy: true,
			disabled: false,
		});
		expect(resolvePressableAccessibilityState({ busy: false, disabled: true })).toEqual({
			busy: false,
			disabled: true,
		});
	});

	// A running step stays tappable but is still announced busy — the busy prop
	// would block the press, so the caller says it through accessibilityState.
	test("keeps a caller's busy rather than overwriting it with the prop's false", () => {
		const state = resolvePressableAccessibilityState({
			accessibilityState: { busy: true },
			busy: false,
			disabled: false,
		});
		expect(state.busy).toBe(true);
	});

	test("never lets a caller announce a gated control as not busy or not disabled", () => {
		const state = resolvePressableAccessibilityState({
			accessibilityState: { busy: false, disabled: false },
			busy: true,
			disabled: true,
		});
		expect(state).toMatchObject({ busy: true, disabled: true });
	});

	test("passes the caller's other keys through", () => {
		const caller: { expanded: boolean; busy?: boolean } = { expanded: true };
		const state = resolvePressableAccessibilityState({
			accessibilityState: caller,
			busy: false,
			disabled: false,
		});
		expect(state.expanded).toBe(true);
	});
});

describe("isPressableInteractive", () => {
	test("only a control that is neither disabled nor busy takes a press", () => {
		expect(isPressableInteractive({ busy: false, disabled: false })).toBe(true);
		expect(isPressableInteractive({ busy: true, disabled: false })).toBe(false);
		expect(isPressableInteractive({ busy: false, disabled: true })).toBe(false);
		expect(isPressableInteractive({ busy: true, disabled: true })).toBe(false);
	});
});

describe("resolvePressableActivation", () => {
	test("iOS wires onAccessibilityTap and adds no custom action", () => {
		expect(resolvePressableActivation({ hasAccessibilityTap: false, hasPress: true, platform: "ios" })).toEqual({
			accessibilityActions: undefined,
			routesActivate: false,
			routesLongPress: false,
			wiresAccessibilityTap: true,
		});
	});

	test("iOS leaves a caller's own actions untouched, so the rotor gains no 'activate' entry", () => {
		const actions = [{ label: "Remove", name: "remove" }];
		const resolved = resolvePressableActivation({
			accessibilityActions: actions,
			hasAccessibilityTap: false,
			hasPress: true,
			platform: "ios",
		});
		expect(resolved.accessibilityActions).toBe(actions);
		expect(resolved.wiresAccessibilityTap).toBe(true);
	});

	test("Android appends 'activate' after a caller's actions and routes it", () => {
		const resolved = resolvePressableActivation({
			accessibilityActions: [{ label: "Remove", name: "remove" }],
			hasAccessibilityTap: false,
			hasPress: true,
			platform: "android",
		});
		expect(resolved).toEqual({
			accessibilityActions: [{ label: "Remove", name: "remove" }, { name: "activate" }],
			routesActivate: true,
			routesLongPress: false,
			wiresAccessibilityTap: false,
		});
	});

	test("Android with no caller actions gets exactly one 'activate'", () => {
		expect(
			resolvePressableActivation({ hasAccessibilityTap: false, hasPress: true, platform: "android" })
				.accessibilityActions
		).toEqual([{ name: "activate" }]);
	});

	test("a caller that lists 'activate' owns it on both platforms, so it never fires twice", () => {
		const actions = [{ name: "activate" }, { name: "increment" }];
		for (const platform of ["ios", "android"] as const) {
			expect(
				resolvePressableActivation({
					accessibilityActions: actions,
					hasAccessibilityTap: false,
					hasPress: true,
					platform,
				})
			).toEqual({
				accessibilityActions: actions,
				routesActivate: false,
				routesLongPress: false,
				wiresAccessibilityTap: false,
			});
		}
	});

	test("a caller's own onAccessibilityTap wins on iOS", () => {
		expect(
			resolvePressableActivation({ hasAccessibilityTap: true, hasPress: true, platform: "ios" }).wiresAccessibilityTap
		).toBe(false);
	});

	test("nothing is wired without an onPress to reach", () => {
		for (const platform of ["ios", "android"] as const) {
			expect(resolvePressableActivation({ hasAccessibilityTap: false, hasPress: false, platform })).toEqual({
				accessibilityActions: undefined,
				routesActivate: false,
				routesLongPress: false,
				wiresAccessibilityTap: false,
			});
		}
	});

	test("any other platform is left alone", () => {
		expect(resolvePressableActivation({ hasAccessibilityTap: false, hasPress: true, platform: "web" })).toEqual({
			accessibilityActions: undefined,
			routesActivate: false,
			routesLongPress: false,
			wiresAccessibilityTap: false,
		});
	});

	test("Android appends 'longpress' when there is an onLongPress, and routes it", () => {
		expect(
			resolvePressableActivation({
				hasAccessibilityTap: false,
				hasLongPress: true,
				hasPress: true,
				platform: "android",
			})
		).toEqual({
			accessibilityActions: [{ name: "activate" }, { name: "longpress" }],
			routesActivate: true,
			routesLongPress: true,
			wiresAccessibilityTap: false,
		});
	});

	test("Android routes 'longpress' alone for a long-press-only pressable", () => {
		expect(
			resolvePressableActivation({
				hasAccessibilityTap: false,
				hasLongPress: true,
				hasPress: false,
				platform: "android",
			})
		).toEqual({
			accessibilityActions: [{ name: "longpress" }],
			routesActivate: false,
			routesLongPress: true,
			wiresAccessibilityTap: false,
		});
	});

	test("a caller that lists 'longpress' owns it, and still gets 'activate' added", () => {
		const resolved = resolvePressableActivation({
			accessibilityActions: [{ label: "Start selecting", name: "longpress" }],
			hasAccessibilityTap: false,
			hasLongPress: true,
			hasPress: true,
			platform: "android",
		});
		expect(resolved).toEqual({
			accessibilityActions: [{ label: "Start selecting", name: "longpress" }, { name: "activate" }],
			routesActivate: true,
			routesLongPress: false,
			wiresAccessibilityTap: false,
		});
	});

	test("iOS adds no 'longpress' entry — VoiceOver's double-tap-and-hold is a held touch the gesture sees", () => {
		expect(
			resolvePressableActivation({ hasAccessibilityTap: false, hasLongPress: true, hasPress: true, platform: "ios" })
		).toEqual({
			accessibilityActions: undefined,
			routesActivate: false,
			routesLongPress: false,
			wiresAccessibilityTap: true,
		});
	});
});

describe("invokePressableHandler", () => {
	test("fires the handler exactly once when interactive", () => {
		let calls = 0;
		expect(invokePressableHandler(() => calls++, { busy: false, disabled: false })).toBe(true);
		expect(calls).toBe(1);
	});

	test("never fires when disabled or busy", () => {
		let calls = 0;
		const handler = () => calls++;
		expect(invokePressableHandler(handler, { busy: false, disabled: true })).toBe(false);
		expect(invokePressableHandler(handler, { busy: true, disabled: false })).toBe(false);
		expect(invokePressableHandler(handler, { busy: true, disabled: true })).toBe(false);
		expect(calls).toBe(0);
	});

	test("a missing handler is a no-op", () => {
		expect(invokePressableHandler(undefined, { busy: false, disabled: false })).toBe(false);
	});
});

describe("dispatchPressableAccessibilityAction", () => {
	const routed = { routesActivate: true, routesLongPress: true };

	function counters() {
		const calls = { longPress: 0, press: 0 };
		return {
			calls,
			onLongPress: () => {
				calls.longPress++;
			},
			onPress: () => {
				calls.press++;
			},
		};
	}

	test("'activate' fires onPress once and is consumed", () => {
		const { calls, onLongPress, onPress } = counters();
		const consumed = dispatchPressableAccessibilityAction({
			actionName: "activate",
			activation: routed,
			busy: false,
			disabled: false,
			onLongPress,
			onPress,
		});
		expect(consumed).toBe(true);
		expect(calls).toEqual({ longPress: 0, press: 1 });
	});

	test("'longpress' fires onLongPress once, never onPress", () => {
		const { calls, onLongPress, onPress } = counters();
		const consumed = dispatchPressableAccessibilityAction({
			actionName: "longpress",
			activation: routed,
			busy: false,
			disabled: false,
			onLongPress,
			onPress,
		});
		expect(consumed).toBe(true);
		expect(calls).toEqual({ longPress: 1, press: 0 });
	});

	test("a disabled or busy control consumes both actions and fires nothing", () => {
		const { calls, onLongPress, onPress } = counters();
		for (const gate of [
			{ busy: false, disabled: true },
			{ busy: true, disabled: false },
		]) {
			for (const actionName of ["activate", "longpress"]) {
				expect(
					dispatchPressableAccessibilityAction({ actionName, activation: routed, ...gate, onLongPress, onPress })
				).toBe(true);
			}
		}
		expect(calls).toEqual({ longPress: 0, press: 0 });
	});

	test("an action the pressable does not route is forwarded, untouched", () => {
		const { calls, onLongPress, onPress } = counters();
		const unrouted = { routesActivate: false, routesLongPress: false };
		for (const actionName of ["activate", "longpress", "increment"]) {
			expect(
				dispatchPressableAccessibilityAction({
					actionName,
					activation: unrouted,
					busy: false,
					disabled: false,
					onLongPress,
					onPress,
				})
			).toBe(false);
		}
		expect(
			dispatchPressableAccessibilityAction({
				actionName: "increment",
				activation: routed,
				busy: false,
				disabled: false,
				onLongPress,
				onPress,
			})
		).toBe(false);
		expect(calls).toEqual({ longPress: 0, press: 0 });
	});
});
