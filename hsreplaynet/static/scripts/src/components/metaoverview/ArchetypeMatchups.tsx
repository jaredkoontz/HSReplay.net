import React from "react";
import ArchetypeMatrix from "./matchups/ArchetypeMatrix";
import {
	ApiArchetype,
	ApiArchetypeMatchupData,
	ApiArchetypePopularity,
	ArchetypeData,
	MatchupData,
	SortDirection,
} from "../../interfaces";
import UserData from "../../UserData";
import CardData from "../../CardData";
import { withLoading } from "../loading/Loading";
import { getOtherArchetype } from "../../helpers";
import LowDataWarning from "./LowDataWarning";

interface Props {
	archetypeData?: any;
	cardData: CardData;
	gameType: string;
	matchupData?: any;
	mobileView: boolean;
	popularityData?: any;
	sortDirection?: SortDirection;
	setSortDirection?: (ascending: SortDirection) => void;
	sortBy?: string;
	setSortBy?: (prop: string) => void;
}

interface State {
	apiArchetypes: ApiArchetype[];
	archetypeData: ArchetypeData[];
	currentSort: number[];
	customWeights: any;
	favorites: number[];
	ignoredColumns: number[];
	maxPopularity: number;
	sortedIds: number[];
	useCustomWeights: boolean;
}

const POPULARITY_CUTOFF_PERCENTAGE = 0;

