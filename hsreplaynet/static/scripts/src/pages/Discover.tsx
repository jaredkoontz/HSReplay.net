import React from "react";
import CardData from "../CardData";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import ClassAnalysis, {
	ClusterMetaData,
} from "../components/discover/ClassAnalysis";
import DataInjector from "../components/DataInjector";
import InfoboxFilter from "../components/InfoboxFilter";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import UserData from "../UserData";
import InfoboxLastUpdated from "../components/InfoboxLastUpdated";
import CardSearch from "../components/CardSearch";
import { Limit } from "../components/ObjectSearch";
import { cardSorting, isCollectibleCard, isWildSet } from "../helpers";

interface Props {
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
}

export default class Discover extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			cards: null,
			deck: null,
		};
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (!this.state.cards && nextProps.cardData) {
			const cards = [];
			nextProps.cardData.all().forEach(card => {
				if (card.name && isCollectibleCard(card)) {
					cards.push(card);
				}
			});
			cards.sort(cardSorting);
			this.setState({ cards });
		}
	}

	public render(): React.ReactNode {
		const {
			cardData,
			tab,
			dataset,
			format,
			excludedCards,
			includedCards,
			includedSet,
			playerClass,
			setTab,
		} = this.props;
		const adminControls = [];
		if (UserData.hasFeature("archetypes-gamemode-filter")) {
			adminControls.push(
				<InfoboxFilterGroup
					key="format-filter"
					header="Format"
					selectedValue={format}
					onClick={value => this.props.setFormat(value)}
					collapsible={true}
					collapsed={true}
				>
					<InfoboxFilter value="FT_STANDARD">Standard</InfoboxFilter>
					<InfoboxFilter value="FT_WILD">Wild</InfoboxFilter>
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
					<InfoboxFilter value="live">Live</InfoboxFilter>
					<InfoboxFilter value="latest">Latest</InfoboxFilter>
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

		const getCards = cards =>
			cardData &&
			cards.map(dbfId => cardData.fromDbf(dbfId)).filter(c => !!c);

		return (
			<div className="discover-container">
				<aside className="infobox">
					<h1>Discover</h1>
					<h2>Class</h2>
					<ClassFilter
						minimal={true}
						filters="ClassesOnly"
						selectedClasses={[playerClass as FilterOption]}
						selectionChanged={playerClasses => {
							this.props.setPlayerClass(playerClasses[0]);
							this.props.setExcludedCards([]);
							this.props.setIncludedCards([]);
						}}
					/>
					<section id="include-cards-filter">
						<h2 id="card-search-include-label">Included Cards</h2>
						<InfoboxFilterGroup
							deselectable
							selectedValue={this.props.includedSet}
							onClick={value =>
								this.props.setIncludedSet(value || "ALL")
							}
						>
							<InfoboxFilter value={this.props.latestSet}>
								Any new card
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
						<h2 id="card-search-exclude-label">Excluded Cards</h2>
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
					<h2>Data</h2>
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
				</aside>
				<main>
					<DataInjector
						query={{ url: dataUrl, params: {} }}
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
						/>
					</DataInjector>
				</main>
			</div>
		);
	}
}
