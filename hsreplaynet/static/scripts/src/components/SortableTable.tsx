import React from "react";
import SortHeader from "./SortHeader";
import { SortDirection, TableHeaderProps } from "../interfaces";

interface Props {
	sortBy: string;
	sortDirection: SortDirection;
	onSortChanged?: (sortBy: string, sortDirection: SortDirection) => void;
	headers: TableHeaderProps[];
}

export default class SortableTable extends React.Component<Props> {
	public render(): React.ReactNode {
		const headers = this.props.headers.map(header => (
			<SortHeader
				active={this.props.sortBy === header.sortKey}
				direction={this.props.sortDirection}
				onClick={(key, direction) =>
					this.props.onSortChanged(key, direction)
				}
				key={header.sortKey}
				{...header}
			/>
		));

		return (
			<table className="table table-striped table-hover table-sortable">
				<thead>
					<tr>{headers}</tr>
				</thead>
				<tbody>{this.props.children}</tbody>
			</table>
		);
	}
}
