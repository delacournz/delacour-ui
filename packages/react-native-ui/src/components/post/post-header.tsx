import type { ReactElement } from "react";
import { View } from "react-native";
import { usePostPart } from "./post.context";
import type { PostSlotProps } from "./post.types";
import { postVariants } from "./post.variants";

/**
 * The row above the content — an author or a community, then actions.
 *
 * In the `media` variant it is laid `absolute` over the picture, which is why
 * `Post.Media` must follow it as the card's next child: the header leaves the
 * flow and the picture takes the top of the card.
 */
export function PostHeader({ className, ...props }: PostSlotProps): ReactElement {
	const { variant } = usePostPart("Post.Header");
	return <View className={postVariants({ variant }).header({ className })} {...props} />;
}
PostHeader.displayName = "DelacourUI.Post.Header";
