import React from "react";
import { getCookie } from "../helpers";

interface Props {}

export default class CSRFElement extends React.Component<Props> {
	render(): React.ReactNode {
		const csrfToken = getCookie("csrftoken");
		return (
			<input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
		);
	}
}
