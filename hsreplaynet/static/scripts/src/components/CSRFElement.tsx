import React from "react";
import { getCookie } from "../helpers";

export default class CSRFElement extends React.Component {
	render(): React.ReactNode {
		const csrfToken = getCookie("csrftoken");
		return (
			<input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
		);
	}
}
