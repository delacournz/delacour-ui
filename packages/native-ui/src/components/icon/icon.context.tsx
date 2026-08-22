import { createContext, type ReactElement, type ReactNode, use } from "react";

export type IconDefaults = {
	/** Edge length in points. */
	size: number;
	/** Theme colour token, e.g. `primary-foreground`. */
	color: string;
};

const IconDefaultsContext = createContext<IconDefaults | null>(null);

/**
 * Supplies the size and colour that unstyled `Icon`s in this subtree adopt.
 *
 * This is what lets an icon be *composed into* a component rather than passed
 * as a prop: `<Button><Icon icon={IconPlus} /><Button.Label>Add</Button.Label></Button>`
 * sizes and tints the icon for the button's variant, with no `startIcon` prop
 * and no colour repeated at the call site. An explicit `size` or `color` on the
 * icon still wins.
 */
export function IconDefaultsProvider({ value, children }: { value: IconDefaults; children: ReactNode }): ReactElement {
	return <IconDefaultsContext value={value}>{children}</IconDefaultsContext>;
}

/** Icon defaults from the nearest provider, or null outside one. */
export function useIconDefaults(): IconDefaults | null {
	return use(IconDefaultsContext);
}
