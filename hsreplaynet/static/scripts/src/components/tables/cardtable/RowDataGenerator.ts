import { CardObj, SortDirection } from "../../../interfaces";
import { cardSorting } from "../../../helpers";
import { TableColumn } from "../Table";

export interface CardData {
	card: CardObj;
	data: any;
}

interface RowData {
	card: CardObj;
	values: number[];
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
			values: columns.map(x => (data ? data[x.dataKey] : null)),
		};
	});
}
