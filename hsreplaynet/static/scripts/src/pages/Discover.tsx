import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import AdContainer from "../components/ads/AdContainer";
import AdUnit from "../components/ads/AdUnit";
import CardSearch from "../components/CardSearch";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import DataInjector from "../components/DataInjector";
import ClassAnalysis, {
	ClusterMetaData,
} from "../components/discover/ClassAnalysis";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import { Limit } from "../components/ObjectSearch";
import { cardSorting, isCollectibleCard, isWildSet } from "../helpers";
import UserData from "../UserData";

interface Props extends InjectedTranslateProps {
	cardData: CardData | null;
	latestSet: string;
	// fragments
	dataset?: string;
	format?: string;
	includedCards?: string[];
	setIncludedCards?: (includedCards: string[]) => void;
	includedSet?: string;
	setIncludedSet?: (includedSet: string) => void;
	excludedCards?: string[];
	setExcludedCards?: (excludedCards: string[]) => void;
	playerClass?: string;
	setDataset?: (dataset: string) => void;
	setFormat?: (format: string) => void;
	setPlayerClass?: (tab: string) => void;
	setTab?: (clusterTab: string) => void;
	tab?: string;
}

interface State {
	cards: any[];
	deck: ClusterMetaData;
	key: number;
}

class Discover extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			cards: null,
			deck: null,
			key: 0,
		};
	}

	static getDerivedStateFromProps(
		nextProps: Readonly<Props>,
		prevState: State,
	): Partial<State> | null {
		if (!prevState.cards && nextProps.cardData) {
			const cards = [];
			nextProps.cardData.all().forEach(card => {
				if (card.name && isCollectibleCard(card)) {
					cards.push(card);
				}
			});
			cards.sort(cardSorting);
			return { cards };
		}
		return null;
	}

	public render(): React.ReactNode {
		const {
			cardData,
			dataset,
			excludedCards,
			format,
			includedCards,
			includedSet,
			playerClass,
			setTab,
			tab,
			t,
		} = this.props;
		const adminControls = [];
		if (UserData.hasFeature("archetypes-gamemode-filter")) {
			adminControls.push(
				<InfoboxFilterGroup
					key="format-filter"
					header="Format"
					selectedValue={format}
					onClick={value => this.props.setFormat(value)}
					collapsible
					collapsed
				>
					<InfoboxFilter value="FT_STANDARD">
						{t("GLOBAL_STANDARD", { ns: "hearthstone" })}
					</InfoboxFilter>
					<InfoboxFilter value="FT_WILD">
						{t("GLOBAL_WILD", { ns: "hearthstone" })}
					</InfoboxFilter>
				</InfoboxFilterGroup>,
			);
		}
		if (UserData.hasFeature("archetype-training")) {
			adminControls.push(
				<InfoboxFilterGroup
					key="cluster-data-filter"
					header="Dataset"
					selectedValue={dataset}
					onClick={value => this.props.setDataset(value)}
				>
					<InfoboxFilter value="live">{t("Live")}</InfoboxFilter>
					<InfoboxFilter value="latest">{t("Latest")}</InfoboxFilter>
				</InfoboxFilterGroup>,
			);
		}

		const dataUrl = `/analytics/clustering/data/${dataset}/${format}/`;

		let filteredCards = Array.isArray(this.state.cards)
			? this.state.cards
			: [];
		if (format.endsWith("_STANDARD")) {
			filteredCards = filteredCards.filter(card => !isWildSet(card.set));
		}
		filteredCards = filteredCards.filter(card => {
			const cardClass = card.cardClass;
			return cardClass === "NEUTRAL" || playerClass === cardClass;
		});

		const getCards = (cards: string[]) =>
			cardData &&
			cards.map(dbfId => cardData.fromDbf(dbfId)).filter(c => !!c);

		return (
			<div className="discover-container">
				<aside className="infobox">
					<h1>{t("Discover")}</h1>
					<h2>{t("Class")}</h2>
					<ClassFilter
						minimal
						filters="ClassesOnly"
						selectedClasses={[playerClass as FilterOption]}
						selectionChanged={playerClasses => {
							this.props.setPlayerClass(playerClasses[0]);
							this.props.setExcludedCards([]);
							this.props.setIncludedCards([]);
						}}
					/>
					<AdUnit id="ds-m-1" size="320x50" mobile />
					<section id="include-cards-filter">
						<h2 id="card-search-include-label">
							{t("Included cards")}
						</h2>
						<InfoboxFilterGroup
							deselectable
							selectedValue={this.props.includedSet}
							onClick={value =>
								this.props.setIncludedSet(value || "ALL")
							}
						>
							<InfoboxFilter value={this.props.latestSet}>
								{t("Any new card")}
							</InfoboxFilter>
						</InfoboxFilterGroup>
						<CardSearch
							id="card-search-include"
							label="card-search-include-label"
							availableCards={filteredCards}
							onCardsChanged={cards =>
								this.props.setIncludedCards(
									cards.map(card => card.dbfId),
								)
							}
							selectedCards={
								includedCards && getCards(includedCards)
							}
							cardLimit={Limit.SINGLE}
						/>
					</section>
					<section id="exclude-cards-filter">
						<h2 id="card-search-exclude-label">
							{t("Excluded cards")}
						</h2>
						<CardSearch
							id="card-search-exclude"
							label="card-search-exclude-label"
							availableCards={filteredCards}
							onCardsChanged={cards =>
								this.props.setExcludedCards(
									cards.map(card => card.dbfId),
								)
							}
							selectedCards={
								excludedCards && getCards(excludedCards)
							}
							cardLimit={Limit.SINGLE}
						/>
					</section>
					{adminControls}
					<h2>{t("Data")}</h2>
					<ul>
						<InfoboxLastUpdated
							url={dataUrl}
							params={{}}
							modify={data =>
								data.length &&
								data[0].as_of &&
								new Date(data[0].as_of)
							}
						/>
					</ul>
					<AdUnit id="ds-d-3" size="300x250" />
				</aside>
				<main>
					<AdContainer>
						<AdUnit id="ds-d-1" size="728x90" />
						<AdUnit id="ds-d-2" size="728x90" />
					</AdContainer>
					<DataInjector
						query={{
							url: dataUrl + "?" + this.state.key,
							params: {},
						}}
						extract={{
							data: clusterData => {
								let maxGames = 0;
								let data = null;

								clusterData.forEach(classData => {
									if (
										classData.player_class === playerClass
									) {
										data = classData;
									}
									classData.data.forEach(deckData => {
										if (
											deckData.metadata.games > maxGames
										) {
											maxGames = deckData.metadata.games;
										}
									});
								});

								return { data, maxGames };
							},
						}}
					>
						<ClassAnalysis
							cardData={cardData}
							clusterTab={tab}
							setClusterTab={setTab}
							format={format}
							includedCards={includedCards.map(Number)}
							includedSet={includedSet}
							excludedCards={excludedCards.map(Number)}
							onSelectedDeckChanged={deck =>
								this.setState({ deck })
							}
							playerClass={playerClass}
							canModifyArchetype={dataset === "latest"}
							requestReload={() => {
								this.setState(s => ({ key: s.key + 1 }));
								this.props.setTab("decks");
							}}
						/>
					</DataInjector>
					<AdUnit id="ds-m-2" size="320x50" mobile />
				</main>
			</div>
		);
	}
}

export default translate()(Discover);
