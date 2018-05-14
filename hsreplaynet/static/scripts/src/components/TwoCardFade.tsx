import React from "react";
import CardData from "../CardData";
import { withLoading } from "./loading/Loading";
import { classImageOffset } from "../helpers";

interface Props {
	cardData?: CardData;
	leftCardId: number | string;
	rightCardId: number | string;
	leftFlipped?: boolean;
	rightFlipped?: boolean;
	topFade?: boolean;
	bottomFade?: boolean;
}

class TwoCardFade extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<div className="card-fade-container">
				<div
					className={
						"card-art" + (this.props.leftFlipped ? " flipped" : "")
					}
					key={this.props.leftCardId}
					style={this.getStyle(this.props.leftCardId)}
				/>
				<div
					className={
						"card-art" + (this.props.rightFlipped ? " flipped" : "")
					}
					key={this.props.rightCardId}
					style={this.getStyle(this.props.rightCardId)}
				/>
				{this.props.topFade ? <div className="fade fade-top" /> : null}
				{this.props.bottomFade ? (
					<div className="fade fade-bottom" />
				) : null}
			</div>
		);
	}

	private getStyle(cardId: string | number): any {
		const card =
			typeof cardId === "string"
				? this.props.cardData.fromCardId(cardId)
				: this.props.cardData.fromDbf(cardId);
		const style = {
			backgroundImage: `url(${HEARTHSTONE_ART_URL}/512x/${card.id}.jpg)`,
		};
		if (card.type === "HERO") {
			style["backgroundPositionY"] = `${100 *
				classImageOffset(card.cardClass)}%`;
		}
		return style;
	}
}

export default withLoading(["cardData"])(TwoCardFade);
