import { Item } from "@delacour/react-native-ui/item";
import { Sortable } from "@delacour/react-native-ui/sortable";
import { type ReactElement, useState } from "react";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Auto-scroll",
	caption:
		"Pass the scroller's animated ref as `scrollRef` and a row dragged near either edge scrolls the list, faster the closer it gets.",
};

const ROWS = Array.from({ length: 40 }, (_, index) => `row-${index + 1}`);

export function Demo(): ReactElement {
	const [order, setOrder] = useState(ROWS);
	const scrollRef = useAnimatedRef<Animated.ScrollView>();

	return (
		<Animated.ScrollView className="h-96" contentContainerClassName="py-2" ref={scrollRef} testID="sortable-scroll">
			<Sortable gap={6} onReorder={setOrder} scrollRef={scrollRef} value={order}>
				{order.map((id) => (
					<Sortable.Item id={id} key={id}>
						<Item size="sm" variant="outline">
							<Item.Content>
								<Item.Title>{`Item ${id.slice(4)}`}</Item.Title>
							</Item.Content>
							<Item.Actions>
								<Sortable.Handle testID={`sortable-scroll-${id}`} />
							</Item.Actions>
						</Item>
					</Sortable.Item>
				))}
			</Sortable>
		</Animated.ScrollView>
	);
}
