import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { toPrettyNumber } from "../../helpers";
import { TableData } from "../../interfaces";
import InfoboxLastUpdated from "../InfoboxLastUpdated";

interface Props extends InjectedTranslateProps {
	data?: TableData;
	deckId?: string;
	lastUpdatedParams: any;
	lastUpdatedUrl: string;
	playerClass: string;
}

interface State {
	expandWinrate: boolean;
}

class DeckStats extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			expandWinrate: false,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const deck = this.props.data.series.data[this.props.playerClass].find(
			x => x.deck_id === this.props.deckId,
		);
		if (!deck) {
			return null;
		}
		const totalGames = toPrettyNumber(+deck["total_games"]);
		return (
			<section>
				<h2>{t("Data")}</h2>
				<ul>
					<li>
						{t("Sample size")}
						<span className="infobox-value">
							{t("{{totalGames}} games", { totalGames })}
						</span>
					</li>
					<li>
						{t("Time frame")}
						<span className="infobox-value">
							{t("Last {{n}} days", { n: 30 })}
						</span>
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
export default translate()(DeckStats);
