import React from "react";
import { Archetype, TwitchVodData } from "../utils/api";
import { SortDirection } from "../interfaces";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CardData from "../CardData";
import { getCardClassName, getHeroClassName } from "../helpers";
import OptionalSelect from "./OptionalSelect";
import SortIndicator from "./SortIndicator";
import { PLAYABLE_CARD_CLASSES } from "../utils/enums";
import TwitchVodsTableItem from "./TwitchVodsTableItem";
import Pager from "./Pager";

interface Props extends InjectedTranslateProps {
	archetypeData: Archetype[];
	gameType: string;
	cardData: CardData;
	vods: TwitchVodData[];
	vodId?: string;
	setVodId?: (vodId: string) => void;
	vodsSortBy?: string;
	setVodsSortBy?: (key: string) => void;
	vodsSortDirection?: SortDirection;
	setVodsSortDirection?: (direction: SortDirection) => void;
	vodsFirst?: string;
	setVodsFirst?: (first: string) => void;
	vodsOpponent?: string;
	setVodsOpponent?: (opponent: string) => void;
	vodsResult?: string;
	setVodsResult?: (won: string) => void;
	pageSize: number;
}

interface State {
	page: number;
}

interface Row extends Partial<TwitchVodData> {
	opposingArchetype?: Archetype;
}

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
					<Trans>Clear filters</Trans>
				</button>
			</p>
		</div>
	);
};

class TwitchVodsTable extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			page: 1,
		};
	}

	public render(): React.ReactNode {
		const { t, vodsFirst, vodsResult, vodsOpponent } = this.props;
		const sortBy = this.props.vodsSortBy;
		const sortDirection = this.props.vodsSortDirection;
		const rows: Row[] = [];

		let vods = this.props.vods;
		vods =
			vodsFirst === "any"
				? vods
				: vods.filter(
						vod => vod.went_first === (vodsFirst === "first"),
				  );
		vods =
			vodsResult === "any"
				? vods
				: vods.filter(vod => vod.won === (vodsResult === "won"));
		vods =
			vodsOpponent === "any"
				? vods
				: vods.filter(
						vod => vod.opposing_player_class === vodsOpponent,
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
									new Date(a.game_date) <
									new Date(b.game_date)
								);
							} catch (e) {
								return a.game_date < b.game_date;
							}
						case "broadcaster":
							return (
								(a.channel_name || "").toLowerCase() >
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
						default={t("Any result")}
						options={{ won: t("Wins"), lost: t("Losses") }}
						value={vodsResult}
						onSelect={value => this.props.setVodsResult(value)}
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
						value={vodsOpponent}
						onSelect={value => this.props.setVodsOpponent(value)}
						defaultKey="any"
					/>
					<OptionalSelect
						default={t("Any first/coin")}
						options={{ first: t("First"), coin: t("Coin") }}
						value={vodsFirst}
						onSelect={value => this.props.setVodsFirst(value)}
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
							<Sortable
								direction={
									sortBy === "age" ? sortDirection : null
								}
								onClick={this.sortAge}
							>
								{t("Recency")}
							</Sortable>
						</div>
						<ul>
							{rows
								.slice(
									(this.state.page - 1) * this.props.pageSize,
									this.state.page * this.props.pageSize,
								)
								.map(row => {
									const classNames = [];
									if (
										this.props.vodId &&
										row.replay_shortid === this.props.vodId
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
												this.props.setVodId(
													row.replay_shortid,
												)
											}
											className={classNames.join(" ")}
										>
											<TwitchVodsTableItem
												rank={row.rank}
												legendRank={row.legend_rank}
												channelName={row.channel_name}
												won={row.won}
												wentFirst={row.went_first}
												gameLengthSeconds={
													row.game_length_seconds
												}
												gameDate={
													new Date(row.game_date)
												}
												opposingPlayerClass={
													row.opposing_player_class
												}
												opposingArchetype={
													row.opposingArchetype
												}
												gameType={this.props.gameType}
												cardData={this.props.cardData}
											/>
										</li>
									);
								})}
						</ul>
						{rows.length > this.props.pageSize ? (
							<Pager
								currentPage={this.state.page}
								setCurrentPage={page => this.setState({ page })}
								pageCount={Math.ceil(
									rows.length / this.props.pageSize,
								)}
							/>
						) : null}
					</>
				) : (
					<ResetButton
						onReset={() => {
							this.props.setVodsFirst("any");
							this.props.setVodsOpponent("any");
							this.props.setVodsResult("any");
						}}
					/>
				)}
			</div>
		);
	}

	private onSort = (key: string, reversed?: boolean) => () => {
		this.props.setVodsSortBy(key);
		const flip = (dir: SortDirection) =>
			dir === "ascending" ? "descending" : "ascending";
		const sortDirection =
			this.props.vodsSortBy !== key
				? reversed
					? "ascending"
					: "descending"
				: flip(this.props.vodsSortDirection);
		this.props.setVodsSortDirection(sortDirection);
	};

	private sortRank = this.onSort("rank", true);
	private sortAge = this.onSort("age", true);
	private sortBroadcaster = this.onSort("broadcaster", true);
	private sortDuration = this.onSort("duration");
}
export default translate()(TwitchVodsTable);
