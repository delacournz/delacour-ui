import { describe, expect, jest, test } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { Slot } from "./slot";

type OptionalPressChildProps = { onPress?: () => void; onReceive: (onPress: (() => void) | undefined) => void };

/**
 * A child whose `onPress` is optional, like `Button`. It reports the handler it
 * receives instead of being pressed, because a press in the test renderer walks
 * up to the `Slot`'s own `onPress` prop and passes whether or not the child got it.
 */
function OptionalPressChild({ onPress, onReceive }: OptionalPressChildProps): ReactElement | null {
	onReceive(onPress);
	return null;
}

describe("Slot", () => {
	test("rejects a fragment child, which cannot receive props", async () => {
		jest.spyOn(console, "error").mockImplementation(() => {});
		await expect(
			render(
				<Slot onPress={jest.fn()}>
					<>
						<OptionalPressChild onReceive={() => {}} />
					</>
				</Slot>
			)
		).rejects.toThrow("Slot expects a single React element child; text and fragments cannot receive props.");
		jest.restoreAllMocks();
	});
});
