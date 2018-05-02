import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardData from "../CardData";
import CardIcon from "../components/CardIcon";

interface PackCard {
	card: string;
	premium: boolean;
}

interface Pack {
	id: number;
	booster_type: number;
	date: string;
	account_hi: number;
	account_lo: number;
	cards: PackCard[];
}

interface Props extends InjectedTranslateProps {
	packs: Pack[];
	cardData: CardData;
}
interface State {
	packs: any;
}

class MyPacks extends React.Component<Props, State> {
	public render(): React.ReactNode {
		const mypacks = [];
		const { t } = this.props;

		if (this.props.packs) {
			for (const pack of this.props.packs) {
				const packCards = [];
				for (const packCard of pack.cards) {
					packCards.push(
						<li>
							<CardIcon
								card={this.props.cardData.fromCardId(
									packCard.card,
								)}
								markStyle={{
									color: "#f4d442",
									fontSize: "1em",
									right: 0,
									top: 0,
								}}
								mark={packCard.premium ? "★" : ""}
							/>
						</li>,
					);
				}
				const e = (
					<>
						<div>
							<time>{pack.date}</time> - {pack.booster_type}
						</div>
						<div className="deck-tile">
							<ul className="card-list">{packCards}</ul>
						</div>
					</>
				);
				mypacks.push(e);
			}
		}

		return (
			<div>
				<h1>{t("My Packs")}</h1>

				<div className="alert alert-info">
					{t(
						"These are the packs you uploaded. This section is a work in progress.",
					)}
				</div>
				{mypacks}
			</div>
		);
	}
}

export default translate()(MyPacks);
