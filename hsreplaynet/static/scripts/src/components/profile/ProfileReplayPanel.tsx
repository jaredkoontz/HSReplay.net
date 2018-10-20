import React from "react";
import { ProfileGameData } from "./ProfileArchetypeList";

interface Props {
	data: ProfileGameData;
}

interface State {}

export default class ProfileReplayPanel extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {};
	}

	public render(): React.ReactNode {
		return <li />;
	}
}
