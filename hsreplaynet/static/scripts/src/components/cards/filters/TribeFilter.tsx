import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardFilterItem from "../CardFilterItem";
import CardFilterItemGroup from "../CardFilterItemGroup";

interface Props extends InjectedTranslateProps {
	value: string[];
	onChange: (value: string[]) => void;
}

class TribeFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<CardFilterItemGroup
				title={t("Tribe")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				collapsible
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

	private filter = value => card => card.race === value;
}

export default translate("hearthstone")(TribeFilter);
