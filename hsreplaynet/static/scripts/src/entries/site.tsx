import React from "react";
import ReactDOM from "react-dom";
import * as $ from "jquery";
import { cookie } from "cookie_js";
import UserData from "../UserData";
import AccountMenu from "../components/account/AccountMenu";
import Modal from "../components/Modal";
import CollectionSetup from "../components/collection/CollectionSetup";
import { Provider as BlizzardAccountProvider } from "../components/utils/hearthstone-account";

const navRoot = document.getElementById("dynamic-nav");
const placeholder = document.getElementById("account-nav-item");
if (navRoot && placeholder) {
	const placeholderClassName: string = placeholder
		? placeholder.className
		: "";
	const renderAccount = selectedAcount => {
		const accounts = UserData.getAccounts();
		let currentAccount = null;
		if (selectedAcount) {
			const [region, lo] = selectedAcount.split("-");
			currentAccount = accounts.findIndex(
				account => account.region === +region && account.lo === +lo,
			);
			if (currentAccount === -1) {
				currentAccount = null;
			}
		}

		ReactDOM.render(
			<AccountMenu
				className={placeholderClassName}
				username={UserData.getUsername()}
				premium={UserData.isPremium()}
				accounts={accounts}
				currentAccount={currentAccount}
				setCurrentAccount={accountIndex => {
					const account = accounts[accountIndex];
					const event = new CustomEvent(
						"hsreplaynet-select-account",
						{
							detail: {
								account: `${account.region}-${account.lo}`,
							},
						},
					);
					document.dispatchEvent(event);
				}}
				accountUrl={navRoot.getAttribute("data-account-url")}
				signoutUrl={navRoot.getAttribute("data-signout-url")}
			/>,
			navRoot,
		);
	};

	document.addEventListener(
		"hsreplaynet-select-account",
		(event: CustomEvent) => {
			const account = event.detail.account;
			if (!account) {
				return;
			}
			renderAccount(account);
			UserData.setDefaultAccount(account);
		},
	);

	renderAccount(UserData.getDefaultAccountKey());
}

if (document && document.location && document.location.search) {
	const search = document.location.search.replace(/^\?/, "");
	const parts = search.split("&");
	for (const part of parts) {
		const param = part.split("=", 2);
		if (param.length !== 2) {
			continue;
		}
		const [key, value] = param;
		if (key === "modal") {
			switch (value) {
				case "collection":
					const modalDummy = document.createElement("div");
					modalDummy.setAttribute("id", "initial-modal-dummy");
					ReactDOM.render(
						<BlizzardAccountProvider>
							<Modal
								onClose={() => {
									ReactDOM.unmountComponentAtNode(modalDummy);
								}}
							>
								<CollectionSetup />
							</Modal>
							) : null}
						</BlizzardAccountProvider>,
						modalDummy,
					);
			}
			break;
		}
	}
}

if (
	window &&
	window.location &&
	window.location.pathname.match(/\/(replay|games|decks|cards)\//)
) {
	UserData.create();
	document.addEventListener("DOMContentLoaded", () => {
		// locate the premium navbar item
		const premiumLink = document.getElementById("navbar-link-premium");
		if (!premiumLink) {
			return;
		}

		// do not show if feature is disabled
		if (!UserData.hasFeature("reflinks")) {
			return;
		}

		// do not show when logged out
		if (!UserData.isAuthenticated()) {
			return;
		}

		// do not show if hidden
		if (cookie.get("refer-popup-closed", "0") !== "0") {
			return;
		}

		($(premiumLink) as any).popover({
			animation: true,
			trigger: "manual",
			placement: "bottom",
			html: true,
			title:
				'Refer a Friend! <a href="#" id="referral-popover-close" class="popover-close" aria-hidden="true">&times;</a>',
			content:
				"Tell a friend about HSReplay.net for a cheaper Premium subscription!",
		});
		($(premiumLink) as any).on("shown.bs.popover", () => {
			$("#referral-popover-close").click(evt => {
				evt.preventDefault();
				($(premiumLink) as any).popover("destroy");
				cookie.set("refer-popup-closed", "1", {
					path: "/",
					expires: 90,
				});
			});
		});
		setTimeout(() => ($(premiumLink) as any).popover("show"), 500);
	});
}
