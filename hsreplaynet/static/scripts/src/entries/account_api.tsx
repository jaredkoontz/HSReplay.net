import React from "react";
import ReactDOM from "react-dom";
import Root from "../components/Root";
import AccountApi from "../pages/AccountApi";
import UserData from "../UserData";

UserData.create();

const e = document.getElementById("account_api-container");
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

ReactDOM.render(
	<Root>
		<AccountApi
			accessTokens={context["access_tokens"]}
			applications={context["applications"]}
			urls={context["urls"]}
		/>
	</Root>,
	e,
);
