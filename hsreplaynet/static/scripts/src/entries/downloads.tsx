import React from "react";
import ReactDOM from "react-dom";
import Root from "../components/Root";
import Downloads from "../pages/Downloads";

const e = document.getElementById("downloads-container");
const context = JSON.parse(
	document.getElementById("react_context").textContent,
);

ReactDOM.render(
	<Root>
		<Downloads
			hdtDownloadUrl={context["hdt_download_url"]}
			hstrackerDownloadUrl={context["hstracker_download_url"]}
		/>
	</Root>,
	e,
);
