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

class TribeFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t, collection } = this.props;

		return (
			<CardFilterItemGroup
				title={t("Tribe")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				collapsible
				startCollapsed
				collection={collection}
			>
				<CardFilterItem value={"BEAST"}>
					{t("GLOBAL_RACE_PET")}
				</CardFilterItem>
				<CardFilterItem value={"DEMON"}>
					{t("GLOBAL_RACE_DEMON")}
				</CardFilterItem>
				<CardFilterItem value={"DRAGON"}>
					{t("GLOBAL_RACE_DRAGON")}
				</CardFilterItem>
				<CardFilterItem value={"ELEMENTAL"}>
					{t("GLOBAL_RACE_ELEMENTAL")}
				</CardFilterItem>
				<CardFilterItem value={"MECHANICAL"}>
					{t("GLOBAL_RACE_MECHANICAL")}
				</CardFilterItem>
				<CardFilterItem value={"MURLOC"}>
					{t("GLOBAL_RACE_MURLOC")}
				</CardFilterItem>
				<CardFilterItem value={"PIRATE"}>
					{t("GLOBAL_RACE_PIRATE")}
				</CardFilterItem>
				<CardFilterItem value={"TOTEM"}>
					{t("GLOBAL_RACE_TOTEM")}
				</CardFilterItem>
			</CardFilterItemGroup>
		);
	}

	private filter = value => card => {
		if (card.dbfId === 49502) {
			// Nightmare Amalgam
			return true;
		}
		return card.race === value;
	};
}

export default withTranslation()(TribeFilter);
