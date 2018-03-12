import React from "react";
import PropTypes from "prop-types";
import InfoIcon, { InfoIconProps } from "./InfoIcon";

interface Props {
	className?: string;
	collapsed?: boolean;
	collapsible?: boolean;
	deselectable?: boolean;
	header?: string;
	infoHeader?: InfoIconProps["header"];
	infoContent?: InfoIconProps["content"];
	onClick: (value: string, sender: string) => any;
	selectedValue: string | string[];
	disabled?: boolean;
}

interface State {
	collapsed: boolean;
}

export default class InfoboxFilterGroup extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			collapsed: props.collapsed,
		};
	}

	static childContextTypes = {
		infoboxFilterDeselectable: PropTypes.bool,
		infoboxFilterDisabled: PropTypes.bool,
		infoboxFilterSelected: PropTypes.arrayOf(PropTypes.string),
		infoboxFilterSelect: PropTypes.func,
	};

	private getSelectedValues(): string[] {
		if (!Array.isArray(this.props.selectedValue)) {
			return [this.props.selectedValue];
		}
		return this.props.selectedValue;
	}

	getChildContext() {
		return {
			infoboxFilterDeselectable: this.props.deselectable,
			infoboxFilterDisabled: this.props.disabled,
			infoboxFilterSelected: this.getSelectedValues(),
			infoboxFilterSelect: this.props.onClick,
		};
	}

	public render(): React.ReactNode {
		let header = null;
		if (this.props.header) {
			let icon = null;
			let infoIcon = null;
			let headerClassName = null;
			const collapsible = this.props.collapsed || this.props.collapsible;
			if (collapsible) {
				headerClassName = "collapsible";
				if (this.state.collapsed) {
					icon = <span className="glyphicon glyphicon-menu-down" />;
				} else {
					icon = <span className="glyphicon glyphicon-menu-up" />;
				}
			}
			const toggle = () =>
				this.setState({ collapsed: !this.state.collapsed });
			if (this.props.infoHeader || this.props.infoContent) {
				infoIcon = (
					<InfoIcon
						className="pull-right"
						header={this.props.infoHeader}
						content={this.props.infoContent}
					/>
				);
			}
			header = (
				<h2
					className={headerClassName}
					onClick={event => {
						if (!collapsible) {
							return;
						}

						if (event && event.currentTarget) {
							event.currentTarget.blur();
						}

						toggle();
					}}
					onKeyDown={event => {
						if (!collapsible) {
							return;
						}

						if (event.which !== 13) {
							return;
						}

						toggle();
					}}
					tabIndex={collapsible ? 0 : -1}
				>
					{icon}
					{this.props.header}
					{infoIcon}
				</h2>
			);
		}

		return (
			<div className="infobox-filter-group">
				{header}
				<ul className={this.props.className}>
					{!this.state.collapsed && this.props.children}
				</ul>
			</div>
		);
	}
}
