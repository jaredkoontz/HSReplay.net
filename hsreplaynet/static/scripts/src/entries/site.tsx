import React from "react";
import ReactDOM from "react-dom";
import * as $ from "jquery";
import { cookie } from "cookie_js";
import UserData from "../UserData";
import Modal from "../components/Modal";
import CollectionSetup from "../components/collection/CollectionSetup";
import { Provider as BlizzardAccountProvider } from "../components/utils/hearthstone-account";
import AccountNavigation from "../components/account/AccountNavigation";

UserData.create();

function renderNavbar() {
	const userNav = document.getElementById("user-nav");
	if (userNav) {
		const hideLogin = !!+userNav.getAttribute("data-hide-login");
		ReactDOM.render(
			<BlizzardAccountProvider>
				<AccountNavigation
					isAuthenticated={UserData.isAuthenticated()}
					isStaff={UserData.isStaff()}
					hideLogin={hideLogin}
					isPremium={UserData.isPremium()}
				/>
			</BlizzardAccountProvider>,
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
