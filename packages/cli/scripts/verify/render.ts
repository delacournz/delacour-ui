import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ResolvedConfig } from "../../src/config/resolve";
import { type Reporter, run } from "./harness";

/**
 * The two deeper stages: bundle it with Metro, then boot it on a simulator.
 *
 * `tsc` proves every import resolves and every type lines up. It says nothing
 * about the part of this stack that is not TypeScript — Uniwind compiles
 * `className` in a **Metro transform**, and a class the scanner never saw is
 * silently dropped rather than reported. Only a real bundle exercises that.
 *
 * So `--bundle` runs `expo export`, which is the whole pipeline minus the
 * native build: Metro resolves every module, Uniwind compiles every class, and
 * a cycle or a missing asset fails loudly. `--simulator` goes the last step and
 * builds a dev client, because Reanimated, Gesture Handler and the keyboard
 * controller are native modules that Expo Go cannot load.
 */

/** Imports every component so Metro must resolve all of them, and renders what is safe to render bare. */
function screen(aliases: Partial<Record<string, string>>): string {
	const ui = aliases.ui ?? "./components/ui";
	const lib = aliases.lib ?? "./lib";
	const styles = aliases.styles ?? "./styles";

	// First statement, and load-bearing. `withUniwindConfig`'s `cssEntryFile`
	// tells the transformer what to compile; it does not put the CSS in the
	// bundle. Without this import the app boots and renders every component
	// completely unstyled, with nothing logged — which is what the first
	// simulator run of this script actually did, and why `doctor` now checks it.
	return `import "${styles}/global.css";

import { ScrollView, View } from "react-native";

import { DelacourProvider } from "${ui}/provider";
import { Accordion } from "${ui}/accordion";
import { Badge } from "${ui}/badge";
import { BottomSheet } from "${ui}/bottom-sheet";
import { Button } from "${ui}/button";
import { Checkbox } from "${ui}/checkbox";
import { Field } from "${ui}/field";
import { Icon } from "${ui}/icon";
import { Input } from "${ui}/input";
import { ListGroup } from "${ui}/list-group";
import { Pressable } from "${ui}/pressable";
import { Radio } from "${ui}/radio";
import { Screen } from "${ui}/screen";
import { Separator } from "${ui}/separator";
import { Slider } from "${ui}/slider";
import { Spinner } from "${ui}/spinner";
import { Switch } from "${ui}/switch";
import { Tabs } from "${ui}/tabs";
import { Text } from "${ui}/text";
import { cn } from "${lib}/cn";

// Referenced so the bundler cannot tree-shake an import away and hide a module
// that would have failed to resolve.
const REGISTERED = [
	Accordion, Badge, BottomSheet, Button, Checkbox, Field, Icon, Input, ListGroup,
	Pressable, Radio, Screen, Separator, Slider, Spinner, Switch, Tabs, Text,
];

/**
 * Every component the CLI copied, rendered on one screen.
 *
 * The point is the transform, not the design: if this mounts with visible
 * styling, Uniwind compiled the classes and every native module registered.
 *
 * \`Slider\` is written out in full because it is compound — a bare root has no
 * track and draws nothing at all, which a first pass of this screen did, and
 * which no assertion short of looking at the device would have caught.
 */
export function VerifyScreen() {
	return (
		<DelacourProvider>
			<ScrollView contentContainerClassName="gap-4 p-4 pt-24" testID="verify-scroll">
				<Text.Title testID="verify-heading">delacour verify</Text.Title>
				<Text.Paragraph>{REGISTERED.length} components imported.</Text.Paragraph>

				<Button testID="verify-button">Primary</Button>
				<Button isLoading testID="verify-loading">Loading</Button>
				<Button variant="outline">Outline</Button>

				<View className={cn("flex-row", "gap-2")}>
					<Badge>New</Badge>
					<Badge color="success" variant="soft">Live</Badge>
				</View>

				<Separator />

				<Checkbox defaultChecked testID="verify-checkbox">Checkbox</Checkbox>
				<Switch defaultSelected testID="verify-switch" />
				<Radio.Group defaultSelected="a">
					<Radio value="a">First</Radio>
					<Radio value="b">Second</Radio>
				</Radio.Group>

				<Field>
					<Field.Label>Email</Field.Label>
					<Input placeholder="you@example.com" testID="verify-input" />
					<Field.Description>We never share it.</Field.Description>
				</Field>

				<Slider defaultValue={40} testID="verify-slider">
					<Slider.Track>
						{({ values }) => (
							<>
								<Slider.Fill />
								{values.map((_, index) => (
									<Slider.Thumb index={index} key={index} />
								))}
							</>
						)}
					</Slider.Track>
				</Slider>

				<Spinner testID="verify-spinner" />

				<ListGroup>
					<ListGroup.Item>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>A row</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
					</ListGroup.Item>
					<ListGroup.Item>
						<ListGroup.ItemContent>
							<ListGroup.ItemTitle>Another row</ListGroup.ItemTitle>
						</ListGroup.ItemContent>
					</ListGroup.Item>
				</ListGroup>

				<Accordion defaultValue="one">
					<Accordion.Item value="one">
						<Accordion.Trigger>
							<Accordion.Title>Section</Accordion.Title>
						</Accordion.Trigger>
						<Accordion.Content>
							<Text.Paragraph>Panel content.</Text.Paragraph>
						</Accordion.Content>
					</Accordion.Item>
				</Accordion>
			</ScrollView>
		</DelacourProvider>
	);
}
`;
}

export type RenderOptions = {
	appDir: string;
	config: ResolvedConfig;
	reporter: Reporter;
};

/** Replaces the placeholder screen with one that mounts everything. */
export async function writeVerifyScreen(options: RenderOptions): Promise<void> {
	const path = join(options.appDir, "src/app.tsx");
	await mkdir(dirname(path), { recursive: true });

	await writeFile(path, `${screen(options.config.aliases)}\nexport { VerifyScreen as App };\n`, "utf-8");
	options.reporter.pass("wrote a screen that mounts every component");
}

/**
 * Bundles with Metro.
 *
 * `expo export` is the whole pipeline short of the native build, so it is the
 * cheapest thing that exercises the Uniwind transform — and the only stage
 * below a simulator that can fail on a class nobody compiled.
 */
export async function bundleWithMetro(appDir: string, reporter: Reporter): Promise<void> {
	await run("bunx", ["expo", "export", "--platform", "ios", "--output-dir", "dist-verify"], {
		cwd: appDir,
		reporter,
		label: "expo export",
	});
}

/**
 * Prebuilds and runs a dev client on a simulator.
 *
 * Expo Go cannot load this app: Reanimated, Gesture Handler and
 * `react-native-keyboard-controller` are native modules that have to be in the
 * binary. That makes this the slowest stage by a wide margin — a cold pod
 * install and an Xcode build — and the reason it is opt-in and not in CI.
 */
export async function bootOnSimulator(appDir: string, reporter: Reporter): Promise<void> {
	await run("bunx", ["expo", "prebuild", "--platform", "ios", "--clean"], {
		cwd: appDir,
		reporter,
		label: "expo prebuild",
	});

	// Release, so the JS bundle is embedded in the binary: the app then renders
	// standalone instead of waiting on a Metro server this script does not keep
	// running, and `run:ios` exits rather than hanging on a bundler.
	await run("bunx", ["expo", "run:ios", "--configuration", "Release", "--no-bundler"], {
		cwd: appDir,
		reporter,
		label: "expo run:ios",
	});
}
