import React from "react";
import AccountMenu from "./AccountMenu";
import { Consumer as BlizzardAccountConsumer } from "../utils/hearthstone-account";
import UserData from "../../UserData";
import { getAccountKey } from "../../utils/account";
import LoginButton from "./LoginButton";
import DevTools from "./DevTools";

interface Props {
	isAuthenticated: boolean;
	isStaff: boolean;
	hideLogin: boolean;
	isPremium: boolean;
}

export default class AccountNavigation extends React.Component<Props> {
	public render(): React.ReactNode {
		let next = "/";
		if (document && document.location) {
			next = document.location.pathname;
		}

		next = encodeURIComponent(next);

		return (
			<>
				{this.props.isAuthenticated && this.props.isStaff ? (
					<DevTools />
				) : null}

				<li>
					<a
						href="/decks/mine/"
						className="text-premium"
						id="navbar-link-my-decks"
					>
						<span className="glyphicon glyphicon-th-list" />
						<span className="hidden-sm">My Decks</span>
					</a>
				</li>

				<li>
					<a
						href="/cards/mine/"
						className="text-premium"
						id="navbar-link-my-cards"
					>
						<span className="glyphicon glyphicon-stats" />
						<span className="hidden-sm">My Cards</span>
					</a>
				</li>

				<li>
					<a href="/games/mine/" id="navbar-link-my-replays">
						<span className="glyphicon glyphicon-play" />
						<span className="hidden-sm">My Replays</span>
					</a>
				</li>

				{this.props.isAuthenticated ? (
					<BlizzardAccountConsumer>
						{({ key }) => {
							const accountList = UserData.getAccounts();
							const accounts = {};
							for (const account of accountList) {
								accounts[getAccountKey(account)] = account;
							}

							return (
								<AccountMenu
									className={
										this.props.isPremium
											? "text-premium"
											: ""
									}
									username={UserData.getUsername()}
									premium={this.props.isPremium}
									accounts={accounts}
									currentAccount={key}
									setCurrentAccount={newKey => {
										UserData.setDefaultAccount(newKey);
										const event = new CustomEvent(
											"hsreplaynet-select-account",
											{
												detail: {
													account: newKey,
												},
											},
										);
										document.dispatchEvent(event);
									}}
									accountUrl={"/account/"}
									signoutUrl={`/account/logout/?next=${next}`}
								/>
							);
						}}
					</BlizzardAccountConsumer>
				) : (
					!this.props.hideLogin && (
						<li className="button-container">
							<a
								href={`/account/login/?next=${next}`}
								className="btn promo-button"
							>
								Log in or create account
							</a>
						</li>
					)
				)}
			</>
		);
	}
}
