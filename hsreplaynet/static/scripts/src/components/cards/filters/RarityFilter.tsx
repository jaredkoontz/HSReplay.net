import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { CardData as Card } from "hearthstonejson-client";
import CardFilter from "../CardFilter";
import CardFilterGroup from "../CardFilterGroup";

class RarityFilter extends React.Component<InjectedTranslateProps> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<CardFilterGroup
				title={t("Rarity")}
				filter={(card: Card, value: string) => value === card.rarity}
			>
				<CardFilter value={"FREE"}>
					{t("GLOBAL_RARITY_FREE")}
				</CardFilter>
				<CardFilter value={"COMMON"}>
					{t("GLOBAL_RARITY_COMMON")}
				</CardFilter>
				<CardFilter value={"RARE"}>
					{t("GLOBAL_RARITY_RARE")}
				</CardFilter>
				<CardFilter value={"EPIC"}>
					{t("GLOBAL_RARITY_EPIC")}
				</CardFilter>
				<CardFilter value={"LEGENDARY"}>
					{t("GLOBAL_RARITY_LEGENDARY")}
				</CardFilter>
			</CardFilterGroup>
		);
	}
}

export default translate("hearthstone")(RarityFilter);
