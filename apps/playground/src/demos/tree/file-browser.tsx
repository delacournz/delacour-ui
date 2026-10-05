import { Badge } from "@delacour/react-native-ui/badge";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconFileText, IconFolder1, IconFolderOpen } from "@delacour/react-native-ui/icons/central";
import { Tree, useTreeItem } from "@delacour/react-native-ui/tree";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "File browser",
	caption:
		"Folders open from the chevron or the row, files select. A folder glyph that follows its branch reads `useTreeItem`; the count sits in `Tree.Actions`, outside the row's tap target.",
};

/** A folder glyph that opens with its branch. */
function FolderIcon(): ReactElement {
	const { isExpanded } = useTreeItem();
	return <Icon icon={isExpanded ? IconFolderOpen : IconFolder1} />;
}

function Folder({
	value,
	name,
	count,
	children,
}: {
	value: string;
	name: string;
	count?: number;
	children: ReactElement | ReactElement[];
}): ReactElement {
	return (
		<Tree.Item testID={`file-browser-${value}`} value={value}>
			<Tree.Trigger>
				<Tree.Icon>
					<FolderIcon />
				</Tree.Icon>
				<Tree.Label>{name}</Tree.Label>
				{count === undefined ? null : (
					<Tree.Actions>
						<Badge size="sm" variant="soft">
							{count}
						</Badge>
					</Tree.Actions>
				)}
			</Tree.Trigger>
			<Tree.Group>{children}</Tree.Group>
		</Tree.Item>
	);
}

function File({ value, name }: { value: string; name: string }): ReactElement {
	return (
		<Tree.Item testID={`file-browser-${value}`} value={value}>
			<Tree.Trigger>
				<Tree.Icon>
					<Icon icon={IconFileText} />
				</Tree.Icon>
				<Tree.Label>{name}</Tree.Label>
			</Tree.Trigger>
		</Tree.Item>
	);
}

export function Demo(): ReactElement {
	return (
		<Tree defaultExpanded={["src", "src/components"]} defaultValue="src/components/button.tsx" selectionMode="single">
			<Folder count={4} name="src" value="src">
				<Folder count={2} name="components" value="src/components">
					<File name="button.tsx" value="src/components/button.tsx" />
					<File name="tree.tsx" value="src/components/tree.tsx" />
				</Folder>
				<Folder name="hooks" value="src/hooks">
					<File name="use-theme.ts" value="src/hooks/use-theme.ts" />
				</Folder>
				<File name="index.ts" value="src/index.ts" />
			</Folder>
			<Folder name="assets" value="assets">
				<File name="icon.png" value="assets/icon.png" />
			</Folder>
			<File name="package.json" value="package.json" />
		</Tree>
	);
}
