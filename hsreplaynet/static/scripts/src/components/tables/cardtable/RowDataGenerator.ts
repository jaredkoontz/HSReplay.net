import { CardObj, SortDirection } from "../../../interfaces";
import { cardSorting } from "../../../helpers";
import { AnnotatedNumber, TableColumn } from "../Table";
import React from "react";
import UserData from "../../../UserData";

export interface CardData {
	card: CardObj;
	data: any;
}

interface RowData {
	card: CardObj;
	values: Array<number | AnnotatedNumber | React.ReactNode>;
}

export interface ApiCardStatsData {
	[key: string]: any;
}

export function generateCardTableRowData(
	cards: CardObj[],
	data: ApiCardStatsData[],
	sortBy: string,
	sortDirection: SortDirection,
	columns: TableColumn[],
): RowData[] {
	const cardData = generateCardData(cards, data);
	const sortedCardData = sortCardData(
		cardData,
		sortBy,
		sortDirection,
		columns,
	);
	const rowData = generateRowData(sortedCardData, columns);
	return rowData;
}

function generateCardData(
	cards: CardObj[],
	data: ApiCardStatsData[],
): CardData[] {
	return cards.map((cardObj: CardObj) => {
		return {
			card: cardObj,
			data: data.find(x => x.dbf_id === cardObj.card.dbfId),
		};
	});
}

function sortCardData(
	cardData: CardData[],
	sortBy: string,
	sortDirection: SortDirection,
	columns: TableColumn[],
): CardData[] {
	const direction = sortDirection === "descending" ? 1 : -1;
	cardData = cardData.slice();
	if (sortBy === "card") {
		cardData.sort((a, b) =>
			cardSorting(a.card.card, b.card.card, -direction),
		);
	} else {
		const column = columns.find(x => x.sortKey === sortBy);
		if (column) {
			const key = column.dataKey;
			cardData.sort((a, b) => {
				const aValue = (a.data ? a.data[key] : 0) || 0;
				const bValue = (b.data ? b.data[key] : 0) || 0;
				return (
					(bValue - aValue) * direction ||
					(a.card.card.name > b.card.card.name
						? -direction
						: direction)
				);
			});
		}
	}
	return cardData;
}

function generateRowData(
	cardData: CardData[],
	columns: TableColumn[],
): RowData[] {
	return cardData.map(({ card, data }) => {
		return {
			card: { card: card.card, count: card.count },
			values: columns.map(x => {
				if (!data) {
					return null;
				}
				if (
					UserData.hasFeature("rafaam-data-warning") &&
					card.card.dbfId === 52119 &&
					[
						"opening_hand_winrate",
						"winrate_when_drawn",
						"winrate_when_played",
					].indexOf(x.dataKey) !== -1
				) {
					return {
						value: data[x.dataKey],
						annotation: {
							type: "warning",
							tooltip:
								"We are currently investigating a possible issue with this card's statistics.",
						},
					};
				}
				if (
					x.lowDataKey &&
					x.lowDataValue &&
					data[x.lowDataKey] <= x.lowDataValue
				) {
					return {
						value: data[x.dataKey],
						annotation: {
							type: "warning",
							tooltip: x.lowDataWarning,
						},
					};
				}
				return data[x.dataKey];
			}),
		};
	});
}
