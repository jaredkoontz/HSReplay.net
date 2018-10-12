import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import InfoboxFilterGroup from "../components/InfoboxFilterGroup";
import { FilterEvents } from "../metrics/Events";
import InfoboxFilter from "../components/InfoboxFilter";
import { RankRange, TimeRange } from "../filters";
import PrettyTimeRange from "../components/text/PrettyTimeRange";
import PrettyRankRange from "../components/text/PrettyRankRange";
import ClassFilter, { FilterOption } from "../components/ClassFilter";
import { Archetype } from "../utils/api";
import DataInjector from "../components/DataInjector";
import LoadingSpinner from "../components/LoadingSpinner";
import { getHeroClassName, image } from "../helpers";
import ClassIcon from "../components/ClassIcon";
import { CardClass } from "../hearthstone";
import { formatNumber, i18nFormatDate } from "../i18n";
import Pager from "../components/Pager";
import { addMonths } from "date-fns";

interface Props extends InjectedTranslateProps {
	cardData: CardData;
	archetypeData: Archetype[];
	timeRange?: string;
	setTimeRange?: (timeRange: string) => void;
	rankRange?: string;
	setRankRange?: (rankRange: string) => void;
	archetype?: string;
	setArchetype?: (archetypes: string) => void;
	playerClass?: string;
	setPlayerClass?: (playerClass: string) => void;
	region?: string;
	setRegion?: (region: string) => void;
	gameType?: string;
	setGameType?: (gameType: string) => void;
	page?: number;
	setPage?: (page: number) => void;
	pageSize: number;
}
interface State {}

