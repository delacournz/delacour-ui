import { createContext, type ReactElement, type ReactNode, use } from "react";
import type { PostSize, PostVariant } from "./post.variants";

export type PostContextValue = {
	/** The card's shape — decides padding, the media's frame and where the author sits. */
	variant: PostVariant;
	/** Type and gap density. */
	size: PostSize;
};

const PostContext = createContext<PostContextValue | null>(null);

/**
 * Supplies the enclosing post's variant and size to its parts.
 *
 * Lives in its own module, importing nothing but `post.variants`, so a part can
 * read it without importing `./post` and closing a cycle through the root. See
 * AGENTS.md rule 3.
 */
export function PostProvider({ value, children }: { value: PostContextValue; children: ReactNode }): ReactElement {
	return <PostContext value={value}>{children}</PostContext>;
}
PostProvider.displayName = "DelacourUI.Post.Provider";

/** The enclosing post's context, or null outside a `<Post>`. */
export function usePostContext(): PostContextValue | null {
	return use(PostContext);
}

/**
 * Reads the enclosing post's variant and size.
 *
 * Lets a custom part match the card without props passed down through every
 * slot. Throws outside a `<Post>` — use {@link usePostContext} where the
 * enclosing post is optional.
 */
export function usePost(): PostContextValue {
	const context = usePostContext();
	if (!context) {
		throw new Error("usePost must be called inside a <Post>.");
	}
	return context;
}

/**
 * The enclosing post's context, for a compound part that cannot work without
 * one.
 *
 * Internal: deliberately not re-exported from `index.ts`. A caller outside the
 * library wants {@link usePost}, whose error message names the hook rather than
 * a part.
 */
export function usePostPart(component: string): PostContextValue {
	const context = usePostContext();
	if (!context) {
		throw new Error(`${component} must be rendered inside a <Post>.`);
	}
	return context;
}
