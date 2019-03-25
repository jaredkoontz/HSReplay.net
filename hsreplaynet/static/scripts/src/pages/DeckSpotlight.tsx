import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CardData from "../CardData";
import { Collection } from "../utils/api";
import DataInjector from "../components/DataInjector";
import SemanticAge from "../components/text/SemanticAge";
import Tooltip from "../components/Tooltip";
import HideLoading from "../components/loading/HideLoading";
import TableLoading from "../components/loading/TableLoading";
import TrendingDecksList from "../components/trending/TrendingDecksList";
import PropRemapper from "../components/utils/PropRemapper";
import AdContainer from "../components/ads/AdContainer";
import NitropayAdUnit from "../components/ads/NitropayAdUnit";
import NetworkNAdUnit from "../components/ads/NetworkNAdUnit";
import GutterAdUnit from "../components/ads/GutterAdUnit";
import Feature from "../components/Feature";

interface Props extends WithTranslation {
	cardData: CardData;
	collection: Collection | null;
}

class DeckSpotlight extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div id="deck-spotlight">
				<NetworkNAdUnit id="nn_bb1" uniqueId="tr-bb1" center />
				<Feature feature="networkn" inverted>
					<AdContainer>
						<NitropayAdUnit id="tr-d-1" size="728x90" />
						<NitropayAdUnit id="tr-d-2" size="728x90" />
					</AdContainer>
				</Feature>
				<NitropayAdUnit id="tr-m-1" size="320x50" mobile />
				<NetworkNAdUnit
					id="nn_mobile_mpu2"
					uniqueId="tr-mmpu2"
					mobile
					center
				/>
				<GutterAdUnit
					position="left"
					networkNId="nn_skyleft"
					uniqueId="tr-skyleft"
					fluid
				/>
				<GutterAdUnit
					position="right"
					networkNId="nn_skyright"
					uniqueId="tr-skyright"
					fluid
				/>
				<h1>{t("Trending Decks")}</h1>
				<h3>
					{t(
						"Here's a selection of decks which have been rising in popularity over the last 48 hours.",
					)}
				</h3>
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
				<DataInjector
					query={{ url: "trending_decks_by_popularity", params: {} }}
				>
					<TableLoading cardData={this.props.cardData}>
						<TrendingDecksList collection={this.props.collection} />
					</TableLoading>
				</DataInjector>
				<section id="deck-db-link">
					<h2>{t("Can't find what you are looking for?")}</h2>
					<a href="/decks/" className="promo-button">
						{t("Check out all the decks!")}
					</a>
				</section>
				<NitropayAdUnit id="tr-m-3" size="300x250" mobile />
				<NetworkNAdUnit
					id="nn_mobile_mpu1"
					uniqueId="tr-mmpu1"
					mobile
					center
				/>
			</div>
		);
	}
}

export default withTranslation()(DeckSpotlight);
