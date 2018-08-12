import React, { ChangeEvent } from "react";
import { CardData as Card } from "hearthstonejson-client";
import { InjectedTranslateProps, translate } from "react-i18next";
import CardFilter from "../CardFilter";
import { CardFilterFunction } from "../CardFilterManager";
import { cleanText, slangToCardId } from "../../../helpers";
import memoize from "memoize-one";

interface Props extends InjectedTranslateProps {
	value: string;
	onChange: (value: string) => void;
	autofocus?: boolean;
}

class TextFilter extends React.Component<Props> {
	public render(): React.ReactNode {
		const { t } = this.props;

		const clearButton =
			this.props.value !== "" ? (
				<span
					className="glyphicon glyphicon-remove form-control-feedback"
					onClick={this.onClear}
				/>
			) : null;

		return (
			<>
				<CardFilter filter={this.filter(this.props.value)} />
				<div className="search-wrapper">
					<div className="form-group has-feedback">
						<input
							type="text"
							value={this.props.value}
							onChange={this.onChange}
							autoFocus={this.props.autofocus}
							placeholder={t("Search: Fireball, Magma Rager…")}
							className="form-control"
						/>
						<span className="glyphicon glyphicon-search form-control-feedback" />
						{clearButton}
					</div>
				</div>
			</>
		);
	}

	private onClear = () => {
		this.props.onChange("");
	};

	private onChange = (e: ChangeEvent<HTMLInputElement>) => {
		const target = e.target;
		if (!target) {
			return;
		}
		this.props.onChange(target.value);
	};

	private filter = memoize((value: string): CardFilterFunction | null => {
		if (!value) {
			return null;
		}
		const parts = value
			.split(",")
			.map(x => {
				x = x.trim();
				const isSearch = x.length > 0 ? x[0] === "^" : false;
				x = cleanText(x);
				return isSearch ? `^${x}` : x;
			})
			.filter(x => !!x);

		let slangs = parts.map(slangToCardId).filter(x => !!x);
		if (!slangs.length) {
			slangs = null;
		}

		return (card: Card): boolean => {
			const cardName = card.name ? cleanText(card.name) : null;
			const cardText = card.text ? cleanText(card.text) : null;
			return (
				parts.some(part => {
					if (part[0] === "^") {
						// do a prefix search
						return cardName.indexOf(part.substr(1)) === 0;
					} else {
						// otherwise just check whether it's anywhere on the card
						return (
							(cardName && cardName.indexOf(part) !== -1) ||
							(cardText && cardText.indexOf(part) !== -1)
						);
					}
				}) ||
				(slangs && slangs.some(slang => card.id === slang))
			);
		};
	});
}

export default translate()(TextFilter);
