import React from "react";
import PropTypes from "prop-types";
import UserData from "../UserData";
import { image } from "../helpers";

interface Props {
	value: string;
	disabled?: boolean;
	className?: string;
	onClick?: (newValue: string, sender: string) => void;
	id?: string;
}

export default class InfoboxFilter extends React.Component<Props> {
	private ref: HTMLElement | null = null;

	static contextTypes = {
		infoboxFilterDeselectable: PropTypes.bool,
		infoboxFilterDisabled: PropTypes.bool,
		infoboxFilterSelected: PropTypes.arrayOf(PropTypes.string),
		infoboxFilterSelect: PropTypes.func,
		requiresPremium: PropTypes.bool,
	};

	private isPremiumFilter(): boolean {
		const premiumFromContext = this.context.requiresPremium;
		if (typeof premiumFromContext === "undefined") {
			return false;
		}
		return !!premiumFromContext;
	}

	private isSelected(): boolean {
		if (!Array.isArray(this.context.infoboxFilterSelected)) {
			return false;
		}
		return (
			this.context.infoboxFilterSelected.indexOf(this.props.value) !== -1
		);
	}

	private isDisabled(): boolean {
		return this.props.disabled || this.context.infoboxFilterDisabled;
	}

	private isDeselectable(): boolean {
		return this.context.infoboxFilterDeselectable;
	}

	public render(): React.ReactNode {
		const onClick = () => {
			if (this.isPremiumFilter() && !UserData.isPremium()) {
				return;
			}
			if (this.isDisabled()) {
				return;
			}
			if (this.isSelected() && !this.isDeselectable()) {
				return;
			}
			const newValue = this.isSelected() ? null : this.props.value;
			if (typeof this.props.onClick === "function") {
				this.props.onClick(newValue, this.props.value);
			} else if (typeof this.context.infoboxFilterSelect === "function") {
				this.context.infoboxFilterSelect(newValue, this.props.value);
			}
		};

		const classNames = ["selectable"];
		if (this.props.className) {
			classNames.push(this.props.className);
		}
		if (this.isSelected()) {
			classNames.push("selected");
			if (!this.context.infoboxFilterDeselectable) {
				classNames.push("no-deselect");
			}
		}
		if (this.isDisabled()) {
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
					this.isDisabled() ||
					(this.isPremiumFilter() && !UserData.isPremium())
						? -1
						: 0
				}
				role={this.isDeselectable() ? "checkbox" : "radio"}
				aria-disabled={this.isDisabled()}
				aria-checked={this.isSelected()}
				id={this.props.id}
			>
				{this.isPremiumFilter() ? (
					<img
						className="inline-premium-icon"
						src={image("premium.png")}
						role="presentation"
					/>
				) : null}
				{this.props.children}
			</li>
		);
	}
}
