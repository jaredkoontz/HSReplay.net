import React from "react";
import { Archetype, TwitchVodData } from "../utils/api";
import Table, { RowData, TableColumn } from "./tables/Table";
import { SortDirection } from "../interfaces";
import {
	InjectedTranslateProps,
	Trans,
	translate,
	TranslationFunction,
} from "react-i18next";
import ArchetypeSignatureTooltip from "./metaoverview/ArchetypeSignatureTooltip";
import CardData from "../CardData";
import { getCardClassName, getHeroClassName, image } from "../helpers";
import { formatNumber } from "../i18n";
import { BnetGameType, CardClass } from "../hearthstone";
import RankIcon from "./RankIcon";
import PrettyCardClass from "./text/PrettyCardClass";
import SemanticAge from "./text/SemanticAge";
import OptionalSelect from "./OptionalSelect";
import SortIndicator from "./SortIndicator";
import { getCardClass, PLAYABLE_CARD_CLASSES } from "../utils/enums";
import Tooltip from "./Tooltip";

interface Props extends InjectedTranslateProps {
	archetypeData: Archetype[];
	gameType: string;
	cardData: CardData;
	vods: TwitchVodData[];
	selectedVod: null | TwitchVodData;
	onSelectVod: (vod: null | TwitchVodData) => void;
}

interface State {
	selectedItem: TwitchVodData;
	sortBy: string;
	sortDirection: SortDirection;
	first: null | boolean;
	opponent: null | string;
	won: null | boolean;
}

interface Row extends Partial<TwitchVodData> {
	opposingArchetype?: Archetype;
}

const CELL_HEIGHT = 36;
const MIN_COLUMN_WIDTH = 150;
const MAX_HEADER_WIDTH = 217;
const MIN_HEADER_WIDTH = 150;

const stopPropagation = (event: React.SyntheticEvent): void => {
	event.stopPropagation();
};

const StreamerName: React.SFC<{ displayName: string; channelName: string }> = ({
	displayName,
	channelName,
}) => {
	return (
		<div className="text-twitch twitch-vod-channel-name">
			<img src={image("socialauth/twitch.png")} alt="Twitch" />
			&nbsp;<span>{displayName}</span>
		</div>
	);
};

const OpponentIcon: React.SFC<{ playerClass: string }> = ({ playerClass }) => (
	<span className="twitch-vod-table-icon">
		<Tooltip content={<PrettyCardClass cardClass={playerClass} />} simple>
			<img
				src={image(`64x/class-icons/${playerClass.toLowerCase()}.png`)}
				className="class-icon"
			/>
		</Tooltip>
	</span>
);

const Opponent: React.SFC<{
	playerClass: string;
	archetype: Archetype;
	cardData: CardData;
	gameType: string;
}> = ({ playerClass, archetype, cardData, gameType }) => {
	let result = null;
	const className = "player-class " + playerClass.toLowerCase();
	if (!archetype || archetype.id < 0 || 1 === 1) {
		result = <PrettyCardClass cardClass={playerClass} />;
	} else {
		return (
			<ArchetypeSignatureTooltip
				key={archetype.id}
				cardData={cardData}
				archetypeId={archetype.id}
				archetypeName={archetype.name}
				gameType={gameType}
			>
				<a className={className} href={archetype.url}>
					{archetype.name}
				</a>
			</ArchetypeSignatureTooltip>
		);
	}
	return (
		<span className="opposing-archetype">
			<Trans>vs.</Trans> {result}
		</span>
	);
};

const Rank: React.SFC<{ rank: number; legendRank?: number }> = ({
	rank,
	legendRank,
}) => (
	<span className="twitch-vod-table-icon">
		<RankIcon
			gameType={BnetGameType.BGT_RANKED_STANDARD}
			rank={rank || 0}
			legendRank={legendRank || 0}
			tooltip
		/>
	</span>
);

