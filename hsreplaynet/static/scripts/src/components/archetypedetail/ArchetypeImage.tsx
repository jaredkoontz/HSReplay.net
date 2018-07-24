import React from "react";
import { withLoading } from "../loading/Loading";
import { Archetype } from "../../utils/api";
import TwoCardFade from "../TwoCardFade";
import CardData from "../../CardData";

interface Props {
	archetypeData?: Archetype[];
	archetypeId: number;
	cardData?: CardData;
}

class ArchetypeImage extends React.Component<Props> {
	public render(): React.ReactNode {
		const archetype = this.props.archetypeData.find(
			a => a.id === this.props.archetypeId,
		);
		if (!archetype || !archetype.standard_ccp_signature_core) {
			return null;
		}
		return (
			<div className="archetype-image-container">
				<TwoCardFade
					leftCardId={
						archetype.standard_ccp_signature_core.components[0]
					}
					rightCardId={
						archetype.standard_ccp_signature_core.components[1]
					}
					cardData={this.props.cardData}
				/>
				<h1>{archetype.name}</h1>
			</div>
		);
	}
}

export default withLoading(
	["archetypeData", "cardData"],
	"archetype-image-container",
)(ArchetypeImage);
