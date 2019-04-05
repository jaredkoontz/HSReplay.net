import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CardFilterItem from "../CardFilterItem";
import CardFilterItemGroup from "../CardFilterItemGroup";
import { Collection } from "../../../utils/api";

interface Props extends WithTranslation {
	value: string[];
	onChange: (value: string[]) => void;
	collection?: Collection;
	onlyCollectibleSets?: boolean;
}

class SetFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, collection } = this.props;

		return (
			<CardFilterItemGroup
				title={t("Set")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				collapsible
				startCollapsed
				collection={collection}
			>
				<CardFilterItem value={"CORE"}>
					{t("GLOBAL_CARD_SET_CORE")}
				</CardFilterItem>
				<CardFilterItem value={"EXPERT1"}>
					{t("GLOBAL_CARD_SET_EXPERT1")}
				</CardFilterItem>
				<CardFilterItem value={"DALARAN"}>
					{t("GLOBAL_CARD_SET_DALARAN")}
				</CardFilterItem>
				<CardFilterItem value={"TROLL"}>
					{t("GLOBAL_CARD_SET_TROLL")}
				</CardFilterItem>
				<CardFilterItem value={"BOOMSDAY"}>
					{t("GLOBAL_CARD_SET_BOOMSDAY")}
				</CardFilterItem>
				<CardFilterItem value={"GILNEAS"}>
					{t("GLOBAL_CARD_SET_GILNEAS")}
				</CardFilterItem>
				<CardFilterItem value={"LOOTAPALOOZA"}>
					{t("GLOBAL_CARD_SET_LOOTAPALOOZA")}
				</CardFilterItem>
				<CardFilterItem value={"ICECROWN"}>
					{t("GLOBAL_CARD_SET_ICECROWN")}
				</CardFilterItem>
				<CardFilterItem value={"UNGORO"}>
					{t("GLOBAL_CARD_SET_UNGORO")}
				</CardFilterItem>
				<CardFilterItem value={"GANGS"}>
					{t("GLOBAL_CARD_SET_GANGS")}
				</CardFilterItem>
				<CardFilterItem value={"KARA"}>
					{t("GLOBAL_CARD_SET_KARA")}
				</CardFilterItem>
				<CardFilterItem value={"OG"}>
					{t("GLOBAL_CARD_SET_OG")}
				</CardFilterItem>
				<CardFilterItem value={"LOE"}>
					{t("GLOBAL_CARD_SET_LOE")}
				</CardFilterItem>
				<CardFilterItem value={"TGT"}>
					{t("GLOBAL_CARD_SET_TGT")}
				</CardFilterItem>
				<CardFilterItem value={"BRM"}>
					{t("GLOBAL_CARD_SET_BRM")}
				</CardFilterItem>
				<CardFilterItem value={"GVG"}>
					{t("GLOBAL_CARD_SET_GVG")}
				</CardFilterItem>
				<CardFilterItem value={"NAXX"}>
					{t("GLOBAL_CARD_SET_NAXX")}
				</CardFilterItem>
				<CardFilterItem value={"HOF"}>
					{t("GLOBAL_CARD_SET_HOF")}
				</CardFilterItem>
			</CardFilterItemGroup>
		);
	}

	private filter = value => card => card.set === value;
}

export default withTranslation()(SetFilter);
