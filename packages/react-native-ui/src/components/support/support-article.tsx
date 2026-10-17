import type { ReactElement } from "react";
import { IconChevronRight } from "../../icons/central";
import { Icon } from "../icon";
import { Item, type ItemProps } from "../item";

export type SupportArticleProps = Omit<ItemProps, "asChild" | "children" | "isSelected" | "orientation"> & {
	title: string;
	/** The help-centre collection it sits in, as a caption under the title. */
	collection?: string;
	className?: string;
};

/** One help-centre page, as a row in `Support.Articles`: its title, its collection, a chevron. */
export function SupportArticle({ title, collection, ...props }: SupportArticleProps): ReactElement {
	return (
		<Item {...props}>
			<Item.Content>
				<Item.Title numberOfLines={2}>{title}</Item.Title>
				{collection ? <Item.Description numberOfLines={1}>{collection}</Item.Description> : null}
			</Item.Content>
			<Item.Actions>
				<Icon icon={IconChevronRight} />
			</Item.Actions>
		</Item>
	);
}
SupportArticle.displayName = "DelacourUI.Support.Article";
