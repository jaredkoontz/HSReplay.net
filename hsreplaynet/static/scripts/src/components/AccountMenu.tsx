import React from "react";
import { Account } from "../UserData";

interface Props {
	username: string;
	premium: boolean;
	accounts: Account[];
	currentAccount: number;
	setCurrentAccount: (index: number) => any;
	className?: string;
}

interface State {
	expanded: boolean;
}

export default class AccountMenu extends React.Component<Props, State> {
	private ref: HTMLElement;
	private linkRef: HTMLAnchorElement;
	private dropdownRef: HTMLElement;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	private clickAnywhere = (e: MouseEvent) => {
		if (!this.state.expanded) {
			// we don't care if we're not expanded
			return;
		}

		if (this.ref && !this.ref.contains(e.target as any)) {
			this.setState({ expanded: false });
		}
	};

	public componentDidMount(): void {
		document.addEventListener("mousedown", this.clickAnywhere);
	}

	public componentWillUnmount(): void {
		document.removeEventListener("mousedown", this.clickAnywhere);
	}

	private closeDropdown() {
		this.setState({ expanded: false });
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

	private selectAccount = (accountIndex: number) => (
		event: React.MouseEvent<HTMLElement>,
	) => {
		event.preventDefault();
		this.props.setCurrentAccount(accountIndex);
	};

	private renderAccounts(): React.ReactNode {
		if (this.props.accounts.length <= 1) {
			return;
		}

		return (
			<>
				<li role="separator" className="divider" />
				<li className="dropdown-header">Hearthstone Account</li>
				{this.props.accounts.map((account, index) => (
					<li
						key={`${account.region}-${account.lo}`}
						className={
							this.props.currentAccount === index
								? "active"
								: undefined
						}
					>
						<a href="#" onClick={this.selectAccount(index)}>
							{account.display}
						</a>
					</li>
				))}
			</>
		);
	}

	private renderDropdown(): React.ReactNode {
		if (!this.state.expanded) {
			return;
		}

		return (
			<ul
				className="dropdown-menu account-dropdown"
				ref={ref => (this.dropdownRef = ref)}
			>
				<li className="dropdown-header">{this.props.username}</li>
				{this.renderAccounts()}
				<li role="separator" className="divider" />
				<li>
					<a href="/account/" id="account-settings">
						Settings
					</a>
				</li>
				<li>
					<a href="/account/logout/" id="sign-out">
						Sign out
					</a>
				</li>
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
					href="/account/"
					className={classNames.join(" ")}
					role="button"
					aria-haspopup="true"
					aria-expanded={this.state.expanded}
					onClick={e => e.preventDefault()}
					ref={ref => (this.linkRef = ref)}
				>
					<span>{this.props.username}</span>{" "}
					<span className="caret" />
				</a>
				{this.renderDropdown()}
			</li>
		);
	}
}
