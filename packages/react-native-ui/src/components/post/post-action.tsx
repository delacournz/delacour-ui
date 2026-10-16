import type { ReactElement } from "react";
import { IconDefaultsProvider } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { usePostPart } from "./post.context";
import { POST_HIT_SLOP, POST_ON_MEDIA_COLOR, postVariants, resolvePostLayout } from "./post.variants";

export type PostActionProps = Omit<PressableProps, "asChild"> & {
	/** Required: an icon-only control has no other name. */
	accessibilityLabel: string;
};

/**
 * An icon button in the header — the ellipsis that opens the app's own menu or
 * sheet. Post opens nothing itself; `onPress` is the whole contract.
 *
 * A 32-point circle with a hit slop that takes it to 44, so the header row
 * stays compact without a target smaller than a fingertip. An `Icon` inside
 * inherits its size and a muted colour — white over the picture in `media`.
 */
export function PostAction({ className, children, hitSlop = POST_HIT_SLOP, ...props }: PostActionProps): ReactElement {
	const { variant, size } = usePostPart("Post.Action");
	const slots = postVariants({ variant, size });
	const color = resolvePostLayout(variant).authorOverMedia ? POST_ON_MEDIA_COLOR : "muted-foreground";

	return (
		<Pressable className={slots.action({ className })} feedback="scale-fade" hitSlop={hitSlop} {...props}>
			<IconDefaultsProvider value={{ className: slots.actionIcon(), color }}>{children}</IconDefaultsProvider>
		</Pressable>
	);
}
PostAction.displayName = "DelacourUI.Post.Action";
