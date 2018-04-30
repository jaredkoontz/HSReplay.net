import React from "react";
import _ from "lodash";
import { SelectableProps } from "../interfaces";

interface Props extends SelectableProps {
	distributions: NumberDistribution;
	title?: string;
	value?: string;
}

interface NumberDistribution {
	[key: string]: number;
}

export default class Distribution extends React.Component<Props> {
	public render(): React.ReactNode {
		let count = 0;

		const elements = _.map(
			this.props.distributions,
			(value: number, key: string) => {
				return [key, value];
			},
		);

		const distributions = _.sortBy(elements, (tuple: any[]) => {
			const value = tuple[1];
			return 1 - value;
		});

		const rows = _.map(distributions, (tuple: any[]) => {
			const key = tuple[0];
			const value = tuple[1];

			const classNames = [];
			if (this.props.onSelect) {
				classNames.push("selectable");
			}
			if (key === this.props.select) {
				classNames.push("active");
			}

			return (
				<tr
					key={count}
					className={classNames.join(" ")}
					onClick={() => {
						if (!this.props.onSelect) {
							return;
						}
						this.props.onSelect(key);
					}}
				>
					<th>{++count}</th>
					<th>{key}</th>
					<td>{(value * 100).toFixed(2)}%</td>
				</tr>
			);
		});

		return (
			<table className="table table-condensed component-distribution">
				<thead>
					<tr>
						<th>#</th>
						<th>{this.props.title || "Title"}</th>
						<th>{this.props.value || "Value"}</th>
					</tr>
				</thead>
				<tbody>{rows}</tbody>
			</table>
		);
	}
}
