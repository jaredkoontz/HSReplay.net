import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { BnetGameType } from "../hearthstone";
import { image } from "../helpers";
import { GlobalGamePlayer } from "../interfaces";

export interface Props extends InjectedTranslateProps {
	player: GlobalGamePlayer;
	gameType: BnetGameType;
	disconnected: boolean;
	scenarioId: number;
	className: string;
	small?: boolean;
}

interface IconInfo {
	imgPath: string;
	text: string;
}

class GameModeIcon extends React.Component<Props> {
	isHeroicTavernBrawl(): boolean {
		return this.props.scenarioId === 2109;
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		if (this.props.disconnected) {
			return (
				<img
					src={image("dc.png")}
					className={this.props.className}
					alt={t("Disconnected")}
				/>
			);
		}
		const info = this.getIconInfo(this.props.gameType);
		if (!info) {
			return null;
		}
		const style =
			this.props.small && this.props.gameType === BnetGameType.BGT_VS_AI
				? { height: "1.5em", margin: "0.25em" }
				: null;
		return (
			<img
				src={info.imgPath}
				alt={info.text}
				title={info.text}
				className={this.props.className}
				style={style}
			/>
		);
	}

	private getIconInfo(gameType: BnetGameType): IconInfo {
		const basePath = this.props.small ? "64x/" : "";
		const { t } = this.props;
		let imgPath = null;
		let text = null;
		switch (gameType) {
			case BnetGameType.BGT_ARENA:
				const wins = this.props.player ? this.props.player.wins + 1 : 1;
				imgPath = "arena-medals/Medal_Key_" + wins + ".png";
				text = t("Arena");
				break;
			case BnetGameType.BGT_RANKED_STANDARD:
			case BnetGameType.BGT_RANKED_WILD:
				if (this.props.player) {
					if (this.props.player.rank) {
						imgPath =
							"ranked-medals/Medal_Ranked_" +
							this.props.player.rank +
							".png";
						text = t("Ranked");
						break;
					}
					if (this.props.player.legend_rank) {
						imgPath = "ranked-medals/Medal_Ranked_Legend.png";
						text = t("Legend");
					}
				}
				break;
			case BnetGameType.BGT_TAVERNBRAWL_1P_VERSUS_AI:
			case BnetGameType.BGT_TAVERNBRAWL_2P_COOP:
			case BnetGameType.BGT_TAVERNBRAWL_PVP:
				if (this.isHeroicTavernBrawl()) {
					imgPath = "mode-icons/brawl_skull.png";
					text = t("Heroic Tavern Brawl");
					break;
				}
				imgPath = "mode-icons/modeID_Brawl.png";
				text = t("Tavern Brawl");
				break;
			case BnetGameType.BGT_CASUAL_STANDARD:
				imgPath = "mode-icons/casual.png";
				text = t("Casual");
				break;
			case BnetGameType.BGT_CASUAL_WILD:
				imgPath = "mode-icons/casual-wild.png";
				text = t("Casual (Wild)");
				break;
			case BnetGameType.BGT_VS_AI:
				imgPath = "mode-icons/mode_ai.png";
				text = t("Adventure");
				break;
			case BnetGameType.BGT_FRIENDS:
				imgPath = "mode-icons/mode_friendly.png";
				text = t("Friendly Challenge");
				break;
		}
		if (!imgPath) {
			return null;
		}
		imgPath = image(basePath + imgPath);
		return { imgPath, text };
	}
}

export default translate()(GameModeIcon);
