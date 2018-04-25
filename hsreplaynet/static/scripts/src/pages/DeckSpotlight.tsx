import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import DataInjector from "../components/DataInjector";
import SemanticAge from "../components/SemanticAge";
import Tooltip from "../components/Tooltip";
import HideLoading from "../components/loading/HideLoading";
import TableLoading from "../components/loading/TableLoading";
import TrendingDecksList from "../components/trending/TrendingDecksList";
import PropRemapper from "../components/utils/PropRemapper";

interface Props extends InjectedTranslateProps {
	cardData: CardData;
}

class DeckSpotlight extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div id="deck-spotlight">
				<span className="pull-right">
					<Tooltip
						header={t("Automatic updates")}
						content={t(
							"This page is periodically updated as new data becomes available.",
						)}
					>
						{t("Last updated")}&nbsp;
						<DataInjector
							query={{
								url: "trending_decks_by_popularity",
								params: {},
							}}
							modify={data =>
								data && data.as_of ? new Date(data.as_of) : null
							}
						>
							<HideLoading>
								<PropRemapper map={{ data: "date" }}>
									<SemanticAge />
								</PropRemapper>
							</HideLoading>
						</DataInjector>
					</Tooltip>
				</span>
				<h1>{t("Trending Decks")}</h1>
				<h3>
					{t(
						"Here's a selection of decks which have been rising in popularity over the last 48 hours.",
					)}
				</h3>
				<DataInjector
					query={{ url: "trending_decks_by_popularity", params: {} }}
				>
					<TableLoading cardData={this.props.cardData}>
						<TrendingDecksList />
					</TableLoading>
				</DataInjector>
				<section id="deck-db-link">
					<h2>{t("Can't find what you are looking for?")}</h2>
					<a href="/decks/" className="promo-button">
						{t("Check out all the decks!")}
					</a>
				</section>
			</div>
		);
	}
}

export default translate()(DeckSpotlight);
