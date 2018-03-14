import React from "react";
import PropTypes from "prop-types";
import { Account } from "../../UserData";
import UserData from "../../UserData";

interface Props {}

interface State {
	account: string;
}

export class Provider extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			account: UserData.getDefaultAccountKey(),
		};
	}

	static childContextTypes = {
		hearthstoneAccount: PropTypes.string,
	};

	getChildContext() {
		return { hearthstoneAccount: this.state.account };
	}

	private setAccount = (event: CustomEvent<{ account: string }>) => {
		this.setState({ account: event.detail.account });
	};

	public componentDidMount(): void {
		document.addEventListener(
			"hsreplaynet-select-account",
			this.setAccount,
		);
	}

	public componentWillUnmount(): void {
		document.removeEventListener(
			"hsreplaynet-select-account",
			this.setAccount,
		);
	}

	public render(): React.ReactNode {
		return this.props.children;
	}
}

export class Consumer extends React.Component {
	static contextTypes = {
		hearthstoneAccount: PropTypes.string,
	};

	private getAccount(accountId: string): Account | null {
		if (!accountId || !UserData.isAuthenticated()) {
			return null;
		}
		const accounts = UserData.getAccounts();
		if (!accounts.length) {
			return null;
		}
		const [region, accountLo] = accountId.split("-");
		return (
			accounts.find(
				(account: Account) =>
					+account.region === +region && +account.lo === +accountLo,
			) || null
		);
	}

	public render(): React.ReactNode {
		if (typeof this.props.children !== "function") {
			throw new Error(
				"hearthstone-account provider expected render prop as children",
			);
		}
		const renderProp = this.props.children as (
			account: Account | null,
		) => React.ReactNode;
		return renderProp(
			this.getAccount(this.context.hearthstoneAccount || null),
		);
	}
}
