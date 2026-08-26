import { Button } from "@delacour/native-ui/button";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Inside other components",
	caption:
		"A nested preset inherits the enclosing component's own type scale, not the library's. A bare Text in a Button picks up the label treatment with nothing said at the call site.",
};

export function Demo(): ReactElement {
	return (
		<View className="gap-3">
			<Button>
				<Button.Label>
					Save <Text.Strong>now</Text.Strong>
				</Button.Label>
			</Button>
			<Button variant="secondary">
				<Text>a bare Text, inheriting the label</Text>
			</Button>
			<ListGroup>
				<ListGroup.Item>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>
							Row with <Text.Strong>emphasis</Text.Strong>
						</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>
							Description with <Text color="danger">a colour</Text>
						</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix />
				</ListGroup.Item>
			</ListGroup>
		</View>
	);
}
