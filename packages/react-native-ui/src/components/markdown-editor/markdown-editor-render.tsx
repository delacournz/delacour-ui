import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { Text } from "../text";
import type { MarkdownBlock, MarkdownInline } from "./markdown-editor.parse";
import { markdownEditorVariants, markdownInlineToText, resolveMarkdownListMarker } from "./markdown-editor.variants";

type InlineProps = {
	nodes: readonly MarkdownInline[];
	onLinkPress: (url: string) => void;
};

/**
 * Inline content as nested `Text` — each run inherits the paragraph's size and
 * colour and changes only its own axis, which is what `Text`'s class context
 * is for. Strikethrough has no preset, so it is a bare `Text` with the one
 * utility.
 */
function MarkdownInlines({ nodes, onLinkPress }: InlineProps): ReactNode {
	return nodes.map((node, index) => {
		const key = `${node.type}-${index}`;
		switch (node.type) {
			case "text":
				return node.value;
			case "code":
				return <Text.Code key={key}>{node.value}</Text.Code>;
			case "bold":
				return (
					<Text.Strong key={key}>
						<MarkdownInlines nodes={node.children} onLinkPress={onLinkPress} />
					</Text.Strong>
				);
			case "italic":
				return (
					<Text.Emphasis key={key}>
						<MarkdownInlines nodes={node.children} onLinkPress={onLinkPress} />
					</Text.Emphasis>
				);
			case "strikethrough":
				return (
					<Text className="line-through" key={key}>
						<MarkdownInlines nodes={node.children} onLinkPress={onLinkPress} />
					</Text>
				);
			case "link":
				return (
					<Text.Link accessibilityHint={node.url} key={key} onPress={() => onLinkPress(node.url)}>
						<MarkdownInlines nodes={node.children} onLinkPress={onLinkPress} />
					</Text.Link>
				);
			default: {
				const exhaustive: never = node;
				return exhaustive;
			}
		}
	});
}
MarkdownInlines.displayName = "DelacourUI.MarkdownEditor.Inlines";

type ListProps = {
	list: Extract<MarkdownBlock, { type: "list" }>;
	onLinkPress: (url: string) => void;
};

/**
 * A list's rows. Each row's accessible text starts with its marker, so a screen
 * reader says "bullet" or "2." before the item rather than nothing.
 */
function MarkdownList({ list, onLinkPress }: ListProps): ReactElement {
	const slots = markdownEditorVariants();
	const rows = list.items.map((item, index) => {
		const marker = resolveMarkdownListMarker(list.ordered, list.start, index);
		return {
			id: `item-${index}`,
			item,
			label: `${list.ordered ? marker : "bullet"} ${markdownInlineToText(item)}`,
			marker,
		};
	});
	return (
		<View className="gap-1">
			{rows.map((row) => (
				<View accessibilityLabel={row.label} accessible className={slots.listItem()} key={row.id}>
					<Text.Paragraph className={slots.listMarker()}>{row.marker}</Text.Paragraph>
					<Text.Paragraph className="flex-1">
						<MarkdownInlines nodes={row.item} onLinkPress={onLinkPress} />
					</Text.Paragraph>
				</View>
			))}
		</View>
	);
}
MarkdownList.displayName = "DelacourUI.MarkdownEditor.List";

type BlocksProps = {
	blocks: readonly MarkdownBlock[];
	onLinkPress: (url: string) => void;
};

/**
 * Parsed blocks as the library's own type scale.
 *
 * Heading one is `Text.Title` and two is `Text.Header`; three is `Text.Header`
 * a step down at `lg`, because the scale's next preset, `Text.Subheader`, is
 * muted and deliberately not announced as a heading. All three carry the
 * `header` role.
 */
export function MarkdownBlocks({ blocks, onLinkPress }: BlocksProps): ReactElement {
	const slots = markdownEditorVariants();
	return (
		<>
			{blocks.map((block, index) => {
				const key = `${block.type}-${index}`;
				switch (block.type) {
					case "heading": {
						const content = <MarkdownInlines nodes={block.children} onLinkPress={onLinkPress} />;
						if (block.level === 1) return <Text.Title key={key}>{content}</Text.Title>;
						if (block.level === 2) return <Text.Header key={key}>{content}</Text.Header>;
						return (
							<Text.Header key={key} size="lg">
								{content}
							</Text.Header>
						);
					}
					case "paragraph":
						return (
							<Text.Paragraph key={key}>
								<MarkdownInlines nodes={block.children} onLinkPress={onLinkPress} />
							</Text.Paragraph>
						);
					case "quote":
						return (
							<View className={slots.quote()} key={key}>
								<MarkdownBlocks blocks={block.children} onLinkPress={onLinkPress} />
							</View>
						);
					case "codeBlock":
						return (
							<View accessibilityLabel={block.value} className={slots.codeBlock()} key={key}>
								<Text.Code className="bg-transparent" size="sm">
									{block.value}
								</Text.Code>
							</View>
						);
					case "list":
						return <MarkdownList key={key} list={block} onLinkPress={onLinkPress} />;
					default: {
						const exhaustive: never = block;
						return exhaustive;
					}
				}
			})}
		</>
	);
}
MarkdownBlocks.displayName = "DelacourUI.MarkdownEditor.Blocks";
