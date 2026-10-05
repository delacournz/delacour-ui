import { Breadcrumb } from "@delacour/react-native-ui/breadcrumb";
import { Icon } from "@delacour/react-native-ui/icon";
import { IconHome } from "@delacour/react-native-ui/icons/central";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Custom separator",
	caption:
		"The root's `separator` replaces every chevron — a string is drawn as muted text. An `Icon` inside a link takes the glyph's size and colour.",
	capture: {},
};

const TRAIL = ["Projects", "Delacour", "Docs"] as const;

export function Demo(): ReactElement {
	return (
		<View className="gap-6">
			<Breadcrumb separator="/">
				<Breadcrumb.List>
					{TRAIL.map((crumb) => (
						<Breadcrumb.Item key={crumb}>
							<Breadcrumb.Link onPress={() => {}}>{crumb}</Breadcrumb.Link>
						</Breadcrumb.Item>
					))}
					<Breadcrumb.Item>
						<Breadcrumb.Page>Getting started</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
			<Breadcrumb separator="·">
				<Breadcrumb.List>
					<Breadcrumb.Item>
						<Breadcrumb.Link accessibilityLabel="Home" onPress={() => {}}>
							<Icon icon={IconHome} />
						</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Item>
						<Breadcrumb.Link onPress={() => {}}>Account</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Item>
						<Breadcrumb.Page>Billing</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb>
		</View>
	);
}
