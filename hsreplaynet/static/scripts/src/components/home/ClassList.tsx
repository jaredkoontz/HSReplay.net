import React from "react";
import { getHeroSkinCardUrl, toDynamicFixed, winrateData } from "../../helpers";
import { getCardClass } from "../../utils/enums";
import { CardClass } from "../../hearthstone";

export interface ClassListData {
	playerClass: string;
	title: string | React.ReactNode | React.ReactNode[];
	winRate: number;
	buttonText?: string;
	href?: string;
}

interface State {
	hovering: number;
}

interface Props {
	className?: string;
	data: ClassListData[];
	style?: any;
}

export default class ClassList extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			hovering: 0,
		};
	}

	private getImagePosition(cardClass: CardClass): number {
		switch (cardClass) {
			case CardClass.DRUID:
				return 0.29;
			case CardClass.HUNTER:
				return 0.22;
			case CardClass.MAGE:
				return 0.28;
			case CardClass.PALADIN:
				return 0.2;
			case CardClass.PRIEST:
				return 0.22;
			case CardClass.ROGUE:
				return 0.32;
			case CardClass.SHAMAN:
				return 0.28;
			case CardClass.WARLOCK:
				return 0.36;
			case CardClass.WARRIOR:
				return 0.22;
		}
	}

	render(): React.ReactNode {
		const classes = [];
		this.props.data.forEach((datum, index) => {
			const style = {
				backgroundImage: `url(${getHeroSkinCardUrl(
					datum.playerClass,
				).replace("256", "512")})`,
				backgroundPositionY: `${100 *
					this.getImagePosition(getCardClass(datum.playerClass))}%`,
			};
			classes.push(
				<li
					className="class-item"
					style={style}
					key={datum.playerClass}
					onMouseEnter={() => this.setState({ hovering: index })}
					onMouseLeave={() => this.setState({ hovering: 0 })}
				>
					<div
						className={
							"color-overlay " + datum.playerClass.toLowerCase()
						}
					/>
					<a href={datum.href} className="class-item-content">
						<div className="class-item-title">{datum.title}</div>
						<div className="winrate-wrapper">
							<span
								className="class-winrate"
								style={{
									color: winrateData(50, datum.winRate, 3)
										.color,
								}}
							>
								{toDynamicFixed(datum.winRate, 1)}%
							</span>
						</div>
						{this.state.hovering === index ? (
							<a className="btn details-btn" href={datum.href}>
								{datum.buttonText}
							</a>
						) : null}
					</a>
				</li>,
			);
		});
		return (
			<ul
				className={"class-list " + this.props.className || ""}
				style={this.props.style}
			>
				{classes}
			</ul>
		);
	}
}
