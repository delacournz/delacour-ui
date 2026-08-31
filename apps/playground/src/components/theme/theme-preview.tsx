import { Badge } from "@delacour/native-ui/badge";
import { Button } from "@delacour/native-ui/button";
import { Checkbox } from "@delacour/native-ui/checkbox";
import { Field } from "@delacour/native-ui/field";
import { Icon } from "@delacour/native-ui/icon";
import { IconGlobe, IconRocket } from "@delacour/native-ui/icons/central";
import { Input } from "@delacour/native-ui/input";
import { ListGroup } from "@delacour/native-ui/list-group";
import { Radio } from "@delacour/native-ui/radio";
import { Separator } from "@delacour/native-ui/separator";
import { Switch } from "@delacour/native-ui/switch";
import { Text } from "@delacour/native-ui/text";
import { type ReactElement, type ReactNode, useState } from "react";
import { View } from "react-native";

/** The card surfaces, as data, so the pair stays symmetrical. */
const PROJECTS = [
	{ name: "Aurora", members: "12 collaborators", status: "Deployed", color: "success" },
	{ name: "Beacon", members: "4 collaborators", status: "Building", color: "warning" },
] as const;

const ARTEFACTS = [
	{ label: "Source maps", value: "sourcemaps" },
	{ label: "Bundle report", value: "bundle" },
	{ label: "Type declarations", value: "types" },
] as const;

const ENVIRONMENTS = [
	{ value: "preview", label: "Preview", hint: "A throwaway URL for every branch" },
	{ value: "staging", label: "Staging", hint: "Shared, and reset each night" },
	{ value: "production", label: "Production", hint: "Whatever the default branch holds" },
] as const;

/** A labelled block, so every section below is spaced and titled the same way. */
function PreviewSection({ label, children }: { label: string; children: ReactNode }): ReactElement {
	return (
		<View className="gap-2">
			<Text.Label>{label}</Text.Label>
			{children}
		</View>
	);
}
PreviewSection.displayName = "Playground.Theme.PreviewSection";

/**
 * The library under whatever the axes above are set to.
 *
 * The axis rows report a configuration in words; this is the only thing on the
 * screen that reports it as an interface. A palette is a list of names until
 * something is drawn with it, and the question the customizer exists to answer
 * — does this library hold up under someone else's brand — cannot be answered
 * by seven summary rows and a swatch.
 *
 * Every control here is live rather than a static mock. A pressed button, a
 * focused field and a checked box each paint tokens that a resting one does
 * not, and those are exactly the states a palette tends to fall over on.
 *
 * Nothing here is styled by hand — every colour is a token a component already
 * reads. The one thing set rather than defaulted is `color="primary"` on the
 * switches and the checkboxes: both default to a neutral, which is right for a
 * settings screen and useless here, because a preview whose selection controls
 * never take the accent is a preview of the base ramp. `Radio` already defaults
 * to `primary`, so it is left alone.
 */
export function ThemePreview(): ReactElement {
	return (
		<View className="gap-6">
			<Separator />
			<View className="gap-1">
				<Text.Subheader>Preview</Text.Subheader>
				<Text.Caption color="muted">
					The same components a consuming app would mount, on the tokens chosen above.
				</Text.Caption>
			</View>

			<ButtonsPreview />
			<SurfacesPreview />
			<TogglesPreview />
			<ChoicesPreview />
			<FormPreview />
		</View>
	);
}
ThemePreview.displayName = "Playground.ThemePreview";

/** Every variant at once — the fastest read on whether an accent has enough contrast. */
function ButtonsPreview(): ReactElement {
	return (
		<PreviewSection label="Buttons">
			<View className="flex-row flex-wrap gap-2">
				<Button size="sm">Publish</Button>
				<Button size="sm" variant="secondary">
					Duplicate
				</Button>
				<Button size="sm" variant="outline">
					Rename
				</Button>
				<Button size="sm" variant="ghost">
					Cancel
				</Button>
				<Button size="sm" variant="destructive-soft">
					Archive
				</Button>
				<Button size="sm" variant="destructive">
					Delete
				</Button>
			</View>
			<Button isLoading size="sm" variant="secondary">
				Deploying
			</Button>
		</PreviewSection>
	);
}
ButtonsPreview.displayName = "Playground.Theme.ButtonsPreview";

/**
 * Two raised cards, on the two surface tokens that are easiest to get wrong.
 *
 * `bg-card` against `bg-secondary` is where a base colour with too little
 * separation between its steps stops reading as two surfaces at all.
 */
