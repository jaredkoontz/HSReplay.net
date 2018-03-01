import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import ReferralsPromo from "../pages/ReferralsPromo";
import { ReferralEvents } from "../metrics/GoogleAnalytics";
import Root from "../components/Root";

UserData.create();

window.onload = () => {
	const root = document.getElementById("referrals");
	const reflink = root.getAttribute("data-reflink");
	const discount = root.getAttribute("data-discount");
	if (root) {
		ReactDOM.render(
			<Root>
				<ReferralsPromo
					discount={discount}
					url={reflink}
					onCopy={() => ReferralEvents.onCopyRefLink("Premium Page")}
				/>
			</Root>,
			root,
		);
	}
};
