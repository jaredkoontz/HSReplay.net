import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardFilterItem from "../CardFilterItem";
import CardFilterItemGroup from "../CardFilterItemGroup";
import { Collection } from "../../../utils/api";

interface Props extends InjectedTranslateProps {
	value: string[];
	onChange: (value: string[]) => void;
	collection?: Collection;
}

class MechanicsFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, collection } = this.props;

		return (
			<CardFilterItemGroup
				title={t("Mechanics")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				collapsible
				startCollapsed
				collection={collection}
			>
				<CardFilterItem value={"BATTLECRY"}>
					{t("GLOBAL_KEYWORD_BATTLECRY")}
				</CardFilterItem>
				<CardFilterItem value={"CHOOSE_ONE"}>
					{t("Choose One")}
				</CardFilterItem>
				<CardFilterItem value={"COMBO"}>
					{t("GLOBAL_KEYWORD_COMBO")}
				</CardFilterItem>
				<CardFilterItem value={"DEATHRATTLE"}>
					{t("GLOBAL_KEYWORD_DEATHRATTLE")}
				</CardFilterItem>
				<CardFilterItem value={"DIVINE_SHIELD"}>
					{t("GLOBAL_KEYWORD_DIVINE_SHIELD")}
				</CardFilterItem>
				<CardFilterItem value={"OVERLOAD"}>
					{t("Overload")}
				</CardFilterItem>
				<CardFilterItem value={"POISONOUS"}>
					{t("GLOBAL_KEYWORD_POISONOUS")}
				</CardFilterItem>
				<CardFilterItem value={"SECRET"}>
					{t("GLOBAL_KEYWORD_SECRET")}
				</CardFilterItem>
				<CardFilterItem value={"SILENCE"}>
					{t("GLOBAL_KEYWORD_SILENCE")}
				</CardFilterItem>
				<CardFilterItem value={"TAUNT"}>
					{t("GLOBAL_KEYWORD_TAUNT")}
				</CardFilterItem>
				<CardFilterItem value={"WINDFURY"}>
					{t("GLOBAL_KEYWORD_WINDFURY")}
				</CardFilterItem>
				<CardFilterItem value={"FREEZE"}>
					{t("GLOBAL_KEYWORD_FREEZE")}
				</CardFilterItem>
				<CardFilterItem value={"INSPIRE"}>
					{t("GLOBAL_KEYWORD_INSPIRE")}
				</CardFilterItem>
				<CardFilterItem value={"DISCOVER"}>
					{t("GLOBAL_KEYWORD_DISCOVER")}
				</CardFilterItem>
				<CardFilterItem value={"RITUAL"}>{t("Ritual")}</CardFilterItem>
				<CardFilterItem value={"JADE_GOLEM"}>
					{t("GLOBAL_KEYWORD_JADE_GOLEM")}
				</CardFilterItem>
				<CardFilterItem value={"ADAPT"}>
					{t("GLOBAL_KEYWORD_ADAPT")}
				</CardFilterItem>
				<CardFilterItem value={"QUEST"}>
					{t("GLOBAL_KEYWORD_QUEST")}
				</CardFilterItem>
				<CardFilterItem value={"LIFESTEAL"}>
					{t("GLOBAL_KEYWORD_LIFESTEAL")}
				</CardFilterItem>
				<CardFilterItem value={"ECHO"}>
					{t("GLOBAL_KEYWORD_ECHO")}
				</CardFilterItem>
				<CardFilterItem value={"RUSH"}>
					{t("GLOBAL_KEYWORD_RUSH")}
				</CardFilterItem>
				<CardFilterItem value={"MODULAR"}>
					{t("GLOBAL_KEYWORD_MODULAR")}
				</CardFilterItem>
			</CardFilterItemGroup>
		);
	}

	private filter = value => card =>
		card.mechanics && card.mechanics.indexOf(value) !== -1;
}

export default translate()(MechanicsFilter);
