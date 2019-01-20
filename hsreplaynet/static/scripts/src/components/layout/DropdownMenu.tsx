import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	label: React.ReactNode;
	glyphicon?: string;
	id?: string;
	className?: string;
	premium?: boolean;
}

interface State {
	expanded: boolean;
}

class DropdownMenu extends React.Component<Props, State> {
	private ref: HTMLElement | null = null;
	private linkRef: HTMLAnchorElement | null = null;
	private dropdownRef: HTMLElement | null = null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	private clickAnywhere = (e: MouseEvent) => {
		if (!this.state.expanded) {
			return;
		}

		if (this.ref && !this.ref.contains(e.target as any)) {
			this.setState({ expanded: false });
		}
	};

	private close = () => {
		if (!this.state.expanded) {
			return;
		}

		if (this.ref) {
			this.setState({ expanded: false });
		}
	};

	public componentDidMount(): void {
		document.addEventListener("mousedown", this.clickAnywhere);
	}

	public componentWillUnmount(): void {
		document.removeEventListener("mousedown", this.clickAnywhere);
	}

	private toggleDropdown = (event: React.MouseEvent<HTMLElement>) => {
		if (
			this.dropdownRef &&
			this.dropdownRef.contains(event.target as any)
		) {
			return;
		}
		event.preventDefault();
		this.setState(({ expanded, ...state }) => ({
			expanded: !expanded,
			...state,
		}));
	};

	private renderDropdown(): React.ReactNode {
		if (!this.state.expanded) {
			return null;
		}
		let { children } = this.props;
		if (typeof children === "function") {
			children = children({ close: this.close });
		}
		return (
			<ul className="dropdown-menu" ref={ref => (this.dropdownRef = ref)}>
				{children}
			</ul>
		);
	}

	public render(): React.ReactNode {
		const classNames = ["dropdown-toggle"];
		const open = this.state.expanded ? " open" : "";

		if (this.props.premium) {
			classNames.push("text-premium");
		}
		return (
			<li
				className={`${this.props.className || ""}${open}`}
				onClick={this.toggleDropdown}
				ref={ref => (this.ref = ref)}
			>
				<a
					href="#"
					className={classNames.join(" ")}
					role="button"
					aria-haspopup="true"
					aria-expanded={this.state.expanded}
					onClick={e => e.preventDefault()}
					ref={ref => (this.linkRef = ref)}
				>
					{this.props.glyphicon ? (
						<span
							className={`glyphicon glyphicon-${
								this.props.glyphicon
							}`}
						/>
					) : null}
					<span>{this.props.label}</span> <span className="caret" />
				</a>
				{this.renderDropdown()}
			</li>
		);
	}
}

export default translate()(DropdownMenu);
