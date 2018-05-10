import React from "react";
import { BnetGameType } from "../../hearthstone";
import { withLoading } from "../loading/Loading";
import ClassList, { ClassListData } from "./ClassList";
import PrettyCardClass from "../text/PrettyCardClass";

interface ClassData<T> {
	[cardClass: string]: T;
}

interface ClassPerformanceData {
	game_type: number;
	popularity: number;
	total_games: number;
	win_rate: number;
}

interface Props {
	classData?: ClassData<ClassPerformanceData[]>;
	gameType: BnetGameType;
}

class ClassRanking extends React.Component<Props> {
	render(): React.ReactNode {
		const { classData, gameType } = this.props;
		const isArena = gameType === BnetGameType.BGT_ARENA;
		const classes: ClassListData[] = [];
		const data = Object.keys(classData)
			.map(playerClass => {
				const datum = classData[playerClass].find(
					x => x.game_type === gameType,
				);
				return datum
					? {
							playerClass,
							...datum,
					  }
					: null;
			})
			.filter(x => x != null);
		data.sort((a, b) => b.win_rate - a.win_rate);
		data.forEach((datum, index) => {
			const type = isArena ? "cards" : "decks";
			const classParam = isArena ? "playerClass" : "playerClasses";
			const url = `/${type}/#${classParam}=${datum.playerClass.toUpperCase()}&gameType=${this.gameTypeName(
				gameType,
			)}`;
			classes.push({
				playerClass: datum.playerClass,
				title: [
					<span key="index" className="class-index">
						#{index + 1}
					</span>,
					<span key="name" className="class-name">
						<PrettyCardClass cardClass={datum.playerClass} />
					</span>,
				],
				winRate: datum.win_rate,
				buttonText: isArena ? "View Cards" : "View Decks",
				href: url,
			});
		});
		return <ClassList className="class-ranking" data={classes} />;
	}

	gameTypeName(bgt: BnetGameType): string {
		switch (bgt) {
			case BnetGameType.BGT_RANKED_STANDARD:
				return "RANKED_STANDARD";
			case BnetGameType.BGT_RANKED_WILD:
				return "RANKED_WILD";
			case BnetGameType.BGT_ARENA:
				return "ARENA";
		}
	}
}

export default withLoading(["classData"])(ClassRanking);
