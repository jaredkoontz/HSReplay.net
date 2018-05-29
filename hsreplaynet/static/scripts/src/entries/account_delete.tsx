import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import Root from "../components/Root";
import AccountDelete from "../pages/AccountDelete";

UserData.create();

ReactDOM.render(
	<Root>
		<AccountDelete />
	</Root>,
	document.getElementById("account_delete-container"),
);
