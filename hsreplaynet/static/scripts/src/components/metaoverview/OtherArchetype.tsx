import React from "react";
import { Trans, WithTranslation, withTranslation } from "react-i18next";
import PrettyCardClass from "../text/PrettyCardClass";
import Tooltip from "../Tooltip";

interface Props extends WithTranslation {
	name: string;
	playerClass: string;
}

class OtherArchetype extends React.Component<Props> {
	public render(): React.ReactNode {
		const { name, playerClass, t } = this.props;
		return (
			<Tooltip
				header={name}
				content={
					<p>
						<Trans>
							This is a collection of all{" "}
							<PrettyCardClass cardClass={playerClass} /> decks
							that do not fit into one of the popular archetypes.
						</Trans>

						<br />
						<br />
						{t("No archetype details are available.")}
					</p>
				}
			>
				{name}
			</Tooltip>
		);
	}
}

export default withTranslation()(OtherArchetype);
