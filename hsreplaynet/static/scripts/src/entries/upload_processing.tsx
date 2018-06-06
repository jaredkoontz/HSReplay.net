import React from "react";
import ReactDOM from "react-dom";
import UserData from "../UserData";
import Root from "../components/Root";
import UploadProcessing from "../pages/UploadProcessing";

UserData.create();
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

ReactDOM.render(
	<Root>
		<UploadProcessing
			adminUrl={context["admin_url"]}
			error={context["error"]}
			isProcessing={context["is_processing"]}
			status={context["status"]}
		/>
	</Root>,
	document.getElementById("upload_processing-container"),
);
