import { Field } from "@delacour/native-ui/field";
import { SLIDER_COLORS, SLIDER_SIZES, Slider } from "@delacour/native-ui/slider";
import { Text } from "@delacour/native-ui/text";
import type { ReactElement } from "react";
import { useState } from "react";
import { View } from "react-native";
import { GalleryScreen } from "@/components/gallery-screen";
import { Section } from "@/components/section";

const CURRENCY = { currency: "NZD", style: "currency", maximumFractionDigits: 0 } as const;

export default function SliderGallery(): ReactElement {
	const [volume, setVolume] = useState(30);
	const [price, setPrice] = useState<number[]>([200, 800]);
	const [settled, setSettled] = useState<number | number[]>(30);

	return (
		<GalleryScreen subtitle={`Volume ${volume}`} title="Slider">
			<Section title="Anatomy">
				<Slider defaultValue={30}>
					<Slider.Output />
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb />
					</Slider.Track>
				</Slider>
				<Text.Caption color="muted">
					One Gesture.Pan on the track drives every thumb. Touching down grabs the nearest one and moves it to the
					finger, so a press on empty groove lifts the handle it is about to move.
				</Text.Caption>
			</Section>

			<Section title="Colours">
				<View className="gap-5">
					{SLIDER_COLORS.map((color) => (
						<View className="gap-2" key={color}>
							<Text.Caption color="muted">{color}</Text.Caption>
							<Slider color={color} defaultValue={65}>
								<Slider.Track>
									<Slider.Fill />
									<Slider.Thumb />
								</Slider.Track>
							</Slider>
						</View>
					))}
				</View>
				<Text.Caption color="muted">
					The colour paints the fill and nothing else — an empty groove is the same chrome at every one, the way an
					unticked checkbox is. default and primary name different tokens this theme tunes alike.
				</Text.Caption>
			</Section>

			<Section title="Sizes">
				<View className="gap-5">
					{SLIDER_SIZES.map((size) => (
						<View className="gap-2" key={size}>
							<Text.Caption color="muted">{size}</Text.Caption>
							<Slider defaultValue={50} size={size}>
								<Slider.Output />
								<Slider.Track>
									<Slider.Fill />
									<Slider.Thumb />
								</Slider.Track>
							</Slider>
						</View>
					))}
				</View>
				<Text.Caption color="muted">
					The groove thickens and the thumb steps up the shared icon scale. The readout names a Text size rather than
					restating a type scale.
				</Text.Caption>
			</Section>

			<Section title="Steps and haptics">
				<View className="gap-5">
					<View className="gap-2">
						<Text.Caption color="muted">step 10 — ticks on every stop</Text.Caption>
						<Slider defaultValue={40} step={10}>
							<Slider.Output />
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</View>
					<View className="gap-2">
						<Text.Caption color="muted">step 1 — thinned to a cadence by distance travelled</Text.Caption>
						<Slider defaultValue={40}>
							<Slider.Output />
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</View>
					<View className="gap-2">
						<Text.Caption color="muted">step 0 — continuous, and silent</Text.Caption>
						<Slider defaultValue={40} formatOptions={{ maximumFractionDigits: 1 }} step={0}>
							<Slider.Output />
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</View>
					<View className="gap-2">
						<Text.Caption color="muted">step 10, haptic silenced</Text.Caption>
						<Slider defaultValue={40} haptic={false} step={10}>
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</View>
				</View>
				<Text.Caption color="muted">
					A haptic ticks on grab and as the value crosses a step, gated on how far the drag has travelled — so a fine
					step scale reads as a cadence rather than a buzz. A continuous slider has no stop to land on and never ticks.
				</Text.Caption>
			</Section>

			<Section title="A range">
				<Slider
					color="success"
					formatOptions={CURRENCY}
					maxValue={1000}
					onChange={(next) => setPrice(next as number[])}
					step={10}
					value={price}
				>
					<View className="flex-row items-center justify-between">
						<Text.Label>Price range</Text.Label>
						<Slider.Output />
					</View>
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
				<Text.Caption color="muted">
					A range's thumb count is data, so the track takes a function and maps over the values it is handed. Neither
					thumb can pass the other, and the fill spans between them rather than starting at the minimum.
				</Text.Caption>
			</Section>

			<Section title="Vertical">
				<View className="h-56 flex-row justify-around">
					{(["default", "success", "warning"] as const).map((color) => (
						<Slider color={color} defaultValue={45} key={color} orientation="vertical">
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					))}
				</View>
				<Text.Caption color="muted">
					The minimum is at the bottom. The inversion lives in valueFromOffset and in the sign of the thumb's translate,
					and nowhere else. A vertical slider needs a definite height from its parent — this row is h-56.
				</Text.Caption>
			</Section>

			<Section title="Controlled, and onChangeEnd">
				<Slider onChange={(next) => setVolume(next as number)} onChangeEnd={setSettled} value={volume}>
					<View className="flex-row items-center justify-between">
						<Text.Label>Volume</Text.Label>
						<Slider.Output />
					</View>
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb />
					</Slider.Track>
				</Slider>
				<Text.Caption color="muted">
					onChange fires throughout the drag; onChangeEnd fired last with {String(settled)}. That is where a network
					write belongs.
				</Text.Caption>
			</Section>

			<Section title="A custom readout">
				<Slider defaultValue={2} maxValue={4} minValue={0} step={1}>
					<Slider.Output>
						{({ values }) => ["Silent", "Quiet", "Comfortable", "Loud", "Very loud"][values[0] ?? 0]}
					</Slider.Output>
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb />
					</Slider.Track>
				</Slider>
				<Text.Caption color="muted">
					Slider.Output takes a function and is handed the settled state, so a scale of words costs nothing but the
					array to index.
				</Text.Caption>
			</Section>

			<Section title="Disabled and invalid">
				<View className="gap-5">
					<View className="gap-2">
						<Text.Caption color="muted">isDisabled</Text.Caption>
						<Slider defaultValue={40} isDisabled>
							<Slider.Output />
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</View>
					<View className="gap-2">
						<Text.Caption color="muted">isInvalid, over a colour</Text.Caption>
						<Slider color="success" defaultValue={70} isInvalid>
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</View>
				</View>
				<Text.Caption color="muted">
					Invalid outranks the colour, on the fill, the way it does on a checkbox's border.
				</Text.Caption>
			</Section>

			<Section title="Inside a Field">
				<Field isInvalid>
					<Field.Content>
						<Field.Label>Brightness</Field.Label>
						<Slider defaultValue={55} step={5}>
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
						<Field.Error>Pick something under 40.</Field.Error>
					</Field.Content>
				</Field>
				<Field isDisabled>
					<Field.Content>
						<Field.Label>Contrast</Field.Label>
						<Slider defaultValue={55}>
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
						<Field.Description>Unavailable while the display is in auto mode.</Field.Description>
					</Field.Content>
				</Field>
				<Field isDisabled>
					<Field.Content>
						<Field.Label>Opted out of the field's disabled state</Field.Label>
						<Slider defaultValue={55} isDisabled={false}>
							<Slider.Track>
								<Slider.Fill />
								<Slider.Thumb />
							</Slider.Track>
						</Slider>
					</Field.Content>
				</Field>
				<Text.Caption color="muted">
					isInvalid and isDisabled cascade in from the Field with nothing said at the call site, and an explicit false
					still opts out — the ?? ladder, never ||.
				</Text.Caption>
			</Section>

			<Section title="Pan versus scroll">
				<Slider defaultValue={50} step={5}>
					<Slider.Output />
					<Slider.Track>
						<Slider.Fill />
						<Slider.Thumb />
					</Slider.Track>
				</Slider>
				<Text.Caption color="muted">
					This whole gallery is a Screen.ScrollArea. A finger starting on the groove must drag the slider and not scroll
					the page; a finger starting on this caption must scroll normally. minDistance(0) is what wins that race.
				</Text.Caption>
			</Section>
		</GalleryScreen>
	);
}
