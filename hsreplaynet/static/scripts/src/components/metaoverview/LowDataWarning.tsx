import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	date: Date;
	numArchetypes: number;
}

const MIN_ARCHETYPES_THRESHOLD = 6;
const SEVERE_MIN_ARCHETYPES_THRESHHOLD = 3;
const SEASON_AGE_THRESHOLD = 7;

class LowDataWarning extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;
		if (this.props.numArchetypes >= MIN_ARCHETYPES_THRESHOLD) {
			return null;
		}
		const message =
			this.props.date.getDate() < SEASON_AGE_THRESHOLD
				? t(
						"Too few contributors at this rank(s) at this point in the season for reliable statistics.",
				  )
				: t(
						"Too few contributors at this rank(s) for reliable statistics.",
				  );

		const classNames = ["low-data-warning"];
		const belowThredhold =
			this.props.numArchetypes < SEVERE_MIN_ARCHETYPES_THRESHHOLD;
		if (belowThredhold) {
			classNames.push("severe");
		}
		const glyphicon = belowThredhold ? "warning-sign" : "info-sign";
		return (
			<div className={classNames.join(" ")}>
				<span className={"glyphicon glyphicon-" + glyphicon} />
				<strong>&nbsp;{t("Low Data:")}&nbsp;</strong>
				{message}
			</div>
		);
	}
}

export default translate()(LowDataWarning);