const Advantage: React.SFC<{ first: boolean }> = ({ first }) => (
	<span className="twitch-vod-table-icon">
		<Tooltip
			content={
				first ? <Trans>Went first</Trans> : <Trans>Got the coin</Trans>
			}
			simple
		>
			<img
				src={image(first ? "first.png" : "coin.png")}
				className="class-icon"
			/>
		</Tooltip>
	</span>
);

const GameResult: React.SFC<{ won: boolean }> = ({ won }) =>
	won ? <Trans>Won</Trans> : <Trans>Lost</Trans>;

const GameDuration: React.SFC<{ seconds: number; t: TranslationFunction }> = ({
	seconds,
	t,
}) => {
	return (
		<span className="game-duration">
			<span className="glyphicon glyphicon-time" />{" "}
			{t("{minutes} min", {
				minutes: formatNumber(seconds / 60, 1),
			} as any)}
		</span>
	);
};

const Age: React.SFC<{ date: Date }> = ({ date }) => (
	<SemanticAge date={date} strict />
);

const Sortable: React.SFC<{
	direction: SortDirection | null;
	onClick: () => void;
}> = ({ direction, onClick, children }) => (
	<span className="twitch-vod-table-sortable" onClick={onClick}>
		<strong>{children}</strong>
		<SortIndicator direction={direction} />
	</span>
);

const ResetButton: React.SFC<{ onReset: () => void }> = ({ onReset }) => {
	const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		onReset();
	};
	return (
		<div className="twitch-vod-table-reset-section">
			<p className="text-center">
				<Trans>
					It doesn't look like any VODs match your selection.
				</Trans>
			</p>
			<p className="text-center">
				<button onClick={onReset} className="btn btn-default">
					<Trans>Reset filters</Trans>
				</button>
			</p>
		</div>
	);
};