class ArchetypeMatchups extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			apiArchetypes: [],
			archetypeData: [],
			currentSort: [],
			customWeights:
				UserData.getSetting("archetype-custom-popularities") || {},
			favorites: UserData.getSetting("archetype-favorites") || [],
			ignoredColumns: UserData.getSetting("archetype-ignored") || [],
			maxPopularity: 0,
			sortedIds: [],
			useCustomWeights: false,
		};
	}

	public componentDidMount(): void {
		if (this.props.sortBy === "none") {
			// switch to default sorting of page is loaded with "sortBy=none"
			this.props.setSortBy("popularity");
		}
		this.updateData(this.props);
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		this.updateData(nextProps);
	}

	public render(): React.ReactNode {
		const commonProps = {
			allArchetypes: this.state.apiArchetypes,
			archetypes: this.state.archetypeData,
			cardData: this.props.cardData,
			favorites: this.state.favorites.filter(
				id => this.state.sortedIds.indexOf(id) !== -1,
			),
			gameType: this.props.gameType,
			maxPopularity: this.state.maxPopularity,
			onFavoriteChanged: (archetypeId: number, favorite: boolean) =>
				this.onFavoriteChanged(archetypeId, favorite),
			onSortChanged: (sortBy: string, sortDirection: SortDirection) => {
				this.props.setSortDirection(sortDirection);
				this.props.setSortBy(sortBy);
			},
			sortBy: this.props.sortBy,
			sortDirection: this.props.sortDirection,
		};

		const { popularityData } = this.props;

		return (
			<div>
				<LowDataWarning
					date={new Date(popularityData.as_of)}
					numArchetypes={Object.keys(popularityData.series.data)
						.map(key => {
							return popularityData.series.data[key].length;
						})
						.reduce((a, b) => a + b)}
				/>
				<ArchetypeMatrix
					customWeights={this.state.customWeights}
					onCustomWeightsChanged={(
						archetypeId: number,
						popularity: number,
					) => {
						this.onCustomPopularitiesChanged(
							archetypeId,
							popularity,
						);
					}}
					useCustomWeights={this.state.useCustomWeights}
					onUseCustomWeightsChanged={(useCustomWeights: boolean) => {
						this.setState({ useCustomWeights }, () => {
							if (this.props.sortBy !== "none") {
								this.props.setSortBy("none");
							} else {
								this.updateData(this.props);
							}
						});
					}}
					ignoredColumns={this.state.ignoredColumns.filter(
						id => this.state.sortedIds.indexOf(id) !== -1,
					)}
					onIgnoreChanged={(archetypeId: number, ignore: boolean) =>
						this.onIgnoreChanged(archetypeId, ignore)
					}
					{...commonProps}
				/>
			</div>
		);
	}

	updateData(props: Props) {
		let archetypeData: ArchetypeData[] = [];
		const { archetypeIds, apiArchetypes } = this.getAllArchetypes(
			props.matchupData,
			props.archetypeData,
		);

		let maxPopularity = null;
		const useCustomWeights = this.state.useCustomWeights;

		const visibleArchetypes = apiArchetypes.filter(archetype => {
			const popularity = this.getPopularity(
				archetype,
				props.popularityData,
			);
			if (popularity) {
				return (
					popularity.pct_of_total >= POPULARITY_CUTOFF_PERCENTAGE ||
					this.isFavorite(archetype.id)
				);
			}
			return false;
		});

		visibleArchetypes.forEach((friendly: ApiArchetype) => {
			const matchups: MatchupData[] = [];
			let effectiveWinrate = 0;
			let totalGames = 0;

			visibleArchetypes.forEach((opponent: ApiArchetype) => {
				const apiMatchup = this.getMatchup(
					friendly,
					opponent,
					props.matchupData,
				);
				matchups.push({
					friendlyId: friendly.id,
					friendlyName: friendly.name,
					friendlyPlayerClass: friendly.player_class_name,
					opponentId: opponent.id,
					opponentName: opponent.name,
					opponentPlayerClass: opponent.player_class_name,
					totalGames: apiMatchup && apiMatchup.total_games,
					winrate: apiMatchup && apiMatchup.win_rate,
				});
				if (
					apiMatchup &&
					this.state.ignoredColumns.indexOf(opponent.id) === -1
				) {
					const factor = useCustomWeights
						? this.state.customWeights[opponent.id] || 0
						: apiMatchup.total_games;
					effectiveWinrate += apiMatchup.win_rate * factor;
					totalGames += factor;
				}
			});

			effectiveWinrate =
				Math.round(effectiveWinrate / (totalGames / 100)) / 100;

			// Todo: optimize this to only call getPopularity once (see visibleArchetypes filtering)
			const popularity = this.getPopularity(
				friendly,
				props.popularityData,
			);
			if (popularity && popularity.pct_of_total > 0) {
				archetypeData.push({
					id: friendly.id,
					matchups,
					name: friendly.name,
					playerClass: friendly.player_class_name,
					popularityClass: popularity.pct_of_class,
					popularityTotal: popularity.pct_of_total,
					winrate: popularity.win_rate,
					effectiveWinrate,
				});
				if (
					!useCustomWeights &&
					(!maxPopularity || popularity.pct_of_total > maxPopularity)
				) {
					maxPopularity = popularity.pct_of_total;
				}
			}

			if (
				useCustomWeights &&
				(!maxPopularity ||
					this.state.customWeights[friendly.id] > maxPopularity)
			) {
				maxPopularity = this.state.customWeights[friendly.id];
			}
		});

		let sortedIds = this.state.sortedIds;
		if (props.sortBy === "none") {
			archetypeData = this.state.sortedIds.map(id =>
				archetypeData.find(a => a.id === id),
			);
		} else {
			this.sortArchetypes(
				archetypeData,
				props.sortDirection,
				props.sortBy,
			);
			sortedIds = archetypeData.map(archetype => archetype.id);
		}

		archetypeData.forEach(archetype => {
			archetype.matchups = sortedIds.map(id =>
				archetype.matchups.find(m => m.opponentId === id),
			);
		});

		this.setState({
			apiArchetypes,
			archetypeData,
			maxPopularity,
			sortedIds,
		});
	}

	sortArchetypes(
		archetypes: ArchetypeData[],
		sortDirection: SortDirection,
		sortBy: string,
	) {
		const direction = sortDirection === "ascending" ? 1 : -1;

		const compare = (a: ArchetypeData, b: ArchetypeData): number => {
			if (sortBy === "popularity") {
				if (this.state.useCustomWeights) {
					return (
						(this.state.customWeights[a.id] || 0) -
						(this.state.customWeights[b.id] || 0)
					);
				}
				return a.popularityTotal - b.popularityTotal;
			}
			if (sortBy === "winrate") {
				return a.effectiveWinrate - b.effectiveWinrate;
			}
			if (a.playerClass === b.playerClass) {
				return 0;
			}
			return a.playerClass > b.playerClass ? 1 : -1;
		};

		archetypes.sort((a: ArchetypeData, b: ArchetypeData) => {
			const favorite = +this.isFavorite(b.id) - +this.isFavorite(a.id);
			return (
				favorite ||
				compare(a, b) * direction ||
				(a.name > b.name ? 1 : -1)
			);
		});
	}

	isFavorite(archetypeId: number): boolean {
		return this.state.favorites.indexOf(archetypeId) !== -1;
	}

	onCustomPopularitiesChanged(archetypeId: number, popularity: number) {
		const customWeights = Object.assign({}, this.state.customWeights);
		Object.keys(customWeights).forEach(id => {
			if (this.state.archetypeData.every(a => a.id !== +id)) {
				delete customWeights[id];
			}
		});
		customWeights["" + archetypeId] = popularity;
		UserData.setSetting("archetype-custom-popularities", customWeights);
		this.setState({ customWeights }, () => {
			if (
				this.props.sortBy === "popularity" ||
				this.props.sortBy === "winrate"
			) {
				this.props.setSortBy("none");
			} else {
				this.updateData(this.props);
			}
		});
	}

	onFavoriteChanged(archetypeId: number, favorite: boolean) {
		let favorites = this.state.favorites.slice();
		favorites = favorites.filter(id =>
			this.state.archetypeData.some(a => a.id === id),
		);
		favorites = favorites.filter(id => id !== archetypeId);
		if (favorite) {
			favorites.push(archetypeId);
		}
		const newState = { favorites };
		if (this.props.sortBy === "none") {
			// archetypes will not be re-sorted, we need to sort favorites manually
			const favs = [];
			const nonFavs = [];
			let sortedIds = this.state.sortedIds.slice();
			if (favorite && sortedIds.indexOf(archetypeId) === -1) {
				// new favorite that is below cutoff
				sortedIds.push(archetypeId);
			} else if (!favorite) {
				const archetype = this.state.archetypeData.find(
					a => a.id === archetypeId,
				);
				if (archetype.popularityTotal < POPULARITY_CUTOFF_PERCENTAGE) {
					// favorite is below cutoff, so remove entirely
					sortedIds = sortedIds.filter(id => id !== archetypeId);
				}
			}
			// split into favorites/non-favorites while keeping existing sorting
			sortedIds.forEach(id => {
				if (favorites.indexOf(id) === -1) {
					nonFavs.push(id);
				} else {
					favs.push(id);
				}
			});
			newState["sortedIds"] = favs.concat(nonFavs);
		}
		this.setState(newState, () => this.updateData(this.props));
		UserData.setSetting("archetype-favorites", favorites);
	}

	onIgnoreChanged(archetypeId: number | number[], ignore: boolean) {
		const archetypeIds = Array.isArray(archetypeId)
			? archetypeId
			: [archetypeId];
		let ignoredColumns = this.state.ignoredColumns.slice();
		ignoredColumns = ignoredColumns.filter(id =>
			this.state.archetypeData.some(a => a.id === id),
		);
		ignoredColumns = ignoredColumns.filter(
			id => archetypeIds.indexOf(id) === -1,
		);
		if (ignore) {
			archetypeIds.forEach(id => ignoredColumns.push(id));
		}
		UserData.setSetting("archetype-ignored", ignoredColumns);
		this.setState({ ignoredColumns }, () => {
			if (this.props.sortBy === "winrate") {
				this.props.setSortBy("none");
			} else {
				this.updateData(this.props);
			}
		});
	}

	getAllArchetypes(
		matchupData: any,
		archetypeData: any,
	): { archetypeIds: number[]; apiArchetypes: ApiArchetype[] } {
		const archetypeIds = [];
		Object.keys(matchupData.series.data).forEach((friendlyId: string) => {
			if (archetypeIds.indexOf(+friendlyId) === -1) {
				archetypeIds.push(+friendlyId);
			}
			Object.keys(matchupData.series.data[friendlyId]).forEach(
				(opponentId: string) => {
					if (archetypeIds.indexOf(+opponentId) === -1) {
						archetypeIds.push(+opponentId);
					}
				},
			);
		});
		return {
			archetypeIds,
			apiArchetypes: archetypeIds
				.map(id => this.getApiArchetype(id, archetypeData))
				.filter(x => x !== undefined),
		};
	}

	getApiArchetype(id: number, archetypeData: any): ApiArchetype {
		return archetypeData.find(a => a.id === id) || getOtherArchetype(id);
	}

	getMatchup(
		friendly: ApiArchetype,
		opponent: ApiArchetype,
		matchupData: any,
	): ApiArchetypeMatchupData {
		const matchups = matchupData.series.data["" + friendly.id];
		return matchups && matchups["" + opponent.id];
	}

	getPopularity(
		archetype: ApiArchetype,
		popularityData: any,
	): ApiArchetypePopularity {
		const data = popularityData.series.data[archetype.player_class_name];
		return (
			data &&
			data.find(a => {
				return a.archetype_id === archetype.id;
			})
		);
	}
}

export default withLoading(["archetypeData", "matchupData", "popularityData"])(
	ArchetypeMatchups,
);
