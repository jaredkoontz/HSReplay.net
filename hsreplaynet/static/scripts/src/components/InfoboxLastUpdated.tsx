import React from "react";
import { Trans } from "react-i18next";
import HideLoading from "./loading/HideLoading";
import DataInjector from "./DataInjector";
import Tooltip from "./Tooltip";
import SemanticAge from "./text/SemanticAge";
import PropRemapper from "./utils/PropRemapper";

interface Props {
	fetchCondition?: boolean;
	params: any;
	url: string;
	modify?: (data: any) => any;
}

export default class InfoboxLastUpdated extends React.Component<Props> {
	public render(): React.ReactNode {
		const { fetchCondition, modify, params, url } = this.props;
		return (
			<li>
				<Trans>Last updated</Trans>
				<span className="infobox-value">
					<Tooltip
						header="Automatic updates"
						content="This page is periodically updated as new data becomes available."
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
