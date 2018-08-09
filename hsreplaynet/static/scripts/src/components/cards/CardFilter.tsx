import React from "react";
import InfoboxFilter from "../InfoboxFilter";
import { CardData as Card } from "hearthstonejson-client";
import { FilterConsumer } from "./CardFilterGroup";
import { CardFilterConsumer } from "./CardFilterManager";

interface Props {
	value: any;
	filter?: (card: Card, value: any) => boolean;
	enabled?: boolean;
	onChange?: boolean;
}

export default class CardFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<CardFilterConsumer>
				{({ dbfIds, cardData }) => {
					const cards = cardData
						? dbfIds.map(dbfId => cardData.fromDbf(dbfId))
						: [];
					return (
						<FilterConsumer>
							{filter => {
								filter = this.props.filter || filter;
								if (!filter) {
									return (
										<InfoboxFilter value={""}>
											MISSING FILTER DEFINITION
										</InfoboxFilter>
									);
								}
								return (
									<InfoboxFilter value={this.props.value}>
										{this.props.children}
										{cardData && (
											<span className="infobox-value">
												{
													cards.filter(card =>
														filter(
															card,
															this.props.value,
														),
													).length
												}
											</span>
										)}
									</InfoboxFilter>
								);
							}}
						</FilterConsumer>
					);
				}}
			</CardFilterConsumer>
		);
	}
}
