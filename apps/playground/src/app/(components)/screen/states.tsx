import { Button } from "delacour-react-native-ui/button";
import { Screen } from "delacour-react-native-ui/screen";
import { Text } from "delacour-react-native-ui/text";
import { useRouter } from "expo-router";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import { Section } from "@/components/section";

type State = "picker" | "loading" | "error" | "error-bare";

/**
 * The two whole-screen states a route can return instead of its content.
 *
 * Both keep the navbar by default: the frame does not jump when the real
 * content replaces them, and a user is never stranded on a screen they cannot
 * leave. `showNavbar={false}` drops it for a root screen with nowhere to go
 * back to.
 */
export default function ScreenStatesDemo(): ReactElement {
	const router = useRouter();
	const [state, setState] = useState<State>("picker");

	if (state === "loading") {
		return <Screen.Loading onBack={() => setState("picker")} title="Loading" />;
	}

	if (state === "error") {
		return (
			<Screen.Error
				message="The request timed out before the server answered. Check your connection and try again."
				onBack={() => setState("picker")}
			>
				<Button haptic="medium" onPress={() => setState("loading")} size="sm">
					Try again
				</Button>
			</Screen.Error>
		);
	}

	if (state === "error-bare") {
		return (
			<Screen.Error message="No navbar — for a root screen with nowhere to go back to." showNavbar={false}>
				<Button onPress={() => setState("picker")} variant="outline" size="sm">
					Back to the picker
				</Button>
			</Screen.Error>
		);
	}

	return (
		<Screen>
			<Screen.Navbar>
				<Screen.Navbar.BackButton onPress={() => router.back()}>
					<Screen.Navbar.Title>Loading and error</Screen.Navbar.Title>
				</Screen.Navbar.BackButton>
			</Screen.Navbar>

			<Screen.ScrollArea contentContainerClassName="gap-6">
				<Section title="States">
					<View className="gap-2">
						<Button onPress={() => setState("loading")}>Screen.Loading</Button>
						<Button onPress={() => setState("error")} variant="secondary">
							Screen.Error
						</Button>
						<Button onPress={() => setState("error-bare")} variant="outline">
							Screen.Error, no navbar
						</Button>
					</View>
				</Section>

				<Text.Caption>
					Each is a whole Screen, returned in place of the route's content. Nesting one inside another Screen is safe
					too — the provider passes the outer context through rather than shadowing it.
				</Text.Caption>
			</Screen.ScrollArea>
		</Screen>
	);
}
