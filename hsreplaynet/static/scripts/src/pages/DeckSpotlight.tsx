import React from "react";
import CardData from "../CardData";
import DataInjector from "../components/DataInjector";
import TableLoading from "../components/loading/TableLoading";
import TrendingDecksList from "../components/trending/TrendingDecksList";
import HideLoading from "../components/loading/HideLoading";
import Tooltip from "../components/Tooltip";
import PropRemapper from "../components/utils/PropRemapper";
import SemanticAge from "../components/SemanticAge";

interface Props {
	cardData: CardData;
}

export default class DeckSpotlight extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<div id="deck-spotlight">
				<span className="pull-right">
					<Tooltip
						header="Automatic updates"
						content="This page is periodically updated as new data becomes available."
					>
						Last updated&nbsp;
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
				<h1>Trending Decks</h1>
				<h3>
					Here's a selection of decks which have been rising in
					popularity over the last 48 hours.
				</h3>
				<DataInjector
					query={{ url: "trending_decks_by_popularity", params: {} }}
				>
					<TableLoading cardData={this.props.cardData}>
						<TrendingDecksList />
					</TableLoading>
				</DataInjector>
				<section id="deck-db-link">
					<h2>Can't find what you are looking for?</h2>
					<a href="/decks/" className="promo-button">
						Check out all the decks!
					</a>
				</section>
			</div>
		);
	}
}
