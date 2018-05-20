import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import DataInjector from "./DataInjector";
import Tooltip from "./Tooltip";
import HideLoading from "./loading/HideLoading";
import SemanticAge from "./text/SemanticAge";
import PropRemapper from "./utils/PropRemapper";

interface Props extends InjectedTranslateProps {
	fetchCondition?: boolean;
	params: any;
	url: string;
	modify?: (data: any) => any;
}

class InfoboxLastUpdated extends React.Component<Props> {
	public render(): React.ReactNode {
		const { fetchCondition, modify, params, t, url } = this.props;
		return (
			<li>
				<Trans>Last updated</Trans>
				<span className="infobox-value">
					<Tooltip
						header={t("Automatic updates")}
						content={t(
							"This page is periodically updated as new data becomes available.",
						)}
					>
						<DataInjector
							fetchCondition={fetchCondition}
							query={{ url, params }}
							modify={data =>
								modify
									? modify(data)
									: data && data.as_of
										? new Date(data.as_of)
										: null
							}
						>
							<HideLoading>
								<PropRemapper map={{ data: "date" }}>
									<SemanticAge />
								</PropRemapper>
							</HideLoading>
						</DataInjector>
					</Tooltip>
				</span>
			</li>
		);
	}
}

export default translate()(InfoboxLastUpdated);
