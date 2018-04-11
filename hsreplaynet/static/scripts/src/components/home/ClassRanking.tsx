import * as React from "react";
import {
	getHeroClassName,
	getHeroSkinCardUrl,
	toDynamicFixed,
	winrateData,
} from "../../helpers";
import { BnetGameType } from "../../hearthstone";
import { withLoading } from "../loading/Loading";

interface ClassData<T> {
	[cardClass: string]: T;
}

interface ClassPerformanceData {
	game_type: number;
	popularity: number;
	total_games: number;
	win_rate: number;
}

interface State {
	hovering: number;
}

interface Props {
	classData?: ClassData<ClassPerformanceData[]>;
	gameType: BnetGameType;
}

class ClassRanking extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			hovering: 0,
		};
	}

	getImagePosition(playerClass: string): number {
		switch (playerClass.toLowerCase()) {
			case "druid":
				return 0.29;
			case "hunter":
				return 0.22;
			case "mage":
				return 0.28;
			case "paladin":
				return 0.2;
			case "priest":
				return 0.22;
			case "rogue":
				return 0.32;
			case "shaman":
				return 0.28;
			case "warlock":
				return 0.36;
			case "warrior":
				return 0.22;
		}
	}

	render(): React.ReactNode {
		const { classData, gameType } = this.props;
		const isArena = gameType === BnetGameType.BGT_ARENA;
		const classes = [];
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
			const style = {
				backgroundImage: `url(${getHeroSkinCardUrl(
					datum.playerClass,
				).replace("256", "512")})`,
				backgroundPositionY: `${100 *
					this.getImagePosition(datum.playerClass)}%`,
			};
			const type = isArena ? "cards" : "decks";
			const classParam = isArena ? "playerClass" : "playerClasses";
			const url = `/${type}/#${classParam}=${datum.playerClass.toUpperCase()}&gameType=${this.gameTypeName(
				gameType,
			)}`;
			classes.push(
				<li
					className="class-item"
					style={style}
					key={datum.playerClass}
					onMouseEnter={() => this.setState({ hovering: index })}
					onMouseLeave={() => this.setState({ hovering: 0 })}
				>
					<div
						className={
							"color-overlay " + datum.playerClass.toLowerCase()
						}
					/>
					<a href={url} className="class-item-content">
						<span className="class-index">#{index + 1}</span>
						<span className="class-name">
							{getHeroClassName(datum.playerClass)}
						</span>
						<div className="winrate-wrapper">
							<span
								className="class-winrate"
								style={{
									color: winrateData(50, datum.win_rate, 3)
										.color,
								}}
							>
								{toDynamicFixed(datum.win_rate, 1)}%
							</span>
						</div>
						{this.state.hovering === index ? (
							<a className="btn view-decks-btn" href={url}>
								View {isArena ? "Cards" : "Decks"}
							</a>
						) : null}
					</a>
				</li>,
			);
		});
		return <ul id="class-ranking">{classes}</ul>;
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
