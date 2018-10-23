import React from "react";

import { storiesOf } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import CardData from "../../CardData";
import ClusterSignature from "./ClusterSignature";
import { FormatType } from "../../hearthstone";

const mechathunQuestPriestSignature: [number, number][] = [
	[45353, 1],
	[42782, 1],
	[42992, 1],
	[49416, 1],
	[43112, 1],
	[48625, 1],
	[251, 1],
	[48929, 1],
	[47836, 1],
	[41494, 1],
	[749, 1],
	[41885, 1],
	[41169, 1],
	[45930, 1],
	[138, 0.9],
	[613, 0.8],
	[41155, 0.7],
	[1650, 0.6],
	[41418, 0.5],
	[46403, 0.3],
	[1367, 0.3],
	[284, 0.2],
	[48360, 0.1],
];

class CardDataProvider extends React.Component {
	state = {
		cardData: null,
	};

	componentDidMount() {
		new CardData().load((cardData: CardData) => {
			this.setState({ cardData });
		});
	}

	render() {
		// @ts-ignore
		return this.props.children(this.state.cardData);
	}
}

storiesOf("ClusterSignature", module)
	.add("default", () => {
		return (
			<CardDataProvider>
				{cardData => (
					<ClusterSignature
						cardData={cardData}
						signature={{
							components: mechathunQuestPriestSignature,
							as_of: new Date(),
							format: FormatType.FT_STANDARD,
						}}
						clusterId={"123"}
						format={"FT_STANDARD"}
						playerClass={"PRIEST"}
						requestReload={action("requestReload")}
						requiredCards={[41494, 48625]}
					/>
				)}
			</CardDataProvider>
		);
	})
	.add("with showRequiredCards", () => {
		return (
			<CardDataProvider>
				{cardData => (
					<ClusterSignature
						cardData={cardData}
						signature={{
							components: mechathunQuestPriestSignature,
							as_of: new Date(),
							format: FormatType.FT_STANDARD,
						}}
						clusterId={"123"}
						format={"FT_STANDARD"}
						playerClass={"PRIEST"}
						requestReload={action("requestReload")}
						requiredCards={[41494, 48625]}
						showRequiredCards={true}
					/>
				)}
			</CardDataProvider>
		);
	});
