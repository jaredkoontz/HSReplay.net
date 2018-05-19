import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import ReferralsPromo from "../pages/ReferralsPromo";
import { ReferralEvents } from "../metrics/GoogleAnalytics";
import Root from "../components/Root";
import PremiumCheckout from "../components/premium/PremiumCheckout";

UserData.create();

window.onload = () => {
	const referralRoot = document.getElementById("referrals");
	const reflink = referralRoot.getAttribute("data-reflink");
	const discount = referralRoot.getAttribute("data-discount");
	if (referralRoot) {
		ReactDOM.render(
			<Root>
				<ReferralsPromo
					discount={discount}
					url={reflink}
					onCopy={() => ReferralEvents.onCopyRefLink("Premium Page")}
				/>
			</Root>,
			referralRoot,
		);
	}

	const checkoutRoot = document.getElementById("premium-detail-checkout");
	if (checkoutRoot) {
		ReactDOM.render(
			<Root>
				<PremiumCheckout analyticsLabel={"Premium Detail"} preselect />
			</Root>,
			checkoutRoot,
		);
	}
};
