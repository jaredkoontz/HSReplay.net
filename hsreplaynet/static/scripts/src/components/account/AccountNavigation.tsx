import { cookie } from "cookie_js";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import UserData from "../../UserData";
import { getAccountKey } from "../../utils/account";
import { Consumer as BlizzardAccountConsumer } from "../utils/hearthstone-account";
import AccountMenu from "./AccountMenu";
import DevTools from "./DevTools";
import LanguageSelector from "./LanguageSelector";
import PremiumModal, { ModalStyle } from "../premium/PremiumModal";
import Modal from "../Modal";
import DropdownMenu from "../layout/DropdownMenu";

interface Props extends InjectedTranslateProps {
	isAuthenticated: boolean;
	isStaff: boolean;
	hideLogin: boolean;
	isPremium: boolean;
}

interface State {
	activePremiumModal: ModalStyle | null;
}

class AccountNavigation extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			activePremiumModal: null,
		};
	}

	private getClassName(path: string | RegExp, premium?: boolean): string {
		if (!document || !document.location || !document.location.pathname) {
			return "";
		}
		const pathname = document.location.pathname;
		if (path instanceof RegExp) {
			if (path.exec(pathname) === null) {
				return "";
			}
		} else if (path !== pathname) {
			return "";
		}
		let className = "active";
		if (premium) {
			className += " active-premium";
		}
		return className;
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		let next = "/";
		if (document && document.location) {
			next = document.location.pathname;
		}

		next = encodeURIComponent(next);

		return (
			<>
				{this.props.isPremium ? null : (
					<Modal
						visible={this.state.activePremiumModal !== null}
						onClose={() =>
							this.setState({ activePremiumModal: null })
						}
					>
						<PremiumModal
							modalStyle={this.state.activePremiumModal}
						/>
					</Modal>
				)}
				{(this.props.isAuthenticated ||
					!!cookie.get("logged-out-mode", 0)) &&
				this.props.isStaff ? (
					<DevTools />
				) : null}

				<LanguageSelector next={next} />

				<DropdownMenu
					className=""
					label={t("My Data")}
					glyphicon="stats"
				>
					{({ close: closeDropdown }) => (
						<>
							<li
								className={this.getClassName(
									"/decks/mine/",
									true,
								)}
							>
								<a
									href="/decks/mine/"
									className={"text-premium"}
									id="navbar-link-my-decks"
									onClick={e => {
										if (!this.props.isPremium) {
											e.preventDefault();
											closeDropdown();
											this.setState({
												activePremiumModal: "MyDecks",
											});
										}
									}}
								>
									<span className="glyphicon glyphicon-th-list" />
									{t("My Decks")}
								</a>
							</li>
							<li
								className={this.getClassName(
									"/cards/mine/",
									true,
								)}
							>
								<a
									href="/cards/mine/"
									className="text-premium"
									id="navbar-link-my-cards"
									onClick={e => {
										if (!this.props.isPremium) {
											e.preventDefault();
											closeDropdown();
											this.setState({
												activePremiumModal: "MyCards",
											});
										}
									}}
								>
									<span className="glyphicon glyphicon-stats" />
									{t("My Cards")}
								</a>
							</li>
							<li
								className={this.getClassName(
									"/collection/mine/",
									true,
								)}
							>
								<a
									href="/collection/mine/"
									id="navbar-link-my-cards"
								>
									<span className="glyphicon glyphicon-th-large" />
									{t("My Collection")}
								</a>
							</li>
							<li className={this.getClassName("/games/mine/")}>
								<a
									href="/games/mine/"
									id="navbar-link-my-replays"
								>
									<span className="glyphicon glyphicon-play" />
									{t("My Replays")}
								</a>
							</li>
						</>
					)}
				</DropdownMenu>

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
										(this.props.isPremium
											? "text-premium"
											: "") +
										" " +
										this.getClassName(
											/^\/account\//,
											this.props.isPremium,
										)
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
								{t("Sign in")}
							</a>
						</li>
					)
				)}
			</>
		);
	}
}

export default translate()(AccountNavigation);
