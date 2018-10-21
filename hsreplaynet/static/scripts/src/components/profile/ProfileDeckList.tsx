import React from "react";
import ProfileDeckPanel from "./ProfileDeckPanel";
import { ProfileDeckData } from "./ProfileArchetypeList";
import CardData from "../../CardData";

interface Props {
	data: ProfileDeckData[];
	cardData: CardData;
}

interface State {}

export default class ProfileDeckList extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {};
	}

	public render(): React.ReactNode {
		return (
			<ul className="col-lg-12">
				{this.props.data.map(deckData => (
					<ProfileDeckPanel
						data={deckData}
						cardData={this.props.cardData}
					/>
				))}
			</ul>
		);
	}
}
