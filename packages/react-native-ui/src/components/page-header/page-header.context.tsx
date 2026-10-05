import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { AvatarSize } from "../avatar/avatar.variants";
import type { SurfacePlane } from "../surface/surface.variants";
import type { PageHeaderAlign, PageHeaderVariant } from "./page-header.variants";

export type PageHeaderContextValue = {
	/** `card` or `page`. */
	variant: PageHeaderVariant;
	/** Where the face and the text sit. */
	align: PageHeaderAlign;
	/** Whether a `PageHeader.Cover` is mounted — what makes the avatar lift over it. */
	hasCover: boolean;
	/** The avatar size the alignment defaults to. A `PageHeader.Avatar` may still state its own. */
	avatarSize: AvatarSize;
	/** The surface fill the header is drawn on — `default` for a card, `null` on the page. */
	plane: SurfacePlane | null;
};

/** How a cover tells the root it is there. Internal — a caller never registers a cover by hand. */
export type PageHeaderCoverRegistry = (isMounted: boolean) => void;

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);
const PageHeaderCoverRegistryContext = createContext<PageHeaderCoverRegistry | null>(null);

/**
 * Supplies the header's variant, alignment and cover state to its parts.
 *
 * Lives in its own module, importing nothing but types, so a part can read it
 * without importing `./page-header` and closing a cycle through the root. See
 * the package AGENTS.md rule 3.
 *
 * The cover's registration travels in a second context rather than as a field
 * here: the setter never changes, so a part that only registers does not
 * re-render when `hasCover` flips.
 */
export function PageHeaderProvider({
	value,
	registerCover,
	children,
}: {
	value: PageHeaderContextValue;
	registerCover: PageHeaderCoverRegistry;
	children: ReactNode;
}): ReactElement {
	return (
		<PageHeaderCoverRegistryContext value={registerCover}>
			<PageHeaderContext value={value}>{children}</PageHeaderContext>
		</PageHeaderCoverRegistryContext>
	);
}
PageHeaderProvider.displayName = "DelacourUI.PageHeader.Provider";

/** The enclosing header's context, or null outside a `<PageHeader>`. */
export function usePageHeaderContext(): PageHeaderContextValue | null {
	return use(PageHeaderContext);
}

/**
 * Reads the enclosing header's variant, alignment and cover state.
 *
 * Lets a custom part match the header — a skeleton sized to `avatarSize`, a
 * badge that reads against `plane` — without props passed down. Throws outside
 * a `<PageHeader>`; use {@link usePageHeaderContext} where it is optional.
 */
export function usePageHeader(): PageHeaderContextValue {
	const context = usePageHeaderContext();
	if (!context) {
		throw new Error("usePageHeader must be called inside a <PageHeader>.");
	}
	return context;
}

/**
 * The enclosing header's context, for a part that cannot work without one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link usePageHeader}, whose error names the hook.
 */
export function usePageHeaderPart(component: string): PageHeaderContextValue {
	const context = usePageHeaderContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <PageHeader>.`);
	}
	return context;
}

/** The cover's registration callback, or null outside a `<PageHeader>`. Internal. */
export function usePageHeaderCoverRegistry(): PageHeaderCoverRegistry | null {
	return use(PageHeaderCoverRegistryContext);
}
