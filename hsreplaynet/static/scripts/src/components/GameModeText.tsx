import React from "react";
import { GlobalGamePlayer } from "../interfaces";
import { BnetGameType } from "../hearthstone";

interface Props {
	player: GlobalGamePlayer;
	gameType: BnetGameType;
	scenarioId: number;
	className?: string;
}

export default class GameModeText extends React.Component<Props> {
	private isHeroicTavernBrawl(): boolean {
		return +this.props.scenarioId === 2109;
	}

	private getIconInfo(): string {
		if (!this.props.player) {
			return null;
		}
		switch (this.props.gameType) {
			case BnetGameType.BGT_ARENA:
				const wins = this.props.player.wins;
				const losses = this.props.player.losses;
				if (wins !== null || losses !== null) {
					return +wins + " - " + +losses;
				}
				return "Arena";
			case BnetGameType.BGT_RANKED_STANDARD:
			case BnetGameType.BGT_RANKED_WILD:
				if (this.props.player.rank) {
					return "Rank " + this.props.player.rank;
				}
				if (this.props.player.legend_rank) {
					return "Rank " + this.props.player.legend_rank;
				}
				return "Ranked";
			case BnetGameType.BGT_CASUAL_STANDARD:
			case BnetGameType.BGT_CASUAL_WILD:
				return "Casual";
			case BnetGameType.BGT_TAVERNBRAWL_1P_VERSUS_AI:
			case BnetGameType.BGT_TAVERNBRAWL_2P_COOP:
			case BnetGameType.BGT_TAVERNBRAWL_PVP:
				if (this.isHeroicTavernBrawl()) {
					return "Heroic Brawl";
				}
				return "Brawl";
			case BnetGameType.BGT_VS_AI:
				return "Adventure";
			case BnetGameType.BGT_FRIENDS:
				return "Friendly";
			default:
				return null;
		}
	}

	public render(): React.ReactNode {
		const text = this.getIconInfo();
		if (!text) {
			return null;
		}
		return <div className={this.props.className}>{text}</div>;
	}
}
