import React from "react";
import InfoIcon from "./InfoIcon";
import SortIndicator from "./SortIndicator";
import { SortDirection, TableHeaderProps } from "../interfaces";

interface Props extends TableHeaderProps {
	active?: boolean;
	direction?: SortDirection;
	onClick?: (key: string, direction: SortDirection) => void;
	element?: JSX.Element;
}

export default class SortHeader extends React.Component<Props> {
	public render(): React.ReactNode {
		let info = null;
		let { text, element } = this.props;

		if (!element) {
			element = <th />;
		}

		if (this.props.infoHeader || this.props.infoText) {
			info = (
				<InfoIcon
					header={this.props.infoHeader}
					content={this.props.infoText}
				/>
			);
		}
		let sort = null;
		if (
			typeof this.props.sortable === "undefined" ||
			this.props.sortable === true
		) {
			sort = (
				<SortIndicator
					direction={this.props.active ? this.props.direction : null}
				/>
			);
		}
		const classNames = this.props.classNames ? this.props.classNames : [];
		if (sort !== null) {
			classNames.push("sort-header");
		}

		const props = {
			className: classNames.join(" "),
			onClick:
				sort !== null
					? event => {
							if (event && event.currentTarget) {
								event.currentTarget.blur();
							}
							this.props.onClick(
								this.props.sortKey,
								this.getNextDirection()
							);
						}
					: null,
			onKeyPress: event => {
				if (event.which === 13) {
					this.props.onClick(
						this.props.sortKey,
						this.getNextDirection()
					);
				}
			},
			tabIndex: sort !== null ? 0 : null,
			role: "columnheader",
			"aria-sort": this.props.active ? this.props.direction : "none"
		};

		const title = <span aria-hidden={!!this.props.infoHeader}>{text}</span>;

		return React.cloneElement(element, props, title, sort, info);
	}

	getNextDirection(): SortDirection {
		if (!this.props.active) {
			return this.props.defaultSortDirection;
		}
		return this.props.direction === "ascending"
			? "descending"
			: "ascending";
	}
}
