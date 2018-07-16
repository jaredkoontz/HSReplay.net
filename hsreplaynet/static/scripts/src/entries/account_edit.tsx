import React from "react";
import ReactDOM from "react-dom";
import Root from "../components/Root";
import { Visibility } from "../interfaces";
import AccountEdit from "../pages/AccountEdit";
import UserData from "../UserData";

UserData.create();
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

ReactDOM.render(
	<Root>
		<AccountEdit
			reflink={context["reflink"]}
			hits={context["hits"]}
			collectionVisibility={context["collection_visibility"]}
			defaultReplayVisibility={
				+context["default_replay_visibility"] as Visibility
			}
			excludeFromStatistics={context["exclude_from_statistics"]}
			joustAutoplay={context["joust_autoplay"]}
		/>
	</Root>,
	document.getElementById("account_edit-container"),
);
