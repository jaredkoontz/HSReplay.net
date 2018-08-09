import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { CardData as Card } from "hearthstonejson-client";
import CardFilter from "../CardFilter";
import CardFilterGroup from "../CardFilterGroup";

class TribeFilter extends React.Component<InjectedTranslateProps> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<CardFilterGroup
				title={t("Tribe")}
				filter={(card: Card, value: string) => value === card.race}
				collapsible
			>
				<CardFilter value={"BEAST"}>{t("GLOBAL_RACE_PET")}</CardFilter>
				<CardFilter value={"DEMON"}>
					{t("GLOBAL_RACE_DEMON")}
				</CardFilter>
				<CardFilter value={"DRAGON"}>
					{t("GLOBAL_RACE_DRAGON")}
				</CardFilter>
				<CardFilter value={"ELEMENTAL"}>
					{t("GLOBAL_RACE_ELEMENTAL")}
				</CardFilter>
				<CardFilter value={"MECHANICAL"}>
					{t("GLOBAL_RACE_MECHANICAL")}
				</CardFilter>
				<CardFilter value={"MURLOC"}>
					{t("GLOBAL_RACE_MURLOC")}
				</CardFilter>
				<CardFilter value={"PIRATE"}>
					{t("GLOBAL_RACE_PIRATE")}
				</CardFilter>
				<CardFilter value={"TOTEM"}>
					{t("GLOBAL_RACE_TOTEM")}
				</CardFilter>
			</CardFilterGroup>
		);
	}
}

export default translate("hearthstone")(TribeFilter);
