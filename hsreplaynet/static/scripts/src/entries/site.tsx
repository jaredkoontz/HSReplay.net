import React from "react";
import ReactDOM from "react-dom";
import $ from "jquery";
import { cookie } from "cookie_js";
import UserData from "../UserData";
import Modal from "../components/Modal";
import CollectionSetup from "../components/collection/CollectionSetup";
import { Provider as BlizzardAccountProvider } from "../components/utils/hearthstone-account";
import AccountNavigation from "../components/account/AccountNavigation";
import PremiumModal from "../components/premium/PremiumModal";
import i18n from "../i18n";
import I18nextProvider from "react-i18next/src/I18nextProvider";

UserData.create();

function renderNavbar() {
	const userNav = document.getElementById("user-nav");
	if (userNav) {
		const hideLogin = !!+userNav.getAttribute("data-hide-login");
		ReactDOM.render(
			<I18nextProvider i18n={i18n} initialLanguage={UserData.getLocale()}>
				<BlizzardAccountProvider>
					<AccountNavigation
						isAuthenticated={UserData.isAuthenticated()}
						isStaff={UserData.isStaff()}
						hideLogin={hideLogin}
						isPremium={UserData.isPremium()}
					/>
				</BlizzardAccountProvider>
			</I18nextProvider>,
			userNav,
		);
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", renderNavbar);
} else {
	renderNavbar();
}

if (document && document.location && document.location.search) {
	const search = document.location.search.replace(/^\?/, "");
	const parts = search.split("&");
	for (const part of parts) {
		let param = part.split("=", 2);
		if (param[0] === "premium-modal") {
			// url compat
			param = ["modal", "premium"];
		}
		if (param.length !== 2) {
			continue;
		}
		const [key, value] = param;
		if (key === "modal") {
			const modalDummy = document.createElement("div");
			modalDummy.setAttribute("id", "initial-modal-dummy");
			switch (value) {
				case "collection":
					ReactDOM.render(
						<BlizzardAccountProvider>
							<Modal
								visible
								onClose={() => {
									ReactDOM.unmountComponentAtNode(modalDummy);
								}}
							>
								<CollectionSetup />
							</Modal>
						</BlizzardAccountProvider>,
						modalDummy,
					);
				case "premium":
					ReactDOM.render(
						<Modal
							visible
							onClose={() => {
								ReactDOM.unmountComponentAtNode(modalDummy);
							}}
						>
							<PremiumModal analyticsLabel={"URL Parameter"} />
						</Modal>,
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

		$(premiumLink).popover({
			animation: true,
			trigger: "manual",
			placement: "bottom",
			html: true,
			title:
				'Refer a Friend! <a href="#" id="referral-popover-close" class="popover-close" aria-hidden="true">&times;</a>',
			content:
				"Tell a friend about HSReplay.net for a cheaper Premium subscription!",
		});
		$(premiumLink).on("shown.bs.popover", () => {
			$("#referral-popover-close").click(evt => {
				evt.preventDefault();
				$(premiumLink).popover("destroy");
				cookie.set("refer-popup-closed", "1", {
					path: "/",
					expires: 90,
				});
			});
		});
		setTimeout(() => ($(premiumLink) as any).popover("show"), 500);
	});
}
