import type { ReactElement } from "react";
import { View } from "react-native";
import { usePostPart } from "./post.context";
import type { PostSlotProps } from "./post.types";
import { postVariants } from "./post.variants";

/**
 * The row of counts under the content — `Post.Stat`s, a `Post.Votes`, or
 * anything else. A stat with `align="end"` pushes itself and every stat after
 * it to the trailing edge.
 */
export function PostFooter({ className, ...props }: PostSlotProps): ReactElement {
	const { variant } = usePostPart("Post.Footer");
	return <View className={postVariants({ variant }).footer({ className })} {...props} />;
}
PostFooter.displayName = "DelacourUI.Post.Footer";
