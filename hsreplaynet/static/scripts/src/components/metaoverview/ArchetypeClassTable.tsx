import React from "react";
import { ApiArchetypePopularity, SortableProps } from "../../interfaces";
import Table, { TableColumn } from "../tables/Table";
import CardData from "../../CardData";
import ArchetypeSignatureTooltip from "./ArchetypeSignatureTooltip";
import OtherArchetype from "./OtherArchetype";
import { Archetype } from "../../utils/api";

interface Props extends SortableProps {
	data: ApiArchetypePopularity[];
	archetypeData: Archetype[];
	gameType: string;
	cardData: CardData;
	playerClass: string;
	totalPopularity?: boolean;
}

const CELL_HEIGHT = 36;
const MIN_COLUMN_WIDTH = 100;
const MAX_HEADER_WIDTH = 217;
const MIN_HEADER_WIDTH = 150;

export default class ArchetypeClassTable extends React.Component<Props> {
	public render(): React.ReactNode {
		const { data, playerClass, sortBy, sortDirection } = this.props;
		const columns = this.getColumns();
		const rows = [];
		data.forEach(datum => {
			const archetype = this.props.archetypeData.find(
				a => a.id === datum.archetype_id,
			);
			if (archetype) {
				rows.push({
					archetype_name: archetype.name,
					archetype,
					...datum,
				});
			} else {
				rows.push({
					archetype: {
						id: datum.archetype_id,
						name: "Other",
						player_class_name: playerClass,
					},
					archetype_name: "Other",
					...datum,
				});
			}
		});
		const { dataKey } = columns.find(c => c.sortKey === sortBy);
		const direction = sortDirection === "ascending" ? 1 : -1;
		rows.sort((a, b) => {
			if (dataKey === "archetype_name") {
				if (a.archetype_id < 0) {
					return direction;
				}
				if (b.archetype_id < 0) {
					return -direction;
				}
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

	renderHeader(archetype: Archetype) {
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

	getColumns(): TableColumn[] {
		const popularityKey = this.props.totalPopularity
			? "pct_of_total"
			: "pct_of_class";
		return [
			{
				dataKey: "archetype_name",
				sortKey: "archetype",
				text: "Archetype",
			},
			{
				dataKey: "win_rate",
				sortKey: "winrate",
				text: "Winrate",
				winrateData: true,
			},
			{
				dataKey: popularityKey,
				percent: true,
				sortKey: "games",
				text: "Popularity",
			},
			{
				dataKey: "total_games",
				prettify: true,
				sortKey: "games",
				text: "Games",
			},
		];
	}
}
