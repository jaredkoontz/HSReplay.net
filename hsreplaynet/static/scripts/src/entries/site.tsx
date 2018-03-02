import React from "react";
import ReactDOM from "react-dom";
import * as $ from "jquery";
import { cookie } from "cookie_js";
import UserData from "../UserData";
import AccountMenu from "../components/AccountMenu";

const navRoot = document.getElementById("dynamic-nav");
if (navRoot) {
	const renderAccount = selectedAcount => {
		const accounts = UserData.getAccounts();
		const [region, lo] = selectedAcount.split("-");
		const currentAccount = accounts.findIndex(
			account => account.region === +region && account.lo === +lo,
		);

		ReactDOM.render(
			<AccountMenu
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
			/>,
			navRoot,
			() => {
				const placeholder = document.getElementById("account-nav-item");
				if (placeholder) {
					placeholder.remove();
				}
			},
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
