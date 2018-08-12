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
}

export default class ClassFilter extends React.Component<Props> {
	static defaultProps = {
		filters: "All",
	};

	public render(): React.ReactNode {
		return (
			<>
				<h2>
					<Trans>Class</Trans>
				</h2>
				<CardFilter filter={this.filter(this.props.value)} />
				<BaseClassFilter
					filters={this.props.filters}
					multiSelect
					minimal
					hideAll
					selectedClasses={this.props.value}
					selectionChanged={this.props.onChange}
				/>
			</>
		);
	}

	private filter = memoize((values: string[]): CardFilterFunction | null => {
		if (!values.length) {
			return null;
		}
		return card => values.indexOf(card.cardClass) !== -1;
	}, isEqual);
}
