import React from "react";
import BaseClassFilter, { FilterOption, FilterPreset } from "../../ClassFilter";
import CardFilter from "../CardFilter";
import memoize from "memoize-one";
import { CardFilterFunction } from "../CardFilterManager";
import { isEqual } from "lodash";
import { Trans } from "react-i18next";

interface Props {
	filters?: FilterOption[] | FilterPreset;
	value: FilterOption[];
	onChange: (value: FilterOption[]) => void;
	multiSelect?: boolean;
	includeNeutral?: boolean;
	title?: React.ReactNode;
}

export default class ClassFilter extends React.Component<Props> {
	static defaultProps = {
		filters: "All",
		multiSelect: true,
	};

	public render(): React.ReactNode {
		return (
			<>
				<h2>
					{this.props.title ? this.props.title : <Trans>Class</Trans>}
				</h2>
				<CardFilter
					filter={this.filter(
						this.props.value,
						this.props.includeNeutral,
					)}
				/>
				<BaseClassFilter
					filters={this.props.filters}
					multiSelect={this.props.multiSelect}
					minimal
					hideAll
					selectedClasses={this.props.value}
					selectionChanged={this.props.onChange}
				/>
			</>
		);
	}

	private filter = memoize(
		(
			values: string[],
			includeNeutral: boolean,
		): CardFilterFunction | null => {
			if (!values.length) {
				return null;
			}
			if (includeNeutral) {
				return card =>
					card.cardClass === "NEUTRAL" ||
					values.indexOf(card.cardClass) !== -1;
			}
			return card => values.indexOf(card.cardClass) !== -1;
		},
		isEqual,
	);
}
