/* tslint:disable:max-classes-per-file */
import React from "react";
import PropTypes from "prop-types";
import { Account } from "../../UserData";
import UserData from "../../UserData";

interface Props {}

interface State {
	account: string;
}

interface Value {
	key: string | null;
	account: Account | null;
}

export class Provider extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
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
			value: Value,
		) => React.ReactNode;
		const key = this.context.hearthstoneAccount || null;
		return renderProp({
			key,
			account: this.getAccount(key),
		});
	}
}