class TwitchVodsTable extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			selectedItem: null,
			sortBy: "rank",
			sortDirection: "ascending",
			first: null,
			opponent: null,
			won: null,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		const { sortBy, sortDirection } = this.state;
		const rows: Row[] = [];

		let vods = this.props.vods;
		vods =
			this.state.first === null
				? vods
				: vods.filter(vod => vod.went_first === this.state.first);
		vods =
			this.state.won === null
				? vods
				: vods.filter(vod => vod.won === this.state.won);
		vods =
			this.state.opponent === null
				? vods
				: vods.filter(
						vod =>
							vod.opposing_player_class === this.state.opponent,
				  );

		vods.forEach(vod => {
			const opposingArchetype = this.props.archetypeData.find(
				a => a.id === vod.opposing_player_archetype_id,
			);
			if (opposingArchetype) {
				rows.push({
					opposingArchetype,
					...vod,
				});
			} else {
				rows.push({
					...vod,
				});
			}
		});
		const direction = sortDirection === "ascending" ? 1 : -1;
		rows.sort(
			(a, b) =>
				(() => {
					switch (sortBy) {
						case "rank":
							if (+a.legend_rank !== +b.legend_rank) {
								if (a.legend_rank && !b.legend_rank) {
									return false;
								}
								if (!a.legend_rank && b.legend_rank) {
									return true;
								}
								return +a.legend_rank > +b.legend_rank;
							}
							return +a.rank > +b.rank;
						case "duration":
							return (
								+a.game_length_seconds > +b.game_length_seconds
							);
						case "age":
							try {
								return (
									new Date(a.game_date) >
									new Date(b.game_date)
								);
							} catch (e) {
								return a.game_date > b.game_date;
							}
						case "broadcaster":
							return (
								(a.channel_name || "").toLowerCase() <
								(b.channel_name || "").toLowerCase()
							);
					}
				})()
					? direction
					: -direction,
		);

		return (
			<div className="twitch-vod-table">
				<div className="twitch-vod-table-filterables">
					<OptionalSelect
						default={t("Any first/coin")}
						options={{ first: t("First"), coin: t("Coin") }}
						value={
							this.state.first !== null
								? this.state.first
									? "first"
									: "coin"
								: null
						}
						onSelect={value =>
							this.setState({
								first:
									value !== null ? value === "first" : null,
							})
						}
						defaultKey="any"
					/>
					<OptionalSelect
						default={t("Any result")}
						options={{ won: t("Wins"), lost: t("Losses") }}
						value={
							this.state.won !== null
								? this.state.won
									? "won"
									: "lost"
								: null
						}
						onSelect={value =>
							this.setState({
								won: value !== null ? value === "won" : null,
							})
						}
						defaultKey="any"
					/>
					<OptionalSelect
						default={t("Any opponent")}
						options={PLAYABLE_CARD_CLASSES.map(
							getCardClassName,
						).reduce((opts, c) => {
							return {
								...opts,
								[c]: getHeroClassName(c, t),
							};
						}, {})}
						value={this.state.opponent}
						onSelect={value =>
							this.setState({
								opponent: value,
							})
						}
						defaultKey="any"
					/>
				</div>
				{rows.length ? (
					<>
						<div className="twitch-vod-table-sortables">
							<Sortable
								direction={
									sortBy === "rank" ? sortDirection : null
								}
								onClick={this.sortRank}
							>
								{t("Rank")}
							</Sortable>
							<Sortable
								direction={
									sortBy === "age" ? sortDirection : null
								}
								onClick={this.sortAge}
							>
								{t("Recorded")}
							</Sortable>
							<Sortable
								direction={
									sortBy === "broadcaster"
										? sortDirection
										: null
								}
								onClick={this.sortBroadcaster}
							>
								{t("Broadcaster")}
							</Sortable>
							<Sortable
								direction={
									sortBy === "duration" ? sortDirection : null
								}
								onClick={this.sortDuration}
							>
								{t("Duration")}
							</Sortable>
						</div>
						<ul>
							{rows.map(row => {
								const classNames = [];
								if (
									this.props.selectedVod &&
									row.url === this.props.selectedVod.url
								) {
									classNames.push("active");
								}

								if (row.won) {
									classNames.push("won");
								} else {
									classNames.push("lost");
								}

								return (
									<li
										key={row.url}
										onClick={() =>
											this.props.onSelectVod(row as any)
										}
										className={classNames.join(" ")}
									>
										<p>
											<div className="twitch-vod-table-icons">
												<Rank
													rank={row.rank}
													legendRank={row.legend_rank}
												/>
												<OpponentIcon
													playerClass={
														row.opposing_player_class
													}
												/>
												<Advantage
													first={row.went_first}
												/>
											</div>
											<StreamerName
												displayName={row.channel_name}
												channelName={row.channel_name}
											/>
										</p>
										<p>
											<Age
												date={new Date(row.game_date)}
											/>
											{" — "}
											<Opponent
												archetype={
													row.opposingArchetype
												}
												playerClass={
													row.opposing_player_class
												}
												gameType={this.props.gameType}
												cardData={this.props.cardData}
											/>{" "}
											<GameDuration
												seconds={
													row.game_length_seconds
												}
												t={this.props.t}
											/>
										</p>
									</li>
								);
							})}
						</ul>
					</>
				) : (
					<ResetButton
						onReset={() =>
							this.setState({
								first: null,
								won: null,
								opponent: null,
							})
						}
					/>
				)}
			</div>
		);
	}

	private onSort = (key: string, reversed?: boolean) => () => {
		const flip = (dir: SortDirection) =>
			dir === "ascending" ? "descending" : "ascending";
		this.setState(({ sortBy, sortDirection }) => ({
			sortBy: key,
			sortDirection:
				sortBy !== key
					? reversed
						? "ascending"
						: "descending"
					: flip(sortDirection),
		}));
	};

	private sortRank = this.onSort("rank", true);
	private sortAge = this.onSort("age");
	private sortBroadcaster = this.onSort("broadcaster");
	private sortDuration = this.onSort("duration");
}
export default translate()(TwitchVodsTable);
