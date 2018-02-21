import React from "react";
import InfoIcon, { InfoIconProps } from "./InfoIcon";

interface Props {
	classNames?: string[];
	collapsed?: boolean;
	collapsible?: boolean;
	deselectable?: boolean;
	header?: string;
	infoHeader?: InfoIconProps["header"];
	infoContent?: InfoIconProps["content"];
	onClick: (value: string, sender: string) => void;
	selectedValue: string | string[];
	disabled?: boolean;
}

interface State {
	collapsed?: boolean;
}

export default class InfoboxFilterGroup extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			collapsed: props.collapsed
		};
	}

	public render(): React.ReactNode {
		const selected = value => {
			if (!this.props.selectedValue || this.props.disabled) {
				return false;
			}
			if (typeof this.props.selectedValue === "string") {
				return this.props.selectedValue === value;
			}
			return this.props.selectedValue.indexOf(value) !== -1;
		};

		const cloneWithProps = child => {
			return React.cloneElement(
				child,
				Object.assign({}, child.props, {
					selected: (value: string) => selected(value),
					onClick:
						typeof child.props.onClick !== "undefined"
							? child.props.onClick
							: this.props.onClick,
					deselectable: this.props.deselectable,
					disabled: this.props.disabled || child.props.disabled
				})
			);
		};

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
				<ul
					className={
						this.props.classNames && this.props.classNames.join(" ")
					}
				>
					{!this.state.collapsed &&
						React.Children.map(this.props.children, cloneWithProps)}
				</ul>
			</div>
		);
	}
}
