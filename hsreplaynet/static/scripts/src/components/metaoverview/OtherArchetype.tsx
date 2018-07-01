import React from "react";
import { Trans } from "react-i18next";
import Tooltip from "../Tooltip";
import PrettyCardClass from "../text/PrettyCardClass";

interface Props {
	name: string;
	playerClass: string;
}

export default class OtherArchetype extends React.Component<Props> {
	public render(): React.ReactNode {
		const { name, playerClass } = this.props;
		return (
			<Tooltip
				header={name}
				content={
					<p>
						<Trans>
							This is a collection of all
							<PrettyCardClass cardClass={playerClass} />
							decks that do not fit into one of the popular
							archetypes.
						</Trans>

						<br />
						<br />
						<Trans>No archetype details are available.</Trans>
					</p>
				}
			>
				{name}
			</Tooltip>
		);
	}
}
