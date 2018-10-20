import React from "react";
import { ProfileArchetypeData } from "./ProfileArchetypeList";
import CardData from "../../CardData";
import ProfileDeckList from "./ProfileDeckList";

interface Props {
	data: ProfileArchetypeData;
	cardData: CardData;
}

interface State {
	expanded: boolean;
}

export default class ProfileArchetypePanel extends React.Component<
	Props,
	State
> {
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
					<ProfileDeckList
						data={this.props.data.decks}
						cardData={this.props.cardData}
					/>
				) : null}
			</li>
		);
	}
}
