import React from "react";
import ReactDOM from "react-dom";
import Root from "../components/Root";
import Downloads from "../pages/Downloads";

const e = document.getElementById("downloads-container");

ReactDOM.render(
	<Root>
		<Downloads />
	</Root>,
	e,
);
