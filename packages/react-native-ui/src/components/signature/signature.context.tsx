import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { HapticFeedback } from "../pressable";
import type { SignatureStroke, SignatureValue } from "./signature.types";
import type { SignatureSize, SignatureVariant } from "./signature.variants";

/** What a custom part reads from {@link useSignature}. */
export type SignatureState = {
	/** The drawing, or `null` while the pad is empty. */
	value: SignatureValue | null;
	/** The finished strokes, in pad coordinates. */
	strokes: readonly SignatureStroke[];
	isEmpty: boolean;
	strokeCount: number;
	canUndo: boolean;
	canRedo: boolean;
	undo: () => void;
	redo: () => void;
	clear: () => void;
	size: SignatureSize;
	variant: SignatureVariant;
	isDisabled: boolean;
	isInvalid: boolean;
	isReadOnly: boolean;
	/** Neither disabled nor read-only: the pad takes a finger and the toolbar acts. */
	isInteractive: boolean;
};

export type SignatureContextValue = SignatureState & {
	/** The ink, as a token name or a literal. */
	strokeColor: string;
	strokeWidth: number;
	minDistance: number;
	hasGuideline: boolean;
	guidelineLabel: string | undefined;
	placeholder: string;
	/** Played as a stroke begins. `false` silences every haptic the signature plays. */
	haptic: false | HapticFeedback;
	/**
	 * Bumped by every clear. The pad's ink fades out the picture a clear replaced
	 * when it changes, rather than snapping the strokes away.
	 */
	clearCount: number;
	/** The typed-name escape hatch, when the caller offers one. */
	onRequestAlternative: (() => void) | undefined;
	/** The pad hands over a finished stroke here, once, from the JS thread. */
	commitStroke: (stroke: SignatureStroke) => void;
	/** The pad reports a stroke beginning here. */
	beginStroke: () => void;
	/** The pad reports its measured size here. */
	setPadSize: (width: number, height: number) => void;
	/** Applies an action a screen reader asked for. */
	runAction: (action: "undo" | "redo" | "clear") => void;
};

const SignatureContext = createContext<SignatureContextValue | null>(null);

/**
 * Supplies one signature's state to its own parts.
 *
 * Lives in its own module, importing nothing but React and types, so a part can
 * read it without importing `./signature` and closing a cycle (AGENTS.md rule 3).
 */
export function SignatureProvider({
	value,
	children,
}: {
	value: SignatureContextValue;
	children: ReactNode;
}): ReactElement {
	return <SignatureContext value={value}>{children}</SignatureContext>;
}
SignatureProvider.displayName = "DelacourUI.Signature.Provider";

/** The enclosing signature's state, or null outside a `<Signature>`. */
export function useSignatureContext(): SignatureContextValue | null {
	return use(SignatureContext);
}

/**
 * Reads the enclosing signature's state.
 *
 * For a custom toolbar button or a readout that has to match the pad it sits
 * beside — `canUndo`, `isEmpty`, `clear()` and the rest. Throws outside one —
 * use {@link useSignatureContext} where the signature is optional.
 */
export function useSignature(): SignatureState {
	const context = useSignatureContext();
	if (!context) {
		throw new Error("useSignature must be called inside a <Signature>.");
	}
	return context;
}

/**
 * The enclosing signature's state, for a compound part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useSignaturePart(component: string): SignatureContextValue {
	const context = useSignatureContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Signature>.`);
	}
	return context;
}
