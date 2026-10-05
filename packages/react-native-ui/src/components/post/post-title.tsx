import type { ReactElement } from "react";
import { Text, type TextProps } from "../text";
import { usePostPart } from "./post.context";
import { postVariants } from "./post.variants";

export type PostTitleProps = TextProps & { className?: string };

/**
 * A post's headline — the line a `vote` card leads with.
 *
 * Announced as a header, so a screen reader's rotor can jump card to card by
 * title in a long feed.
 */
export function PostTitle({ className, ...props }: PostTitleProps): ReactElement {
	const { variant, size } = usePostPart("Post.Title");
	return (
		<Text accessibilityRole="header" className={postVariants({ variant, size }).title({ className })} {...props} />
	);
}
PostTitle.displayName = "DelacourUI.Post.Title";
