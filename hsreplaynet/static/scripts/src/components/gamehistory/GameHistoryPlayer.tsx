import React from "react";
import { CardArtProps } from "../../interfaces";

interface Props extends CardArtProps {
	name: string;
	heroId: string;
	won: boolean;
}

export default class GameHistoryPlayer extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<figure className={this.props.won ? "winner" : "loser"}>
				<img src={this.props.cardArt(this.props.heroId)} />
				<figcaption>{this.props.name}</figcaption>
			</figure>
		);
	}
}
