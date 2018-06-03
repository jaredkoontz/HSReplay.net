import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import Root from "../components/Root";
import AccountBilling from "../pages/AccountBilling";

UserData.create();

const e = document.getElementById("account_billing-container");
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

ReactDOM.render(
	<Root>
		<AccountBilling
			paypal={context["paypal"]}
			stripe={context["stripe"]}
			urls={context["urls"]}
		/>
	</Root>,
	e,
);
