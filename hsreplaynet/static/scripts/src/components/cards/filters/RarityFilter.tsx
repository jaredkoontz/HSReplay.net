import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardFilterItem from "../CardFilterItem";
import CardFilterItemGroup from "../CardFilterItemGroup";

interface Props extends InjectedTranslateProps {
	value: string[];
	onChange: (value: string[]) => void;
}

class RarityFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<CardFilterItemGroup
				title={t("Rarity")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				collapsible
				startCollapsed={false}
			>
				<CardFilterItem value={"FREE"}>
					{t("GLOBAL_RARITY_FREE")}
				</CardFilterItem>
				<CardFilterItem value={"COMMON"}>
					{t("GLOBAL_RARITY_COMMON")}
				</CardFilterItem>
				<CardFilterItem value={"RARE"}>
					{t("GLOBAL_RARITY_RARE")}
				</CardFilterItem>
				<CardFilterItem value={"EPIC"}>
					{t("GLOBAL_RARITY_EPIC")}
				</CardFilterItem>
				<CardFilterItem value={"LEGENDARY"}>
					{t("GLOBAL_RARITY_LEGENDARY")}
				</CardFilterItem>
			</CardFilterItemGroup>
		);
	}

	private filter = value => card => card.rarity === value;
}

export default translate("hearthstone")(RarityFilter);
