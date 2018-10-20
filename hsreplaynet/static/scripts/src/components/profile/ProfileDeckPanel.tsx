import React from "react";
import { ProfileDeckData } from "./ProfileArchetypeList";
import CardData from "../../CardData";
import ProfileReplayList from "./ProfileReplayList";

interface Props {
	data: ProfileDeckData;
	cardData: CardData;
}

interface State {
	expanded: boolean;
}

export default class ProfileDeckPanel extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			expanded: false,
		};
	}

	public render(): React.ReactNode {
		return (
			<li>
				{/*columns*/}
				{this.state.expanded ? (
					<ProfileReplayList data={this.props.data.games} />
				) : null}
			</li>
		);
	}
}
