import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardFilterItem from "../CardFilterItem";
import CardFilterItemGroup from "../CardFilterItemGroup";
import { image } from "../../../helpers";

interface Props extends InjectedTranslateProps {
	value: string[];
	onChange: (value: string[]) => void;
}

class CostFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<CardFilterItemGroup
				title={t("Cost")}
				filterFactory={this.filter}
				value={this.props.value}
				onChange={this.props.onChange}
				className="filter-list-cost"
			>
				{Array.from(Array(8).keys())
					.map(i => "" + i)
					.map(cost => (
						<CardFilterItem
							noCount
							value={+cost < 7 ? cost : `${cost}+`}
							className="mana-crystal"
						>
							<img
								src={image("mana_crystal.png")}
								height={28}
								aria-hidden="true"
							/>
							<div>
								{+cost < 7 ? cost : `${cost}+`}
								<span className="sr-only">{t("Mana")}</span>
							</div>
						</CardFilterItem>
					))}
			</CardFilterItemGroup>
		);
	}

	private filter = value => card =>
		value.slice(-1) === "+"
			? card.cost >= +value.slice(0, -1)
			: card.cost === +value;
}

export default translate()(CostFilter);
