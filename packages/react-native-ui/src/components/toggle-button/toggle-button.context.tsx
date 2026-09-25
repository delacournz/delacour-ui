import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { ButtonSize } from "../button/button.variants";
import type { HapticFeedback } from "../pressable";
import type {
	ToggleButtonGroupLayout,
	ToggleButtonGroupOrientation,
	ToggleButtonSelectionMode,
	ToggleButtonVariant,
} from "./toggle-button.variants";

export type ToggleButtonContextValue = {
	/** Whether the toggle is pressed in right now. */
	isSelected: boolean;
	/** Whether the toggle is disabled, once its group has had its say. */
	isDisabled: boolean;
	/** The toggle's own variant, not the button variant it resolves to. */
	variant: ToggleButtonVariant;
	/** The size the toggle asked for, or `undefined` to take the button's default. */
	size: ButtonSize | undefined;
};

const ToggleButtonContext = createContext<ToggleButtonContextValue | null>(null);

/**
 * Supplies the enclosing toggle's state to its subtree.
 *
 * In a leaf of its own, importing nothing but types, so a part can read it
 * without importing `./toggle-button` and closing a cycle (package AGENTS.md
 * rule 3).
 */
export function ToggleButtonProvider({
	value,
	children,
}: {
	value: ToggleButtonContextValue;
	children: ReactNode;
}): ReactElement {
	return <ToggleButtonContext value={value}>{children}</ToggleButtonContext>;
}
ToggleButtonProvider.displayName = "DelacourUI.ToggleButton.Provider";

/** The enclosing toggle's state, or null outside a `<ToggleButton>`. */
export function useToggleButtonContext(): ToggleButtonContextValue | null {
	return use(ToggleButtonContext);
}

/**
 * Reads the enclosing toggle's state.
 *
 * For a custom child that changes with the toggle — a glyph that fills when
 * selected. Throws outside a `<ToggleButton>` — use
 * {@link useToggleButtonContext} where the toggle is optional.
 */
export function useToggleButton(): ToggleButtonContextValue {
	const context = useToggleButtonContext();
	if (!context) {
		throw new Error("useToggleButton must be called inside a <ToggleButton>.");
	}
	return context;
}

/**
 * The enclosing toggle's state, for a compound part that cannot work without it.
 *
 * Internal: deliberately not re-exported from `index.ts`.
 */
export function useToggleButtonPart(component: string): ToggleButtonContextValue {
	const context = useToggleButtonContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <ToggleButton>.`);
	}
	return context;
}

export type ToggleButtonGroupContextValue = {
	/** The `value` of every selected member. */
	selected: readonly string[];
	/** Presses the member called `value`, as the selection mode decides. */
	toggle: (value: string) => void;
	selectionMode: ToggleButtonSelectionMode;
	layout: ToggleButtonGroupLayout;
	orientation: ToggleButtonGroupOrientation;
	/** A default a member may override. */
	variant?: ToggleButtonVariant;
	/** A default a member may override. An attached group owns the step outright. */
	size?: ButtonSize;
	/** A default a member may override, so one option can disable itself. */
	isDisabled?: boolean;
	/** A default a member may override. */
	haptic?: false | HapticFeedback;
};

const ToggleButtonGroupContext = createContext<ToggleButtonGroupContextValue | null>(null);

/**
 * Supplies a group's selection and shared axes to its members.
 *
 * The optional axes are published raw, so `undefined` means "the group said
 * nothing" and a member's `??` ladder can see past it.
 */
export function ToggleButtonGroupProvider({
	value,
	children,
}: {
	value: ToggleButtonGroupContextValue;
	children: ReactNode;
}): ReactElement {
	return <ToggleButtonGroupContext value={value}>{children}</ToggleButtonGroupContext>;
}
ToggleButtonGroupProvider.displayName = "DelacourUI.ToggleButton.Group.Provider";

/** The enclosing group, or null for a toggle standing on its own. */
export function useToggleButtonGroupContext(): ToggleButtonGroupContextValue | null {
	return use(ToggleButtonGroupContext);
}

/**
 * Reads the enclosing group's selection and axes.
 *
 * Throws outside a `<ToggleButton.Group>` — use
 * {@link useToggleButtonGroupContext} where the group is optional, as a
 * `ToggleButton` itself does.
 */
export function useToggleButtonGroup(): ToggleButtonGroupContextValue {
	const context = useToggleButtonGroupContext();
	if (!context) {
		throw new Error("useToggleButtonGroup must be called inside a <ToggleButton.Group>.");
	}
	return context;
}
