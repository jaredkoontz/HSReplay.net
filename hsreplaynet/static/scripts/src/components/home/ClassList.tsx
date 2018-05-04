import React from "react";
import { getHeroSkinCardUrl, toDynamicFixed, winrateData } from "../../helpers";
import { withLoading } from "../loading/Loading";

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
}

export default class ClassList extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			hovering: 0,
		};
	}

	getImagePosition(playerClass: string): number {
		switch (playerClass.toLowerCase()) {
			case "druid":
				return 0.29;
			case "hunter":
				return 0.22;
			case "mage":
				return 0.28;
			case "paladin":
				return 0.2;
			case "priest":
				return 0.22;
			case "rogue":
				return 0.32;
			case "shaman":
				return 0.28;
			case "warlock":
				return 0.36;
			case "warrior":
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
					this.getImagePosition(datum.playerClass)}%`,
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
			<ul className={"class-list " + this.props.className}>{classes}</ul>
		);
	}
}
