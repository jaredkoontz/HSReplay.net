import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import ReferralsPromo from "../pages/ReferralsPromo";

UserData.create();

window.onload = function() {
	const root = document.getElementById("referrals");
	const reflink = root.getAttribute("data-reflink");
	const discount = root.getAttribute("data-discount");
	if (root) {
		ReactDOM.render(
			<ReferralsPromo discount={discount} url={reflink} />,
			root
		);
	}
};
