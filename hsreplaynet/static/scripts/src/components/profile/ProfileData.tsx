import React from "react";
import DataInjector from "../DataInjector";
import { decode as decodeDeckstring } from "deckstrings";
import { BnetGameType, CardClass, FormatType } from "../../hearthstone";
import { Archetype } from "../../utils/api";
import { ArchetypeData } from "../../interfaces";
import { ProfileArchetypeData, ProfileDeckData } from "./ProfileArchetypeList";
import { getCardClassName } from "../../helpers";

export type ProfileDataType = "MatchupData" | "ArchetypeListData";

interface Props {
	userId: number;
	type: ProfileDataType;
	replayFilter?: (replay: ReplayData) => boolean;
	replayStartDate: string;
	replayEndDate: string;
}

export interface ReplayData {
	user_id: number;
	match_start: string;
	match_end: string;
	shortid: string | null;
	digest: string | null;
	game_type: BnetGameType;
	format_type: FormatType;
	ladder_season: number;
	brawl_season: number;
	scenario_id: number;
	num_turns: number;
	friendly_player_account_hi: string;
	friendly_player_account_lo: string;
	friendly_player_battletag: string;
	friendly_player_is_first: boolean;
	friendly_player_rank: number | null;
	friendly_player_legend_rank: number | null;
	friendly_player_rank_stars: number | null;
	friendly_player_wins: number | null;
	friendly_player_losses: number | null;
	friendly_player_class: CardClass;
	friendly_player_hero: number;
	friendly_player_deck: string;
	friendly_player_blizzard_deck_id: number | null;
	friendly_player_cardback_id: number | null;
	friendly_player_final_state: number;
	friendly_player_archetype_id: number | null;
	opponent_account_hi: string;
	opponent_account_lo: string;
	opponent_battletag: string;
	opponent_is_ai: boolean;
	opponent_rank: number | null;
	opponent_legend_rank: number | null;
	opponent_class: CardClass;
	opponent_hero: number;
	opponent_revealed_deck: string;
	opponent_predicted_deck: string;
	opponent_cardback_id: number | null;
	opponent_final_state: number;
	opponent_archetype_id: number | null;
	replay_xml: string;
	hslog_version: string;
	disconnected: boolean;
	reconnecting: boolean;
	visibility: number;
	views: number;
}

