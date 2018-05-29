import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import Root from "../components/Root";
import RedeemCode from "../pages/RedeemCode";

UserData.create();

const e = document.getElementById("redeem_code-container");

ReactDOM.render(
	<Root>
		<RedeemCode />
	</Root>,
	e,
);
