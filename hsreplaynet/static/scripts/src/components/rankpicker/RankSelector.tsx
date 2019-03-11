import React from "react";
import { image } from "../../helpers";
import { WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
	classNames: string[];
	onClick: () => void;
	rank: number;
	disabled?: boolean;
}

class RankSelector extends React.Component<Props> {
	private ref: HTMLButtonElement | null = null;

	public render(): React.ReactNode {
		const { t, rank, disabled } = this.props;
		const classNames = ["rank-selector"].concat(this.props.classNames);
		const srcString = rank === 0 ? "Legend" : rank;
		const rankStr = rank === 0 ? t("Legend") : rank;
		const altStr = rank === 0 ? t("Legend") : t("Rank {rank}", { rank });
		return (
			<button
				className={classNames.join(" ")}
				onClick={this.toggle}
				disabled={disabled}
				ref={ref => (this.ref = ref)}
			>
				<img
					src={image(
						`64x/ranked-medals/Medal_Ranked_${srcString}.png`,
					)}
					alt={altStr}
				/>
				<span aria-hidden="true">{rankStr}</span>
			</button>
		);
	}

	private toggle = (): void => {
		if (this.props.disabled) {
			return;
		}
		this.props.onClick();
		if (this.ref) {
			this.ref.blur();
		}
	};
}

export default withTranslation()(RankSelector);
