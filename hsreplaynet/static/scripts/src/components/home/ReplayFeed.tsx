import * as React from "react";
import { Archetype } from "../../utils/api";
import { withLoading } from "../loading/Loading";
import ScrollingFeed from "./ScrollingFeed";
import RankIcon from "../RankIcon";
import { BnetGameType } from "../../hearthstone";
import DataManager from "../../DataManager";
import _ from "lodash";
import { commaSeparate } from "../../helpers";

interface ReplayData {
	player1_rank: string;
	player1_legend_rank: string;
	player1_archetype: string;
	player1_won: string;
	player2_rank: string;
	player2_legend_rank: string;
	player2_archetype: string;
	player2_won: string;
	id: string;
}

interface GameCountData {
	games_today: number;
	games_weekly: number;
	contributors_today: number;
	contributors_weekly: number;
}

interface State {
	data: ReplayData[];
	doUpdate: boolean;
	fetching: boolean;
	lastFetch: Date;
	startTime: number;
}

interface Props {
	archetypeData?: Archetype[];
	gamesCountData?: GameCountData;
	fullSpeed?: boolean;
}

class ReplayFeed extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			data: [],
			fetching: false,
			doUpdate: true,
			lastFetch: new Date(0),
			startTime: this.getMillisecondsOfDay() || 1,
		};
	}

	componentWillReceiveProps(nextProps: Props) {
		if (
			nextProps.gamesCountData.games_today !==
			this.props.gamesCountData.games_today
		) {
			this.setState({ startTime: this.getMillisecondsOfDay() || 1 });
		}
	}

	componentDidMount() {
		this.updateGamesToday();
	}

	getMillisecondsOfDay(): number {
		const now = new Date();
		return (
			now.getUTCMilliseconds() +
			1000 * now.getUTCSeconds() +
			1000 * 60 * now.getUTCMinutes() +
			1000 * 60 * 60 * now.getUTCHours()
		);
	}

	updateGamesToday() {
		const element = document.getElementById("games-count");

		const update = () => {
			setTimeout(() => {
				if (element) {
					const now = this.getMillisecondsOfDay();
					const factor = now / this.state.startTime;
					const games = Math.floor(
						this.props.gamesCountData.games_today * factor,
					);
					element.innerHTML = commaSeparate(games);
				}
				update();
			}, 100);
		};

		update();
	}

	fetchData() {
		if (
			this.state.fetching ||
			new Date().valueOf() - this.state.lastFetch.valueOf() < 5000
		) {
			return;
		}
		this.setState({ fetching: true });
		DataManager.get("/live/replay_feed/", {}, true)
			.then((response: any) => {
				if (_.isEmpty(response) || _.isEmpty(response.data)) {
					return Promise.reject("No data");
				}
				return Promise.resolve(response.data);
			})
			.then((data: ReplayData[]) => {
				this.setState({ data, fetching: false, lastFetch: new Date() });
			})
			.catch(error => {
				this.setState({
					doUpdate: false,
					fetching: false,
					lastFetch: new Date(),
				});
			});
	}

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			!_.isEqual(this.props.archetypeData, nextProps.archetypeData) ||
			this.props.fullSpeed !== nextProps.fullSpeed ||
			!_.isEqual(this.state.data, nextState.data) ||
			this.state.doUpdate !== nextState.doUpdate ||
			this.state.fetching !== nextState.fetching
		);
	}

	render(): React.ReactNode {
		if (this.state.data === null) {
			return null;
		}
		const items = this.state.data.map(replay => {
			return { id: replay.id, data: replay };
		});
		const gamesPerSecond =
			this.props.gamesCountData.games_today /
			(this.state.startTime / 1000);
		return (
			<div id="replay-feed">
				<h1>
					Games Last 7 Days:{" "}
					{commaSeparate(this.props.gamesCountData.games_weekly)}
				</h1>
				<h4>
					Games Today:{" "}
					<span id="games-count">
						{commaSeparate(this.props.gamesCountData.games_today)}
					</span>
				</h4>
				<ScrollingFeed
					direction="up"
					items={items}
					itemConverter={d => this.itemConverter(d)}
					itemHeight={44}
					onLowItems={() => this.fetchData()}
					lowItemCount={10}
					itemsPerSecond={this.props.fullSpeed ? gamesPerSecond : 1.2}
				/>
				<div id="replay-contributors">
					Contributors:{" "}
					{commaSeparate(
						this.props.gamesCountData.contributors_weekly,
					)}
				</div>
				<div id="contributor-button-wrapper">
					<a
						className="btn promo-button blue-style"
						href="https://hsdecktracker.net/"
						target="_blank"
					>
						Become a Contributor
					</a>
				</div>
			</div>
		);
	}

	itemConverter(data: ReplayData): React.ReactNode {
		const winnerIcon = (
			<img
				className={"winner-icon"}
				src={`${STATIC_URL}images/crown.png`}
			/>
		);
		const p1Archetype = this.props.archetypeData.find(a => {
			return a.id === +data.player1_archetype;
		});
		const p2Archetype = this.props.archetypeData.find(a => {
			return a.id === +data.player2_archetype;
		});
		return (
			<a
				className="replay-feed-item"
				href={`/replay/${data.id}`}
				target="_blank"
			>
				<div className="replay-feed-player player-left">
					{data.player1_won === "True" ? winnerIcon : null}
					<RankIcon
						gameType={BnetGameType.BGT_RANKED_STANDARD}
						rank={+data.player1_rank}
						legendRank={+data.player1_legend_rank}
					/>
					<span>{p1Archetype && p1Archetype.name}</span>
				</div>
				<img className="vs-icon" src={`${STATIC_URL}images/vs.png`} />
				<div className="replay-feed-player player-right">
					{data.player2_won === "True" ? winnerIcon : null}
					<RankIcon
						gameType={BnetGameType.BGT_RANKED_STANDARD}
						rank={+data.player2_rank}
						legendRank={+data.player2_legend_rank}
					/>
					<span>{p2Archetype && p2Archetype.name}</span>
				</div>
			</a>
		);
	}
}

export default withLoading(["archetypeData", "gamesCountData"])(ReplayFeed);
