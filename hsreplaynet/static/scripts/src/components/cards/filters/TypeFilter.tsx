import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardFilterItem from "../CardFilterItem";
import CardFilterItemGroup from "../CardFilterItemGroup";

interface Props extends InjectedTranslateProps {
	value: string[];
	onChange: (value: string[]) => void;
}

class TypeFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;

		return (
			<CardFilterItemGroup
				title={t("Type")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				collapsible={false}
			>
				<CardFilterItem value={"MINION"}>
					{t("GLOBAL_CARDTYPE_MINION")}
				</CardFilterItem>
				<CardFilterItem value={"SPELL"}>
					{t("GLOBAL_CARDTYPE_SPELL")}
				</CardFilterItem>
				<CardFilterItem value={"WEAPON"}>
					{t("GLOBAL_CARDTYPE_WEAPON")}
				</CardFilterItem>
				<CardFilterItem value={"HERO"}>
					{t("GLOBAL_CARDTYPE_HERO")}
				</CardFilterItem>
			</CardFilterItemGroup>
		);
	}

	private filter = value => card => card.type === value;
}

export default translate("hearthstone")(TypeFilter);
