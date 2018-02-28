import React from "react";
import { winrateData } from "../../helpers";
import CardIcon from "../CardIcon";
import { LoadingStatus } from "../../interfaces";

interface Props {
	cards?: any[];
	deckId?: string;
	games?: number;
	title: string;
	winrate?: number;
	status?: LoadingStatus;
}

export default class DeckBox extends React.Component<Props> {
	public render(): React.ReactNode {
		let content = null;
		let href = null;
		if (
			this.props.cards &&
			this.props.deckId &&
			this.props.games !== undefined &&
			this.props.winrate !== undefined
		) {
			const cardIcons = this.props.cards.map(card => (
				<CardIcon card={card} size={50} />
			));
			const wrData = winrateData(50, this.props.winrate, 3);
			content = [
				<div className="tech-cards">{cardIcons}</div>,
				<div className="stats-table">
					<table>
						<tr>
							<th>Winrate:</th>
							<td style={{ color: wrData.color }}>
								{this.props.winrate}%
							</td>
						</tr>
						<tr>
							<th>Games:</th>
							<td>{this.props.games}</td>
						</tr>
					</table>
				</div>,
			];
			href = `/decks/${this.props.deckId}/`;
		} else if (
			this.props.status === LoadingStatus.NO_DATA ||
			this.props.status === LoadingStatus.PROCESSING
		) {
			content = "Please check back later";
		}

		return (
			<div className="col-xs-12 col-sm-6 col-md-4 col-lg-4">
				<a className="box deck-box" href={href}>
					<div className="box-title">{this.props.title}</div>
					<div className="box-content">{content}</div>
				</a>
			</div>
		);
	}
}
