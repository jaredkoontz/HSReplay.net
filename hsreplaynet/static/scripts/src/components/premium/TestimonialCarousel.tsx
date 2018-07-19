import React from "react";
import Carousel from "../home/Carousel";
import { image } from "../../helpers";
import Testimonial, { TestimonialData } from "./Testimonial";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {}

interface State {
	index: number;
	lastIndex: number | null;
}

class TestimonialCarousel extends React.Component<Props, State> {
	private interval: number | null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			index: 0,
			lastIndex: null,
		};
	}

	public componentDidMount() {
		this.startRotation();
	}

	public componentWillUnmount() {
		this.stopRotation();
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			this.state.index !== nextState.index ||
			this.state.lastIndex !== nextState.lastIndex
		);
	}

	private rotate = (callback: () => any) => {
		this.setState(
			state => ({
				index: (state.index + 1) % this.getTestimonialData().length,
				lastIndex: state.index,
			}),
			callback,
		);
	};

	private stopRotation = () => {
		if (this.interval !== null) {
			window.clearTimeout(this.interval);
		}
		this.interval = null;
	};

	private startRotation = () => {
		this.stopRotation();
		this.interval = window.setTimeout(
			() => this.rotate(this.startRotation),
			12000,
		);
	};

	private renderOutput(index: number | null): React.ReactNode {
		if (index === null) {
			return null;
		}
		const { image, name, subtitle, text } = this.getTestimonialData()[
			index
		];
		return (
			<Testimonial
				image={image}
				name={name}
				subtitle={subtitle}
				text={text}
			/>
		);
	}

	private getTestimonialData(): TestimonialData[] {
		const { t } = this.props;
		return [
			{
				image: image("premium/RDU.jpg"),
				name: 'Radu "RDU" Dima',
				subtitle: t("Pro Player and Streamer"),
				text:
					'"' +
					t(
						"I think both HSReplay.net and Hearthstone Deck Tracker are great tools. They are so good that they play a huge role right now in the competitive and casual side of Hearthstone. Everyone who likes the game should try these tools.",
					) +
					'"',
			},
			{
				image: image("premium/gaara.jpg"),
				name: 'Petar "Gaara" Stevanovic',
				subtitle: t("Pro Player and Streamer"),
				text:
					'"' +
					t(
						"I use HSReplay.net every day. Seeing the mulligan winrates and best decks in the last 24 hours has become my daily routine. My favorite thing to do is when my Twitch chat says I missed lethal, I show them the replay with the tool on the site to prove them wrong. It's a great site!",
					) +
					'"',
			},
			{
				image: image("premium/dog.jpg"),
				name: 'David "Dog" Caero',
				subtitle: t("Everyone's Favorite Shirtless Pro Player"),
				text:
					'"' +
					t(
						"I use it for all my net decking needs and it helps me get a good picture of matchups I'm not very familiar with.",
					) +
					'"',
			},
		];
	}

	public render(): React.ReactNode {
		return (
			<Carousel
				from={this.renderOutput(this.state.lastIndex)}
				to={this.renderOutput(this.state.index)}
				onHoverStart={this.stopRotation}
				onHoverEnd={this.startRotation}
			/>
		);
	}
}

export default translate()(TestimonialCarousel);
