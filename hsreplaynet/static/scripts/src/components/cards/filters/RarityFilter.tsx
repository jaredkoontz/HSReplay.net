import React from "react";
import { WithTranslation, withTranslation } from "react-i18next";
import CardFilterItem from "../CardFilterItem";
import CardFilterItemGroup from "../CardFilterItemGroup";
import { Collection } from "../../../utils/api";

interface Props extends WithTranslation {
	value: string[];
	onChange: (value: string[]) => void;
	collection?: Collection;
}

class RarityFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, collection } = this.props;

		return (
			<CardFilterItemGroup
				title={t("Rarity")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				collapsible
				startCollapsed={false}
				collection={collection}
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

export default withTranslation()(RarityFilter);
