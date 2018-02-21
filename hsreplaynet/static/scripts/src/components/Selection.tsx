import React from "react";

interface Option {
	key: string;
	name: string;
	premium: boolean;
}

interface Props {
	name: string;
	visible: Option[];
	collapsed: Option[];
	default?: string;
	selectionChanged?: (string) => void;
	premiumAvailable?: boolean;
}

interface State {
	selected?: string;
}

export default class Selection extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			selected: this.props.default || this.props.visible[0].key
		};
	}

	public render(): React.ReactNode {
		const visible = [];
		const options = this.getSortedOptions();

		options.visible.forEach(option => {
			const selected = option.key === this.state.selected;
			const className =
				"btn btn-" +
				(selected ? "primary" : "default") +
				this.disabled(option);
			const width = 100 / this.props.visible.length + "%";
			visible.push(
				<button
					data-toggle={selected ? "dropdown" : ""}
					style={{ width: width }}
					type="button"
					className={className}
					onClick={() => this.onClick(option)}
				>
					{option.name}
					{this.premiumGlyph(option)}
				</button>
			);
		});

		let dropDown = null;
		if (options.collapsed) {
			const items = [];
			options.collapsed &&
				options.collapsed.forEach(option => {
					const cursor =
						!this.props.premiumAvailable && option.premium
							? "not-allowed"
							: "pointer";
					items.push(
						<li style={{ padding: 0, cursor: cursor }}>
							<a
								className={
									"btn btn-default" + this.disabled(option)
								}
								href="#"
								style={{
									display: "block",
									padding: "0.5em 1em"
								}}
								onClick={() => this.onClick(option)}
							>
								{option.name}
								{this.premiumGlyph(option)}
							</a>
						</li>
					);
				});
			dropDown = [
				<button
					type="button"
					className="btn btn-default dropdown-toggle"
					data-toggle="dropdown"
				>
					<span className="caret" />
				</button>,
				<ul
					className="dropdown-menu dropdown-menu-right"
					style={{ paddingBottom: 0 }}
				>
					{items}
				</ul>
			];
		}

		return (
			<div className="input-group">
				<div className="input-group-addon" style={{ minWidth: "0px" }}>
					{}
				</div>
				<div style={{ display: "flex" }}>
					{visible}
					{dropDown}
				</div>
			</div>
		);
	}

	getSortedOptions(): { visible: Option[]; collapsed: Option[] } {
		// If a collapsed option is selected:
		// - move option to place of last visible option
		// - move old visible option to top collapsed options
		const visibleOptions = this.props.visible.slice();
		let collapsedOptions = this.props.collapsed.slice();
		const collapsedSelected = this.props.collapsed.find(
			x => x.key == this.state.selected
		);
		if (collapsedSelected) {
			collapsedOptions.unshift(visibleOptions.pop());
			visibleOptions.push(collapsedSelected);
			collapsedOptions = collapsedOptions.filter(
				x => x.key !== collapsedSelected.key
			);
		}
		return { visible: visibleOptions, collapsed: collapsedOptions };
	}

	disabled(option: Option): string {
		return !this.props.premiumAvailable && option.premium
			? " disabled"
			: "";
	}

	onClick(option: Option) {
		if (!option.premium || this.props.premiumAvailable) {
			this.setState({ selected: option.key });
			if (this.props.selectionChanged) {
				this.props.selectionChanged(option.key);
			}
		}
	}

	premiumGlyph(option: Option): JSX.Element {
		if (!this.props.premiumAvailable && option.premium) {
			return (
				<span
					className="glyphicon glyphicon-lock disabled"
					style={{ color: "gray", float: "right", marginTop: "3px" }}
				/>
			);
		}
		return null;
	}
}
