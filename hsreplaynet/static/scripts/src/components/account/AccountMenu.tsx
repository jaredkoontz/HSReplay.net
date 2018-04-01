import React from "react";
import { Account } from "../../UserData";
import { prettyBlizzardAccount } from "../../utils/account";
import { cookie } from "cookie_js";

interface Props {
	username: string;
	premium: boolean;
	accountUrl: string;
	signoutUrl: string;
	accounts: { [key: string]: Account };
	currentAccount: string | null;
	setCurrentAccount: (key: string) => any;
	className?: string;
}

interface State {
	expanded: boolean;
}

export default class AccountMenu extends React.Component<Props, State> {
	private ref: HTMLElement;
	private linkRef: HTMLAnchorElement;
	private dropdownRef: HTMLElement;
	private form: HTMLFormElement;

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

	private logout = (event: React.MouseEvent<HTMLElement>) => {
		if (!this.form) {
			return;
		}
		event.preventDefault();
		this.form.submit();
	};

	private selectAccount = (key: string) => (
		event: React.MouseEvent<HTMLElement>,
	) => {
		event.preventDefault();
		this.props.setCurrentAccount(key);
	};

	private renderAccounts(): React.ReactNode {
		if (Object.keys(this.props.accounts).length <= 1) {
			return;
		}

		return (
			<>
				<li role="separator" className="divider" />
				<li className="dropdown-header">Hearthstone</li>
				{Object.keys(this.props.accounts).map(key => (
					<li
						key={key}
						className={
							this.props.currentAccount === key
								? "active"
								: undefined
						}
					>
						<a href="#" onClick={this.selectAccount(key)}>
							{prettyBlizzardAccount(this.props.accounts[key])}
						</a>
					</li>
				))}
			</>
		);
	}

	private getDisplayName(): string {
		if (typeof this.props.accounts === "object") {
			const account = this.props.accounts[this.props.currentAccount];
			if (account) {
				return prettyBlizzardAccount(account);
			}
		}

		return this.props.username;
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
					<a href={this.props.accountUrl} id="account-settings">
						Settings
					</a>
				</li>
				<li>
					<a
						href={this.props.signoutUrl}
						id="sign-out"
						onClick={this.logout}
					>
						Sign out
					</a>
					<form
						method="post"
						action={this.props.signoutUrl}
						ref={ref => (this.form = ref)}
					>
						<input
							type="hidden"
							name="csrfmiddlewaretoken"
							value={cookie.get("csrftoken")}
						/>
					</form>
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
					<span>{this.getDisplayName()}</span>{" "}
					<span className="caret" />
				</a>
				{this.renderDropdown()}
			</li>
		);
	}
}
