import { BREADCRUMB_SIZES, Breadcrumb, type BreadcrumbSize } from "@delacour/react-native-ui/breadcrumb";
import { Text } from "@delacour/react-native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes",
	caption: "`sm` sets the labels on the caption step and `md` on the body step; the chevrons follow.",
};

const LABELS: Record<BreadcrumbSize, string> = {
	sm: "Small",
	md: "Medium",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			{BREADCRUMB_SIZES.map((size) => (
				<View className="gap-2" key={size}>
					<Text.Caption color="muted">{LABELS[size]}</Text.Caption>
					<Breadcrumb size={size}>
						<Breadcrumb.List>
							<Breadcrumb.Item>
								<Breadcrumb.Link onPress={() => {}}>Library</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Item>
								<Breadcrumb.Link onPress={() => {}}>Albums</Breadcrumb.Link>
							</Breadcrumb.Item>
							<Breadcrumb.Item>
								<Breadcrumb.Page>Summer 2026</Breadcrumb.Page>
							</Breadcrumb.Item>
						</Breadcrumb.List>
					</Breadcrumb>
				</View>
			))}
		</View>
	);
}
