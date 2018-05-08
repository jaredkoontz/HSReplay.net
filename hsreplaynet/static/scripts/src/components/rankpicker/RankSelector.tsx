import React from "react";
import { image } from "../../helpers";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	classNames: string[];
	onClick: () => void;
	rank: number;
}

class RankSelector extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, rank } = this.props;
		const classNames = ["rank-selector"].concat(this.props.classNames);
		const rankStr = rank === 0 ? t("Legend") : rank;
		const altStr = rank === 0 ? t("Legend") : t("Rank {{rank}}", { rank });
		return (
			<div className={classNames.join(" ")} onClick={this.props.onClick}>
				<img
					src={image(`64x/ranked-medals/Medal_Ranked_${rankStr}.png`)}
					alt={altStr}
				/>
				<span>{rankStr}</span>
			</div>
		);
	}
}

export default translate()(RankSelector);