class Leaderboards extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const { t } = this.props;
		const url = this.isArchetypeSelected()
			? "account_lo_archetype_leaderboard_by_winrate"
			: "account_lo_leaderboard_by_winrate";
		const params = {
			GameType: this.props.gameType,
			Region: this.props.region,
			RankRange: this.props.rankRange,
			TimeRange: this.props.timeRange,
		};
		const isArchetypeSelected = this.isArchetypeSelected();
		if (isArchetypeSelected) {
			params["archetype_id"] = this.props.archetype;
		}
		return (
			<DataInjector
				query={{
					params,
					url,
				}}
			>
				{({ data }) => {
					return (
						<>
							<aside className="infobox">
								{this.renderAside(data)}
							</aside>
							<main>{this.renderMain(data)}</main>
						</>
					);
				}}
			</DataInjector>
		);
	}

	private isArchetypeSelected = () =>
		this.props.playerClass && this.props.archetype;

	private stringifyTimeFrame(timestamp): string {
		const { t } = this.props;
		switch (this.props.timeRange) {
			case "CURRENT_SEASON":
				return i18nFormatDate(Date.parse(timestamp), "MMMM YYYY");
			case "PREVIOUS_SEASON":
				return i18nFormatDate(
					addMonths(Date.parse(timestamp), -1),
					"MMMM YYYY",
				);
			case "CURRENT_EXPANSION":
				return t("Latest Expansion");
		}
		return null;
	}

	private renderMain(leaderboardsData): React.ReactNode {
		if (!leaderboardsData) {
			return <LoadingSpinner active />;
		}
		const key = this.isArchetypeSelected() ? "ALL" : this.props.playerClass;
		const data = leaderboardsData.series.data[key].slice(0, 100);
		data.sort((a, b) => a.leaderboard_rank - b.leaderboard_rank);

		const { t, page, pageSize } = this.props;
		return (
			<>
				<h1>{this.stringifyTimeFrame(leaderboardsData.as_of)}</h1>
				<header>
					<h3>
						{this.props.playerClass === "ALL"
							? t("Top Players in {gametype}", {
									gametype:
										this.props.gameType ===
										"RANKED_STANDARD"
											? t("Ranked Standard")
											: t("Ranked Wild"),
							  })
							: t("Top {class} Players in {gametype}", {
									gametype:
										this.props.gameType ===
										"RANKED_STANDARD"
											? t("Ranked Standard")
											: t("Ranked Wild"),
									class: getHeroClassName(
										this.props.playerClass,
										t,
									),
							  })}
					</h3>
					<Pager
						currentPage={page}
						setCurrentPage={this.props.setPage}
						pageCount={Math.ceil(data.length / pageSize)}
						minimal
					/>
				</header>
				<table className="table">
					<thead>
						<tr>
							<th>{t("#")}</th>
							<th>{t("Player")}</th>
							<th>{t("Winrate")}</th>
							<th>{t("Games")}</th>
							<th className="hidden-xs">{t("Favorite Class")}</th>
						</tr>
					</thead>
					<tbody>
						{data
							.slice((page - 1) * pageSize, page * pageSize)
							.map(d => {
								return (
									<tr
										key={`${d.account_lo}${
											d.leaderboard_rank
										}`}
										className={`leaderboard-rank-${
											d.leaderboard_rank
										}`}
									>
										<td>{d.leaderboard_rank}</td>
										<td>
											<img
												src={image(
													"profile_placeholder.png",
												)}
												height="70"
											/>
											<p>{d.account_lo}</p>
										</td>
										<td>{formatNumber(d.winrate, 1)}%</td>
										<td>{d.total_games}</td>
										<td className="hidden-xs">
											<ClassIcon
												small
												cardClass={
													(Math.floor(
														Math.random() * 8,
													) + 3) as CardClass
												}
											/>
										</td>
									</tr>
								);
							})}
					</tbody>
				</table>
				<div className="pagination-container">
					<Pager
						currentPage={page}
						setCurrentPage={this.props.setPage}
						pageCount={Math.ceil(data.length / pageSize)}
					/>
				</div>
			</>
		);
	}

	private renderAside(leaderboardsData): React.ReactNode {
		const { t } = this.props;
		return (
			<>
				<h1>{t("Leaderboards")}</h1>
				<section id="player-class-filter">
					<h2>{t("Class")}</h2>
					<ClassFilter
						filters="All"
						hideAll
						minimal
						selectedClasses={[
							this.props.playerClass as FilterOption,
						]}
						selectionChanged={selected => {
							this.props.setPlayerClass(selected[0]);
							FilterEvents.onFilterInteraction(
								"leaderboards",
								"player_class",
								selected[0] || "ALL",
							);
						}}
						archetypes={
							this.props.archetypeData
								? this.props.archetypeData
										.filter(
											x =>
												x.standard_ccp_signature_core &&
												x.standard_ccp_signature_core
													.components,
										)
										.map(x => ({
											id: "" + x.id,
											playerClass: x.player_class_name,
										}))
								: []
						}
						selectedArchetypes={
							this.props.archetype ? [this.props.archetype] : []
						}
						archetypesChanged={archetypes => {
							this.props.setArchetype(archetypes[0]);
							FilterEvents.onFilterInteraction(
								"leaderboards",
								"player_class_archetypes",
								archetypes.join(",") || "NONE",
							);
						}}
						archetypeMulitSelect={false}
					/>
				</section>
				<section id="time-frame-filter">
					<InfoboxFilterGroup
						header={t("Time frame")}
						selectedValue={this.props.timeRange}
						onClick={value => {
							this.props.setTimeRange(value);
							FilterEvents.onFilterInteraction(
								"leaderboards",
								"time_frame",
								value,
							);
						}}
					>
						<InfoboxFilter value={TimeRange.CURRENT_SEASON}>
							<PrettyTimeRange
								timeRange={TimeRange.CURRENT_SEASON}
							/>
						</InfoboxFilter>
						<InfoboxFilter value={TimeRange.PREVIOUS_SEASON}>
							<PrettyTimeRange
								timeRange={TimeRange.PREVIOUS_SEASON}
							/>
						</InfoboxFilter>
						<InfoboxFilter value={TimeRange.CURRENT_EXPANSION}>
							<PrettyTimeRange
								timeRange={TimeRange.CURRENT_EXPANSION}
							/>
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</section>
				<section id="rank-range-filter">
					<InfoboxFilterGroup
						header={t("Rank range")}
						selectedValue={this.props.rankRange}
						onClick={value => {
							this.props.setRankRange(value);
							FilterEvents.onFilterInteraction(
								"leaderboards",
								"rank_range",
								value,
							);
						}}
					>
						<InfoboxFilter
							value={RankRange.TOP_1000_LEGEND}
							id="high-legend-filter"
						>
							<PrettyRankRange
								rankRange={RankRange.TOP_1000_LEGEND}
							/>
						</InfoboxFilter>
						<InfoboxFilter value={RankRange.ALL}>
							<PrettyRankRange rankRange={RankRange.ALL} />
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</section>
				<section id="region-filter">
					<InfoboxFilterGroup
						header={t("Region")}
						selectedValue={this.props.region}
						onClick={region => {
							this.props.setRegion(region);
							FilterEvents.onFilterInteraction(
								"leaderboards",
								"region",
								region,
							);
						}}
					>
						<InfoboxFilter value="REGION_US">
							{t("Americas")}
						</InfoboxFilter>
						<InfoboxFilter value="REGION_EU">
							{t("Europe")}
						</InfoboxFilter>
						<InfoboxFilter value="REGION_KR">
							{t("Asia")}
						</InfoboxFilter>
						<InfoboxFilter value="REGION_CN">
							{t("China")}
						</InfoboxFilter>
						<InfoboxFilter value="ALL">
							{t("All regions")}
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</section>
				<section id="game-mode-filter">
					<h2>{t("Game mode")}</h2>
					<InfoboxFilterGroup
						selectedValue={this.props.gameType}
						onClick={value => {
							this.props.setGameType(value);
							FilterEvents.onFilterInteraction(
								"leaderboards",
								"game_type",
								value,
							);
						}}
					>
						<InfoboxFilter value="RANKED_STANDARD">
							{t("Ranked Standard")}
						</InfoboxFilter>
						<InfoboxFilter value="RANKED_WILD">
							{t("Ranked Wild")}
						</InfoboxFilter>
					</InfoboxFilterGroup>
				</section>
			</>
		);
	}
}

export default translate()(Leaderboards);
