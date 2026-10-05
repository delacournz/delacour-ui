import { Button } from "@delacour/react-native-ui/button";
import { ListGroup } from "@delacour/react-native-ui/list-group";
import { Popover } from "@delacour/react-native-ui/popover";
import { type ReactElement, useState } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Scrollable",
	caption: "`maxHeight` caps the panel and `isScrollable` scrolls what does not fit. The arrow stays put.",
	align: "center",
};

const TIMEZONES = [
	"Auckland",
	"Sydney",
	"Tokyo",
	"Singapore",
	"Dubai",
	"Berlin",
	"London",
	"São Paulo",
	"New York",
	"Chicago",
	"Denver",
	"Los Angeles",
	"Honolulu",
] as const;

export function Demo(): ReactElement {
	const [zone, setZone] = useState<string>(TIMEZONES[0]);
	const [isOpen, setOpen] = useState(false);

	return (
		<Popover isOpen={isOpen} onOpenChange={setOpen}>
			<Popover.Trigger asChild>
				<Button testID="open-popover" variant="outline">
					{zone}
				</Button>
			</Popover.Trigger>
			<Popover.Content className="p-1" isScrollable maxHeight={240} minWidth={220}>
				<Popover.Arrow />
				<ListGroup variant="transparent">
					{TIMEZONES.map((name) => (
						<ListGroup.Item
							key={name}
							onPress={() => {
								setZone(name);
								setOpen(false);
							}}
						>
							<ListGroup.ItemContent>
								<ListGroup.ItemTitle>{name}</ListGroup.ItemTitle>
							</ListGroup.ItemContent>
						</ListGroup.Item>
					))}
				</ListGroup>
			</Popover.Content>
		</Popover>
	);
}
