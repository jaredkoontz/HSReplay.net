import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { BnetGameType } from "../hearthstone";
import { GlobalGamePlayer } from "../interfaces";

interface Props extends InjectedTranslateProps {
	player: GlobalGamePlayer;
	gameType: BnetGameType;
	scenarioId: number;
	className?: string;
}

class GameModeText extends React.Component<Props> {
	private isHeroicTavernBrawl(): boolean {
		return +this.props.scenarioId === 2109;
	}

	private getIconInfo(): string {
		const { t } = this.props;
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
				return t("Arena");
			case BnetGameType.BGT_RANKED_STANDARD:
			case BnetGameType.BGT_RANKED_WILD:
				if (this.props.player.rank) {
					return t("Rank {rank}", { rank: this.props.player.rank });
				}
				if (this.props.player.legend_rank) {
					return t("Rank {rank}", {
						rank: this.props.player.legend_rank,
					});
				}
				return t("Ranked");
			case BnetGameType.BGT_CASUAL_STANDARD:
			case BnetGameType.BGT_CASUAL_WILD:
				return t("Casual");
			case BnetGameType.BGT_TAVERNBRAWL_1P_VERSUS_AI:
			case BnetGameType.BGT_TAVERNBRAWL_2P_COOP:
			case BnetGameType.BGT_TAVERNBRAWL_PVP:
				if (this.isHeroicTavernBrawl()) {
					return t("Heroic Brawl");
				}
				return t("Brawl");
			case BnetGameType.BGT_VS_AI:
				return t("Adventure");
			case BnetGameType.BGT_FRIENDS:
				return t("Friendly");
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

export default translate()(GameModeText);
