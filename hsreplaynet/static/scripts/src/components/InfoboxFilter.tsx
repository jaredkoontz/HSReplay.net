import React from "react";
import * as PropTypes from "prop-types";
import UserData from "../UserData";

interface InfoboxFilterProps extends React.ClassAttributes<InfoboxFilter> {
	classNames?: string[];
	deselectable?: string;
	disabled?: boolean;
	onClick?: (newValue: string, sender: string) => void;
	selected?: boolean | ((value: string) => boolean);
	overridePremium?: boolean;
	value: string;
}

export default class InfoboxFilter extends React.Component<InfoboxFilterProps> {
	private ref;

	static contextTypes = {
		requiresPremium: PropTypes.bool
	};

	private isPremiumFilter(): boolean {
		const premiumOverride = this.props.overridePremium;
		if (typeof premiumOverride !== "undefined") {
			return !!premiumOverride;
		}
		const premiumFromContext = this.context.requiresPremium;
		if (typeof premiumFromContext === "undefined") {
			return false;
		}
		return !!premiumFromContext;
	}

	private isSelected(): boolean {
		if (typeof this.props.selected === "function") {
			return this.props.selected(this.props.value);
		}
		return this.props.selected;
	}

	render(): JSX.Element {
		const onClick = () => {
			if (this.isPremiumFilter() && !UserData.isPremium()) {
				return;
			}
			if (this.props.disabled) {
				return;
			}
			if (this.isSelected() && !this.props.deselectable) {
				return;
			}
			const newValue = this.isSelected() ? null : this.props.value;
			if (typeof this.props.onClick === "function") {
				this.props.onClick(newValue, this.props.value);
			}
		};

		const classNames = ["selectable"];
		if (this.props.classNames) {
			classNames.push(this.props.classNames.join(" "));
		}
		if (this.isSelected()) {
			classNames.push("selected");
			if (!this.props.deselectable) {
				classNames.push("no-deselect");
			}
		}
		if (this.props.disabled) {
			classNames.push("disabled");
		}

		if (this.isPremiumFilter()) {
			classNames.push("text-premium");
		}

		return (
			<li
				className={classNames.join(" ")}
				onClick={() => {
					onClick();
					if (this.ref) {
						this.ref.blur();
					}
				}}
				ref={ref => (this.ref = ref)}
				onKeyDown={event => {
					if (event.which !== 13) {
						return;
					}
					onClick();
				}}
				tabIndex={
					this.props.disabled ||
					(this.isPremiumFilter() && !UserData.isPremium())
						? -1
						: 0
				}
				role={this.props.deselectable ? "checkbox" : "radio"}
				aria-disabled={this.props.disabled}
				aria-checked={this.isSelected()}
			>
				{this.isPremiumFilter() ? (
					<img
						className="inline-premium-icon"
						src={STATIC_URL + "images/premium.png"}
						role="presentation"
					/>
				) : null}
				{this.props.children}
			</li>
		);
	}
}