export default class ProfileData extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<DataInjector
				query={[
					{
						key: "replays",
						params: {
							user_id: this.props.userId,
							start_date: this.props.replayStartDate,
							end_date: this.props.replayEndDate,
						},
						url: "/api/v1/replays",
					},
					{
						key: "archetypeData",
						params: {},
						url: "/api/v1/archetypes",
					},
					{
						key: "matchupData",
						params: {}, // TODO: add params
						url: "head_to_head_archetype_matchups",
					},
				]}
			>
				{({ replays, archetypeData, matchupData }) => {
					return (this.props.children as any)(
						this.transformData(replays, archetypeData, matchupData),
					);
				}}
			</DataInjector>
		);
	}

	private transformData(
		replays: ReplayData[],
		archetypeData: Archetype[],
		globalMatchupData: any,
	): any {
		if (!replays || !archetypeData || !globalMatchupData) {
			return null;
		}
		const filteredReplays = this.props.replayFilter
			? replays.filter(this.props.replayFilter)
			: replays;
		switch (this.props.type) {
			case "MatchupData":
				return this.getMatchupData(
					filteredReplays,
					archetypeData,
					globalMatchupData,
				);
			case "ArchetypeListData":
				return this.getArchetypeListData(
					filteredReplays,
					archetypeData,
					globalMatchupData,
				);
		}
		return null;
	}

	private getArchetypeListData(
		replays: ReplayData[],
		archetypeData: Archetype[],
		globalMatchupData: any,
	): ProfileArchetypeData[] {
		const data: ProfileArchetypeData[] = [];

		const getArchetype = (
			id: number | null,
			playerClass: string,
		): ProfileArchetypeData => {
			let profileArchetypeData =
				id === null
					? data.find(
							x =>
								x.archetype === null &&
								x.playerClass === playerClass,
					  )
					: data.find(x => x.archetype && x.archetype.id === id);
			if (!profileArchetypeData) {
				const archetype = archetypeData.find(x => x.id === id) || null;
				const globalData = globalMatchupData.series.metadata["" + id];
				const globalWinrate = globalData ? globalData.win_rate : null;
				profileArchetypeData = {
					archetype,
					playerClass,
					numWins: 0,
					globalWinrate,
					metaTier: null,
					numGames: 0,
					lastPlayed: new Date("1970-01-01Z00:00:00:001"),
					decks: [],
				};
				data.push(profileArchetypeData);
			}
			return profileArchetypeData;
		};

		const getDeck = (
			archetype: ProfileArchetypeData,
			deckstring: string,
		): ProfileDeckData => {
			let deck = archetype.decks.find(x => x.deckstring === deckstring);
			if (!deck) {
				deck = {
					numWins: 0,
					globalWinrate: null,
					numGames: 0,
					lastPlayed: new Date("1970-01-01Z00:00:00:001"),
					deckstring,
					archetype: archetype.archetype,
					metaTier: null,
					games: [],
				};
				archetype.decks.push(deck);
			}
			return deck;
		};

		const isValidDeck = (deckstring: string): boolean => {
			let decodedDeck = null;
			try {
				decodedDeck = decodeDeckstring(deckstring);
			} catch (exception) {
				return false;
			}
			const numCards = decodedDeck.cards
				.map(x => x[1])
				.reduce((a, b) => a + b, 0);
			return numCards === 30;
		};

		replays.forEach(replay => {
			if (!isValidDeck(replay.friendly_player_deck)) {
				return;
			}
			const archetype = getArchetype(
				replay.friendly_player_archetype_id || null,
				getCardClassName(replay.friendly_player_class),
			);

			const won = replay.friendly_player_final_state === 4;
			const startDate = new Date(replay.match_start);

			archetype.numGames++;
			if (won) {
				archetype.numWins++;
			}
			if (startDate > archetype.lastPlayed) {
				archetype.lastPlayed = startDate;
			}

			const deck = getDeck(archetype, replay.friendly_player_deck);
			if (!deck) {
				return;
			}

			deck.numGames++;
			if (won) {
				deck.numWins++;
			}
			if (startDate > deck.lastPlayed) {
				deck.lastPlayed = startDate;
			}

			const opponentArchetype =
				archetypeData.find(
					x => x.id === replay.opponent_archetype_id,
				) || null;

			deck.games.push({
				won,
				opponentArchetype,
				opponentPlayerClass: replay.opponent_class,
				rank: replay.friendly_player_rank,
				legendRank: replay.friendly_player_legend_rank,
				numTurns: replay.num_turns,
				date: startDate,
				duration:
					new Date(replay.match_end).getTime() - startDate.getTime(),
				twitchVod: null,
				replay: replay.replay_xml,
			});
		});

		data.sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime());
		data.forEach(archetype => {
			archetype.decks.sort(
				(a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime(),
			);

			archetype.decks.forEach(deck => {
				deck.games.sort((a, b) => b.date.getTime() - a.date.getTime());
			});
		});

		return data;
	}

	private getMatchupData(
		replays: ReplayData[],
		archetypeData: Archetype[],
		globalMatchupData: any,
	): any {
		const rawMatchups = {};
		const incrementMatchup = (
			friendlyId: number,
			opposingId: number,
			fFinalState: number,
		) => {
			if (!rawMatchups[friendlyId]) {
				rawMatchups[friendlyId] = {};
			}
			if (!rawMatchups[friendlyId][opposingId]) {
				rawMatchups[friendlyId][opposingId] = { wins: 0, games: 0 };
			}
			rawMatchups[friendlyId][opposingId].games += 1;
			if (fFinalState === 4) {
				rawMatchups[friendlyId][opposingId].wins += 1;
			}
		};

		const friendlyArchetypeCounts = {};
		const opposingArchetypeCounts = {};
		const archetypeIds = new Set<number>();
		const incrementArchetypeCount = (
			friendlyId: number,
			opposingId: number,
		) => {
			archetypeIds.add(friendlyId);
			archetypeIds.add(opposingId);
			friendlyArchetypeCounts[friendlyId] =
				(friendlyArchetypeCounts[friendlyId] || 0) + 1;
			opposingArchetypeCounts[opposingId] =
				(opposingArchetypeCounts[opposingId] || 0) + 1;
		};

		replays.forEach(replay => {
			const friendlyId = replay.friendly_player_archetype_id;
			const opposingId = replay.opponent_archetype_id;
			if (friendlyId && opposingId) {
				incrementArchetypeCount(friendlyId, opposingId);
				incrementMatchup(
					friendlyId,
					opposingId,
					replay.friendly_player_final_state,
				);
			}
		});

		const toRemove = Object.keys(opposingArchetypeCounts).map(Number);
		const matchups: ArchetypeData[] = [];
		archetypeIds.forEach(friendlyId => {
			const friendlyArchetype = archetypeData.find(
				a => a.id === +friendlyId,
			);
			if (!friendlyArchetype) {
				return;
			}
			const innerMatchups = [];
			archetypeIds.forEach(opposingId => {
				const opposingArchetype = archetypeData.find(
					a => a.id === +opposingId,
				);
				if (!opposingArchetype) {
					return;
				}
				const data =
					rawMatchups[friendlyId] &&
					rawMatchups[friendlyId][opposingId];
				if (data && data.games) {
					const index = toRemove.indexOf(opposingId);
					if (index > -1) {
						toRemove.splice(index, 1);
					}
				}
				const globalFriendly =
					globalMatchupData.series.data["" + friendlyId];
				const globalOpposing =
					globalFriendly && globalFriendly["" + opposingId];
				const globalWinrate =
					globalOpposing && globalOpposing.total_games > 30
						? globalOpposing.win_rate
						: undefined;
				innerMatchups.push({
					friendlyId: +friendlyId,
					friendlyName: friendlyArchetype.name,
					friendlyPlayerClass: friendlyArchetype.player_class_name,
					opponentId: +opposingId,
					opponentName: opposingArchetype.name,
					opponentPlayerClass: opposingArchetype.player_class_name,
					winrate: data ? data.wins / data.games * 100 : 50,
					totalGames: data ? data.games : 0,
					globalWinrate,
				});
			});
			if (innerMatchups.some(x => x.totalGames)) {
				matchups.push({
					id: +friendlyId,
					name: friendlyArchetype.name,
					playerClass: friendlyArchetype.player_class_name,
					popularityTotal: 0,
					popularityClass: 0,
					winrate: 50,
					effectiveWinrate: 50,
					matchups: innerMatchups,
				});
			} else {
				delete friendlyArchetypeCounts[friendlyId];
			}
		});
		if (toRemove.length) {
			matchups.forEach(matchup => {
				matchup.matchups = matchup.matchups.filter(
					x => toRemove.indexOf(x.opponentId) === -1,
				);
			});
			toRemove.forEach(id => {
				delete opposingArchetypeCounts[id];
			});
		}
		const friendlyArchetypeIds = Object.keys(friendlyArchetypeCounts).map(
			Number,
		);
		friendlyArchetypeIds.sort(
			(a, b) => friendlyArchetypeCounts[b] - friendlyArchetypeCounts[a],
		);
		const opposingArchetypeIds = Object.keys(opposingArchetypeCounts).map(
			Number,
		);
		opposingArchetypeIds.sort(
			(a, b) => opposingArchetypeCounts[b] - opposingArchetypeCounts[a],
		);
		return { matchups, friendlyArchetypeIds, opposingArchetypeIds };
	}
}
