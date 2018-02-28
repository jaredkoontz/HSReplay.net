import React from "react";
import RowSelector, { Mode } from "./RowSelector";
import RankSelector from "./RankSelector";

interface Props {
	selected: string;
	onSelectionChanged: (selected: string) => void;
}

interface State {
	forceSet?: boolean;
}

const rankMap = {
	0: "LEGEND",
	1: "ONE",
	2: "TWO",
	3: "THREE",
	4: "FOUR",
	5: "FIVE",
	6: "SIX",
	7: "SEVEN",
	8: "EIGHT",
	9: "NINE",
	10: "TEN",
	11: "ELEVEN",
	12: "TWELVE",
	13: "THIRTEEN",
	14: "FOURTEEN",
	15: "FIFTEEN",
	16: "SIXTEEN",
	17: "SEVENTEEN",
	18: "EIGHTEEN",
	19: "NINETEEN",
	20: "TWENTY",
	21: "TWENTYONE",
	22: "TWENTYTWO",
	23: "TWENTYTHREE",
	24: "TWENTYFOUR",
	25: "TWENTYFIVE",
};

export default class RankPicker extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			forceSet: false,
		};
	}

	public componentDidMount(): void {
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyUp);
	}

	public componentWillUnmount(): void {
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);
	}

	handleKeyDown = event => {
		if (event.key === "Control" && !this.state.forceSet) {
			this.setState({ forceSet: true });
		}
	};

	handleKeyUp = event => {
		if (event.key === "Control" && this.state.forceSet) {
			this.setState({ forceSet: false });
		}
	};

	public render(): React.ReactNode {
		const selectedRanks = this.getSelectedRanks();
		const { forceSet } = this.state;

		const items = [];
		const selectedRows = this.getSelectedRows();

		const ranks = Array(21)
			.fill(null)
			.map((x, index) => index);
		ranks.forEach(rank => {
			const rankClasses = [];
			const rowClasses = [];
			if (rank === 0) {
				rankClasses.push("rank-selector-legend");
			}
			if (selectedRanks[0] <= rank && selectedRanks[1] >= rank) {
				rankClasses.push("selected");
			}
			const lowerBoundSelected = selectedRanks[0] <= rank;
			const upperBoundSelected =
				selectedRanks[1] >= rank + 4 ||
				(rank === 0 && selectedRanks[0] === 0);
			const rowSelected = lowerBoundSelected && upperBoundSelected;
			if (rowSelected) {
				rowClasses.push("selected");
				if (selectedRows.length === 1) {
					rowClasses.push("only");
				}
			}
			if (rank === 0 || (rank - 1) % 5 === 0) {
				const row = Math.floor((rank - 1) / 5);
				const adjacentSelected = [row - 1, row, row + 1].some(
					r => selectedRows.indexOf(r) !== -1,
				);
				items.push(
					<RowSelector
						classNames={rowClasses}
						onClick={mode => this.onRanksChanged(rank, mode)}
						mode={
							!forceSet && adjacentSelected && !rowSelected
								? "add"
								: "set"
						}
					/>,
				);
			}
			items.push(
				<RankSelector
					classNames={rankClasses}
					onClick={() =>
						this.props.onSelectionChanged(
							this.encodeRankRange(rank, rank),
						)
					}
					rank={rank}
				/>,
			);
		});

		return <div className="rank-picker">{items}</div>;
	}

	getSelectedRanks(): [number, number] {
		return this.decodeRankRange(this.props.selected);
	}

	decodeRank(value: string): number {
		if (value === "LEGEND_ONLY") {
			return 0;
		}
		for (const key of Object.keys(rankMap)) {
			if (rankMap[key] === value) {
				return +key;
			}
		}
		return null;
	}

	decodeRankRange(value: string): [number, number] {
		const singleRank = this.decodeRank(value);
		if (singleRank !== null) {
			return [singleRank, singleRank];
		}
		const regex = /([A-Z]+)_THROUGH_([A-Z]+)/;
		const matches = regex.exec(value);
		if (matches) {
			return [this.decodeRank(matches[1]), this.decodeRank(matches[2])];
		}
		return null;
	}

	encodeRankRange(min: number, max: number): string {
		if (min === max) {
			const str = rankMap[min];
			return min === 0 ? str + "_ONLY" : str;
		}
		return `${rankMap[min]}_THROUGH_${rankMap[max]}`;
	}

	getSelectedRows(): number[] {
		// Translate rank ranges into row ranges
		// e.g. [1, 5] => [0], [1, 10] => [0, 1]
		const selectedRanks = this.getSelectedRanks();
		const range = selectedRanks[1] - selectedRanks[0];
		const numRows = Math.floor((range + 1) / 5) + +(selectedRanks[0] === 0);
		const offset = Math.floor((selectedRanks[0] - 1) / 5);
		return Array(numRows)
			.fill(null)
			.map((x, index) => index + offset);
	}

	onRanksChanged(rank: number, mode: Mode) {
		const current = this.decodeRankRange(this.props.selected);
		const { forceSet } = this.state;
		const range = rank === 0 ? 0 : 4;
		const addMode = !forceSet && mode === "add";
		const minRank = addMode ? Math.min(rank, current[0]) : rank;
		const maxRank = addMode
			? Math.max(rank + range, current[1])
			: rank + range;
		this.props.onSelectionChanged(this.encodeRankRange(minRank, maxRank));
	}
}
