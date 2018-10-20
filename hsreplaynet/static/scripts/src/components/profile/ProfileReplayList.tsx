import React from "react";
import ProfileReplayPanel from "./ProfileReplayPanel";
import { ProfileGameData } from "./ProfileArchetypeList";

interface Props {
	data: ProfileGameData[];
}

interface State {}

export default class ProfileReplayList extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {};
	}

	public render(): React.ReactNode {
		return (
			<ul>
				{this.props.data.map(game => (
					<ProfileReplayPanel data={game} />
				))}
			</ul>
		);
	}
}
