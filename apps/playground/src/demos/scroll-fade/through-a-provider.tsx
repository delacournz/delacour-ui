import { ScrollSourceProvider, useScrollSource } from "@delacour/react-native-ui/hooks/use-scroll-source";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { ScrollFade } from "@delacour/react-native-ui/scroll-fade";
import type { ReactElement } from "react";
import Animated from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Through a provider",
	caption:
		"With no `scrollSource` prop the fade takes the nearest `ScrollSourceProvider` — the same path a `Screen` body takes, since every `Screen` mounts one. Useful when the fade sits a few components below the scrollable's owner.",
};

const ROWS = Array.from({ length: 12 }, (_, index) => `Row ${index + 1}`);

/** A fade that names no source, so it has to find one above it. */
function FadedRows({ children }: { children: ReactElement }): ReactElement {
	return <ScrollFade>{children}</ScrollFade>;
}

export function Demo(): ReactElement {
	const { source, scrollProps } = useScrollSource();

	return (
		<ScrollSourceProvider source={source}>
			<FadedRows>
				<Animated.ScrollView className="h-80" nestedScrollEnabled {...scrollProps}>
					<ListGroup>
						{ROWS.map((row) => (
							<ListGroup.Item key={row}>
								<ListGroup.ItemContent>
									<ListGroup.ItemTitle>{row}</ListGroup.ItemTitle>
								</ListGroup.ItemContent>
							</ListGroup.Item>
						))}
					</ListGroup>
				</Animated.ScrollView>
			</FadedRows>
		</ScrollSourceProvider>
	);
}
