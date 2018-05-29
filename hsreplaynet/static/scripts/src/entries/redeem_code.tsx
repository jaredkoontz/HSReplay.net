import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import Root from "../components/Root";
import RedeemCode from "../pages/RedeemCode";

UserData.create();
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

ReactDOM.render(
	<Root>
		<RedeemCode code={context["code"]} />
	</Root>,
	document.getElementById("redeem_code-container"),
);
