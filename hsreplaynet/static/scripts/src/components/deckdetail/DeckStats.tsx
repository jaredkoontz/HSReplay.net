import React from "react";
import { toPrettyNumber } from "../../helpers";
import { TableData } from "../../interfaces";
import InfoboxLastUpdated from "../InfoboxLastUpdated";

interface Props {
	data?: TableData;
	deckId?: string;
	lastUpdatedParams: any;
	lastUpdatedUrl: string;
	playerClass: string;
}

interface State {
	expandWinrate: boolean;
}

export default class DeckStats extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expandWinrate: false,
		};
	}

	public render(): React.ReactNode {
		const deck = this.props.data.series.data[this.props.playerClass].find(
			x => x.deck_id === this.props.deckId,
		);
		if (!deck) {
			return null;
		}
		return (
			<section>
				<h2>Data</h2>
				<ul>
					<li>
						Sample size
						<span className="infobox-value">
							{toPrettyNumber(+deck["total_games"]) + " games"}
						</span>
					</li>
					<li>
						Time frame
						<span className="infobox-value">Last 30 days</span>
					</li>
					<InfoboxLastUpdated
						url={this.props.lastUpdatedUrl}
						params={this.props.lastUpdatedParams}
					/>
				</ul>
			</section>
		);
	}
}
