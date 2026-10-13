import {
	type ReactElement,
	type ReactNode,
	type Ref,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { AccessibilityInfo, View, type ViewProps } from "react-native";
import { useFieldContext } from "../field/field.context";
import { type HapticFeedback, playHaptic } from "../pressable";
import { type SignatureContextValue, SignatureProvider } from "./signature.context";
import {
	canRedo,
	canUndo,
	createHistory,
	historyReducer,
	historyToValue,
	isHistoryEmpty,
	SIGNATURE_MIN_DISTANCE,
	SIGNATURE_STROKE_WIDTH,
	type SignatureHistory,
	type SignatureHistoryAction,
	strokeCount,
	strokesToPaths,
	toSVG,
} from "./signature.stroke";
import type { SignatureHandle, SignatureStroke, SignatureValue } from "./signature.types";
import {
	resolveSignatureAxes,
	SIGNATURE_PLACEHOLDER,
	SIGNATURE_STROKE_TOKEN,
	type SignatureAction,
	type SignatureSize,
	type SignatureVariant,
	signatureVariants,
} from "./signature.variants";
import { SignatureAlternative } from "./signature-alternative";
import { SignatureClear } from "./signature-clear";
import { SignaturePad } from "./signature-pad";
import { SignatureRedo } from "./signature-redo";
import { SignatureToolbar } from "./signature-toolbar";
import { SignatureUndo } from "./signature-undo";

/** What a screen reader hears when the first stroke lands, and when the pad is cleared. */
const ANNOUNCE_CAPTURED = "Signature captured";
const ANNOUNCE_CLEARED = "Signature cleared";

export type SignatureProps = Omit<ViewProps, "children" | "style"> & {
	/**
	 * The drawing, to seed or re-seed the pad from outside. A value different from
	 * the last one the pad reported replaces the drawing and its undo history.
	 */
	value?: SignatureValue | null;
	/** The drawing the pad starts with while uncontrolled. */
	defaultValue?: SignatureValue | null;
	/** Fires when a stroke ends and on undo, redo and clear — `null` once the pad is empty. Never per move. */
	onValueChange?: (value: SignatureValue | null) => void;
	/** Fires as a finger lands on the pad. */
	onBegin?: () => void;
	/** Fires when a stroke has been added, with the value it produced. */
	onEnd?: (value: SignatureValue) => void;
	size?: SignatureSize;
	/** `primary` is a filled pad, `secondary` an outlined one. */
	variant?: SignatureVariant;
	/** The ink — a theme token or a literal colour. Default `foreground`. */
	strokeColor?: string;
	/** The ink's width in points. Default 2.5. */
	strokeWidth?: number;
	/** How far a finger travels before another point is sampled, in points. Default 1.5. */
	minDistance?: number;
	/** Draws the line to sign on. Default true. */
	hasGuideline?: boolean;
	/** A caption under the line — "Sign above the line". */
	guidelineLabel?: string;
	/** Shown while the pad is empty, gone at the first touch. Default "Sign here". */
	placeholder?: string;
	/** Blocks the gesture and the toolbar and fades the control. Inherited from an enclosing `Field`. */
	isDisabled?: boolean;
	/** Paints the pad's border destructive. Inherited from an enclosing `Field`. */
	isInvalid?: boolean;
	/** Shows the drawing without taking a touch or showing a toolbar, and without fading. */
	isReadOnly?: boolean;
	/** Played as each stroke begins; a clear plays a selection tick. `false` silences both. */
	haptic?: false | HapticFeedback;
	/** Offers a typed-name route for anyone who cannot draw; renders `Signature.Alternative`. */
	onRequestAlternative?: () => void;
	/** `undo`, `redo`, `clear`, `isEmpty`, `strokeCount`, `value`, `toSVG()` and `toPaths()`. */
	ref?: Ref<SignatureHandle>;
	className?: string;
	/** Classes for the default pad, when no children are given. */
	padClassName?: string;
	children?: ReactNode;
};

function SignatureRoot({
	value,
	defaultValue = null,
	onValueChange,
	onBegin,
	onEnd,
	size,
	variant,
	strokeColor = SIGNATURE_STROKE_TOKEN,
	strokeWidth = SIGNATURE_STROKE_WIDTH,
	minDistance = SIGNATURE_MIN_DISTANCE,
	hasGuideline = true,
	guidelineLabel,
	placeholder = SIGNATURE_PLACEHOLDER,
	isDisabled,
	isInvalid,
	isReadOnly,
	haptic = "light",
	onRequestAlternative,
	ref,
	className,
	padClassName,
	children,
	...props
}: SignatureProps): ReactElement {
	const field = useFieldContext();
	const axes = resolveSignatureAxes({ field, own: { isDisabled, isInvalid, isReadOnly, size, variant } });
	const isInteractive = !axes.isDisabled && !axes.isReadOnly;

	const [history, setHistory] = useState<SignatureHistory>(() =>
		createHistory(value !== undefined ? value : defaultValue)
	);
	const [clearCount, setClearCount] = useState(0);

	// The latest history, read by handlers that can fire twice before React
	// re-renders — two quick strokes each commit from the UI thread — and by the
	// imperative handle's getters. Written only where the state is set.
	const historyRef = useRef(history);
	// The last value this pad reported, so a controlled parent echoing it back is
	// told apart from a parent replacing the drawing.
	const reported = useRef<SignatureValue | null | undefined>(value);

	const apply = useCallback(
		(action: SignatureHistoryAction, report: boolean): SignatureHistory => {
			const previous = historyRef.current;
			const next = historyReducer(previous, action);
			if (next === previous) return previous;

			historyRef.current = next;
			setHistory(next);
			if (report && next.strokes !== previous.strokes) {
				const nextValue = historyToValue(next);
				reported.current = nextValue;
				onValueChange?.(nextValue);
			}
			return next;
		},
		[onValueChange]
	);

	useEffect(() => {
		if (value === undefined || value === reported.current) return;
		reported.current = value;
		apply({ type: "reset", value }, false);
	}, [apply, value]);

	const commitStroke = useCallback(
		(stroke: SignatureStroke) => {
			const previous = historyRef.current;
			const next = apply({ type: "commit", stroke }, true);
			if (next === previous) return;
			if (isHistoryEmpty(previous)) AccessibilityInfo.announceForAccessibility(ANNOUNCE_CAPTURED);
			const nextValue = historyToValue(next);
			if (nextValue) onEnd?.(nextValue);
		},
		[apply, onEnd]
	);

	const beginStroke = useCallback(() => onBegin?.(), [onBegin]);

	const setPadSize = useCallback(
		(width: number, height: number) => {
			apply({ type: "layout", height, width }, false);
		},
		[apply]
	);

	const undo = useCallback(() => {
		apply({ type: "undo" }, true);
	}, [apply]);

	const redo = useCallback(() => {
		apply({ type: "redo" }, true);
	}, [apply]);

	const clear = useCallback(() => {
		const previous = historyRef.current;
		if (apply({ type: "clear" }, true) === previous) return;
		setClearCount((count) => count + 1);
		if (haptic !== false) playHaptic("selection");
		AccessibilityInfo.announceForAccessibility(ANNOUNCE_CLEARED);
	}, [apply, haptic]);

	const runAction = useCallback(
		(action: SignatureAction) => {
			if (!isInteractive) return;
			if (action === "undo") undo();
			else if (action === "redo") redo();
			else clear();
		},
		[clear, isInteractive, redo, undo]
	);

	useImperativeHandle(
		ref,
		() => ({
			undo,
			redo,
			clear,
			get isEmpty() {
				return isHistoryEmpty(historyRef.current);
			},
			get strokeCount() {
				return strokeCount(historyRef.current);
			},
			get value() {
				return historyToValue(historyRef.current);
			},
			toSVG: (options) => {
				const current = historyRef.current;
				return toSVG(
					{ height: current.height, strokes: current.strokes, width: current.width },
					{ strokeWidth, ...options }
				);
			},
			toPaths: () => strokesToPaths(historyRef.current.strokes),
		}),
		[clear, redo, strokeWidth, undo]
	);

	const context = useMemo<SignatureContextValue>(
		() => ({
			value: historyToValue(history),
			strokes: history.strokes,
			isEmpty: isHistoryEmpty(history),
			strokeCount: strokeCount(history),
			canUndo: canUndo(history),
			canRedo: canRedo(history),
			undo,
			redo,
			clear,
			size: axes.size,
			variant: axes.variant,
			isDisabled: axes.isDisabled,
			isInvalid: axes.isInvalid,
			isReadOnly: axes.isReadOnly,
			isInteractive,
			strokeColor,
			strokeWidth,
			minDistance,
			hasGuideline,
			guidelineLabel,
			placeholder,
			haptic,
			clearCount,
			onRequestAlternative,
			commitStroke,
			beginStroke,
			setPadSize,
			runAction,
		}),
		[
			axes.isDisabled,
			axes.isInvalid,
			axes.isReadOnly,
			axes.size,
			axes.variant,
			beginStroke,
			clear,
			clearCount,
			commitStroke,
			guidelineLabel,
			haptic,
			hasGuideline,
			history,
			isInteractive,
			minDistance,
			onRequestAlternative,
			placeholder,
			redo,
			runAction,
			setPadSize,
			strokeColor,
			strokeWidth,
			undo,
		]
	);

	return (
		<SignatureProvider value={context}>
			<View
				className={signatureVariants({ isDisabled: axes.isDisabled, size: axes.size }).root({ className })}
				{...props}
			>
				{children ?? (
					<>
						<SignaturePad className={padClassName} />
						<SignatureToolbar>
							<SignatureAlternative />
							<SignatureUndo />
							<SignatureClear />
						</SignatureToolbar>
					</>
				)}
			</View>
		</SignatureProvider>
	);
}

/**
 * A pad to sign with a finger or a stylus, handing back the strokes as data or
 * as an SVG.
 *
 * A bare `<Signature />` is the pad and a toolbar holding undo and clear. Write
 * the anatomy out to choose the actions — `Signature.Redo` joins them — or to
 * put the toolbar somewhere else.
 *
 * **Drawing is on the UI thread**, and the drawing is React state only between
 * strokes: `onValueChange` fires when a finger lifts and on undo, redo and clear,
 * never while a finger moves. Strokes are smoothed into quadratic curves, so they
 * read as ink rather than as a polyline, and a tap that never moves leaves a dot.
 *
 * **The value is plain JSON** — `{ width, height, strokes }` — so it can be stored
 * and handed back as `value` or `defaultValue` later. A pad rendered at another
 * size re-fits it, keeping its aspect. The ref adds `toSVG()` for a file and
 * `toPaths()` for drawing it elsewhere.
 *
 * **Offer `onRequestAlternative`.** A signature is a path a finger has to trace,
 * and no accessibility label makes that possible for everyone; the prop renders
 * a "Can't sign? Type your name" link that hands off to a typed-name flow.
 *
 * `isInvalid` and `isDisabled` cascade from an enclosing `Field`, whose label
 * names the pad to a screen reader. The pad takes a touch the moment it lands,
 * so a scroll view around it will not scroll from a drag that starts on it.
 *
 * @example
 * <Signature onValueChange={setSignature} />
 *
 * @example
 * <Field isInvalid={!signature}>
 *   <Field.Label>Signature</Field.Label>
 *   <Signature ref={pad} onRequestAlternative={typeName} onValueChange={setSignature}>
 *     <Signature.Pad />
 *     <Signature.Toolbar>
 *       <Signature.Alternative />
 *       <Signature.Undo />
 *       <Signature.Redo />
 *       <Signature.Clear />
 *     </Signature.Toolbar>
 *   </Signature>
 *   <Field.Error>{signature ? undefined : "Please sign"}</Field.Error>
 * </Field>
 *
 * @example
 * const svg = pad.current?.toSVG({ viewBox: "tight", background: "#ffffff" });
 */
export const Signature = Object.assign(SignatureRoot, {
	/** The drawing surface — the gesture, the ink, the guideline and the accessibility surface. */
	Pad: SignaturePad,
	/** The row of actions under the pad. Hidden while read-only. */
	Toolbar: SignatureToolbar,
	/** Removes the last stroke; disabled with nothing to undo. */
	Undo: SignatureUndo,
	/** Restores the last stroke undone; disabled with nothing to redo. */
	Redo: SignatureRedo,
	/** Removes every stroke, for good; disabled while empty. */
	Clear: SignatureClear,
	/** The typed-name link, shown only when `onRequestAlternative` is passed. */
	Alternative: SignatureAlternative,
	displayName: "DelacourUI.Signature",
});