function SurfacesPreview(): ReactElement {
	return (
		<PreviewSection label="Surfaces">
			<View className="flex-row gap-3">
				{PROJECTS.map((project) => (
					<View className="flex-1 gap-2 rounded-lg border border-border bg-card p-4" key={project.name}>
						<Icon icon={IconRocket} />
						<View className="gap-0.5">
							<Text.Subheader>{project.name}</Text.Subheader>
							<Text.Caption color="muted">{project.members}</Text.Caption>
						</View>
						<View className="flex-row">
							<Badge color={project.color} size="sm" variant="soft">
								{project.status}
							</Badge>
						</View>
					</View>
				))}
			</View>
		</PreviewSection>
	);
}
SurfacesPreview.displayName = "Playground.Theme.SurfacesPreview";

/** A grouped list with a control in the suffix — the shape most settings screens are. */
function TogglesPreview(): ReactElement {
	const [isAutomatic, setAutomatic] = useState(true);
	const [hasComments, setComments] = useState(false);

	return (
		<PreviewSection label="List group">
			<ListGroup>
				<ListGroup.Item>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>Automatic deploys</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>Ship every merge to the default branch</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<Switch color="primary" isSelected={isAutomatic} onSelectedChange={setAutomatic} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
				<ListGroup.Item>
					<ListGroup.ItemContent>
						<ListGroup.ItemTitle>Preview comments</ListGroup.ItemTitle>
						<ListGroup.ItemDescription>Post the branch URL on each pull request</ListGroup.ItemDescription>
					</ListGroup.ItemContent>
					<ListGroup.ItemSuffix>
						<Switch color="primary" isSelected={hasComments} onSelectedChange={setComments} />
					</ListGroup.ItemSuffix>
				</ListGroup.Item>
			</ListGroup>
		</PreviewSection>
	);
}
TogglesPreview.displayName = "Playground.Theme.TogglesPreview";

/**
 * The two selection controls, side by side in the same block.
 *
 * They are the pair that shares a token and diverges in shape, so a palette
 * that reads on one and not the other shows up here and nowhere else.
 */
function ChoicesPreview(): ReactElement {
	const [artefacts, setArtefacts] = useState<string[]>(["sourcemaps"]);
	const [environment, setEnvironment] = useState("staging");

	return (
		<PreviewSection label="Checkbox and radio">
			<View className="gap-4 rounded-lg border border-border bg-card p-4">
				<Checkbox.Group checked={artefacts} color="primary" onChecked={setArtefacts}>
					{ARTEFACTS.map((artefact) => (
						<Checkbox key={artefact.value} value={artefact.value}>
							<Checkbox.Label>{artefact.label}</Checkbox.Label>
						</Checkbox>
					))}
				</Checkbox.Group>

				<Separator />

				<Radio.Group accessibilityLabel="Environment" onSelected={setEnvironment} selected={environment}>
					{ENVIRONMENTS.map((environmentOption) => (
						<Radio key={environmentOption.value} value={environmentOption.value}>
							<View className="min-w-0 shrink gap-0.5">
								<Radio.Label>{environmentOption.label}</Radio.Label>
								<Text.Caption color="muted">{environmentOption.hint}</Text.Caption>
							</View>
						</Radio>
					))}
				</Radio.Group>
			</View>
		</PreviewSection>
	);
}
ChoicesPreview.displayName = "Playground.Theme.ChoicesPreview";

/**
 * A short form, carrying one field in its invalid state on purpose.
 *
 * `destructive` is the token a palette is least likely to have been checked
 * against, and an error is the only place it appears on type rather than on a
 * filled button.
 */
function FormPreview(): ReactElement {
	const [project, setProject] = useState("aurora");
	const [domain, setDomain] = useState("aurora.example");

	const isDomainInvalid = domain.trim().length > 0 && !domain.includes(".");

	return (
		<PreviewSection label="Fields and inputs">
			<Field.Set>
				<Field.Group>
					<Field>
						<Field.Label>Project name</Field.Label>
						<Input autoCapitalize="none" onChangeText={setProject} value={project} />
						<Field.Description>Used for the generated preview URLs.</Field.Description>
					</Field>

					<Field isInvalid={isDomainInvalid}>
						<Field.Label>Custom domain</Field.Label>
						<Input.Group>
							<Input.Group.Prefix>
								<Icon icon={IconGlobe} />
							</Input.Group.Prefix>
							<Input autoCapitalize="none" onChangeText={setDomain} placeholder="example.com" value={domain} />
						</Input.Group>
						<Field.Error>{isDomainInvalid ? "Include a top-level domain." : undefined}</Field.Error>
					</Field>

					<Field isDisabled>
						<Field.Label>Region</Field.Label>
						<Input value="Sydney" />
					</Field>
				</Field.Group>
			</Field.Set>

			<View className="gap-2 pt-2">
				<Button>Save changes</Button>
				<Button variant="destructive-soft">Discard</Button>
			</View>
		</PreviewSection>
	);
}
FormPreview.displayName = "Playground.Theme.FormPreview";
