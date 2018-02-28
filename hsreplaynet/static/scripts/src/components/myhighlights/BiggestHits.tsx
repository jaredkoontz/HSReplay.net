import React from "react";
import CardData from "../../CardData";
import { TableData } from "../../interfaces";
import CardHighlightTile from "../CardHighlightTile";

interface Props {
	cardData?: CardData;
	data?: TableData;
}

export default class BiggestHits extends React.Component<Props> {
	public render(): React.ReactNode {
		const tiles = [];
		const hits = this.props.data.series.data["ALL"];
		if (hits.length) {
			hits.sort((a, b) => +b.damage - +a.damage);
			hits.slice(0, 12).forEach(hit => {
				tiles.push(
					<CardHighlightTile
						card={this.props.cardData.fromDbf(hit.dbf_id)}
						title="Click to watch replay"
						value={hit.damage + " damage"}
						href={hit.replay_url}
					/>,
				);
			});
			return <div>{tiles}</div>;
		}
	}
}
