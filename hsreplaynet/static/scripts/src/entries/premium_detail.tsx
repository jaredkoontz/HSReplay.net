import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import Root from "../components/Root";
import PremiumDetail from "../pages/PremiumDetail";

UserData.create();
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);
const paymentData = JSON.parse(
	document.getElementById("payment-details-data").textContent,
);

window.onload = () => {
	const referralRoot = document.getElementById("premium_detail-container");
	if (referralRoot) {
		ReactDOM.render(
			<Root>
				<PremiumDetail
					discount={context["discount"]}
					reflink={context["reflink"]}
					randomQuote={context["random_quote"]}
					featuredCard={context["featured_card"]}
					featuredDeck={context["featured_deck"]}
					premiumPrice={
						paymentData["stripe"]["plans"][0]["description"]
					}
					hasSubscriptionPastDue={
						paymentData["stripe"]["has_subscription_past_due"]
					}
				/>
			</Root>,
			referralRoot,
		);
	}
};
