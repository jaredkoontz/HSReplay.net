import React from "react";
import { ApiArchetypePopularity, SortableProps } from "../../interfaces";
import Table, { TableColumn } from "../tables/Table";
import CardData from "../../CardData";
import ArchetypeSignatureTooltip from "./ArchetypeSignatureTooltip";
import OtherArchetype from "./OtherArchetype";
import { Archetype } from "../../utils/api";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends SortableProps, InjectedTranslateProps {
	data: ApiArchetypePopularity[];
	archetypeData: Archetype[];
	gameType: string;
	cardData: CardData;
	playerClass: string;
	totalPopularity?: boolean;
}

interface Row extends ApiArchetypePopularity {
	archetype: Partial<Archetype>;
	is_other?: boolean;
}

const CELL_HEIGHT = 36;
const MIN_COLUMN_WIDTH = 100;
const MAX_HEADER_WIDTH = 217;
const MIN_HEADER_WIDTH = 150;

class ArchetypeClassTable extends React.Component<Props> {
	public render(): React.ReactNode {
		const { data, playerClass, sortBy, sortDirection, t } = this.props;
		const columns = this.getColumns();
		const rows: Row[] = [];
		data.forEach(datum => {
			const archetype = this.props.archetypeData.find(
				a => a.id === datum.archetype_id,
			);
			if (archetype) {
				rows.push({
					archetype,
					...datum,
				});
			} else {
				rows.push({
					archetype: {
						id: datum.archetype_id,
						name: t("Other"),
						player_class_name: playerClass,
					},
					is_other: true,
					...datum,
				});
			}
		});
		const { dataKey } = columns.find(c => c.sortKey === sortBy);
		const direction = sortDirection === "ascending" ? 1 : -1;
		rows.sort((a, b) => {
			if (typeof a["is_other"] !== "undefined" && a["is_other"]) {
				return 1;
			}
			if (typeof b["is_other"] !== "undefined" && b["is_other"]) {
				return -1;
			}
			if (dataKey === "archetype_name") {
				return a.archetype.name > b.archetype.name
					? direction
					: -direction;
			}
			return a[dataKey] > b[dataKey] ? direction : -direction;
		});

		const rowData = rows.map(row => {
			return {
				data: [
					this.renderHeader(row.archetype),
					...columns.slice(1).map(c => row[c.dataKey]),
				],
				href: row.archetype.url,
			};
		});

		return (
			<Table
				cellHeight={CELL_HEIGHT}
				minColumnWidth={MIN_COLUMN_WIDTH}
				headerWidth={[MIN_HEADER_WIDTH, MAX_HEADER_WIDTH]}
				sortBy={sortBy}
				sortDirection={sortDirection}
				onSortChanged={this.props.onSortChanged}
				columns={columns}
				rowData={rowData}
				rowHighlighting
			/>
		);
	}

	renderHeader(archetype: Partial<Archetype>) {
		const className =
			"player-class " + archetype.player_class_name.toLowerCase();
		if (archetype.id < 0) {
			return (
				<span className={className}>
					<OtherArchetype
						name={archetype.name}
						playerClass={archetype.player_class_name}
					/>
				</span>
			);
		}

		return (
			<ArchetypeSignatureTooltip
				key={archetype.id}
				cardData={this.props.cardData}
				archetypeId={archetype.id}
				archetypeName={archetype.name}
				gameType={this.props.gameType}
			>
				<a className={className} href={archetype.url}>
					{archetype.name}
				</a>
			</ArchetypeSignatureTooltip>
		);
	}

	private getColumns(): TableColumn[] {
		const { t } = this.props;
		const popularityKey = this.props.totalPopularity
			? "pct_of_total"
			: "pct_of_class";
		return [
			{
				dataKey: "archetype_name",
				sortKey: "archetype",
				text: t("Archetype"),
				defaultSortDirection: "ascending",
			},
			{
				dataKey: "win_rate",
				sortKey: "winrate",
				text: t("Winrate"),
				winrateData: true,
			},
			{
				dataKey: popularityKey,
				percent: true,
				sortKey: "games",
				text: t("Popularity"),
			},
			{
				dataKey: "total_games",
				prettify: true,
				sortKey: "games",
				text: t("Games"),
			},
		];
	}
}

export default translate()(ArchetypeClassTable);
