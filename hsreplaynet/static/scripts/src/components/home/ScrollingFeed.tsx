import React from "react";
import _ from "lodash";

interface FeedItem {
	id: string;
	data: any;
}

interface State {
	offset: number;
	visibleItems: FeedItem[];
	remainingItems: FeedItem[];
	index: number;
	pause: boolean;
}

interface Props {
	items: FeedItem[];
	direction: "up" | "down";
	itemHeight: number;
	lowItemCount: number;
	onLowItems: () => void;
	itemsPerSecond: number;
}

export default class ScrollingFeed extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			offset: 0,
			visibleItems: [],
			remainingItems: [],
			index: 0,
			pause: false,
		};
	}

	public componentDidMount(): void {
		this.update();
		window.addEventListener("visibilitychange", this.onVisibilityChange);
	}

	public componentWillUnmount(): void {
		window.removeEventListener("visibilitychange", this.onVisibilityChange);
	}

	onVisibilityChange = () => {
		this.setState({ pause: document.visibilityState !== "visible" });
	};

	public shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any,
	): boolean {
		return (
			!_.isEqual(this.props.items, nextProps.items) ||
			this.props.direction !== nextProps.direction ||
			this.props.itemHeight !== nextProps.itemHeight ||
			this.props.lowItemCount !== nextProps.lowItemCount ||
			this.props.itemsPerSecond !== nextProps.itemsPerSecond ||
			this.state.offset !== nextState.offset ||
			!_.isEqual(this.state.visibleItems, nextState.visibleItems) ||
			!_.isEqual(this.state.remainingItems, nextState.remainingItems) ||
			this.state.index !== nextState.index ||
			this.state.pause !== nextState.pause
		);
	}

	public componentWillReceiveProps(
		nextProps: Readonly<Props>,
		nextContext: any,
	): void {
		if (!_.isEqual(this.props.items, nextProps.items)) {
			let remainingItems = this.state.remainingItems.concat(
				nextProps.items,
			);
			let visibleItems = this.state.visibleItems.slice();
			if (!visibleItems.length) {
				visibleItems = remainingItems.slice(0, 20);
				remainingItems = remainingItems.slice(20);
			}
			this.setState({ remainingItems, visibleItems });
		}
	}

	update() {
		if (!this.state.pause) {
			const prevItemCount = this.state.visibleItems.length;
			let visibleItems = this.state.visibleItems.filter((x, index) => {
				return this.getTop(index) > -this.props.itemHeight;
			});
			const removed = prevItemCount - visibleItems.length;
			let remainingItems = this.state.remainingItems.slice();
			if (remainingItems.length === 0) {
				remainingItems = this.props.items.slice();
			}
			if (removed > 0) {
				visibleItems = visibleItems.concat(
					remainingItems.slice(0, removed),
				);
				remainingItems = remainingItems.slice(removed);
			}
			if (remainingItems.length <= this.props.lowItemCount) {
				this.props.onLowItems();
			}
			this.setState({
				offset:
					this.state.offset +
					this.props.itemHeight -
					removed * this.props.itemHeight,
				visibleItems,
				remainingItems,
				index: this.state.index + removed,
			});
		}
		const delay = 1000 / this.props.itemsPerSecond;
		setTimeout(() => {
			this.update();
		}, delay / 2 + Math.random() * delay);
	}

	getTop(index: number): number {
		return index * this.props.itemHeight - this.state.offset;
	}

	render(): React.ReactNode {
		const { children } = this.props;
		const render = children as (item: FeedItem) => React.ReactNode;

		const items = this.state.visibleItems.map((item, index) => {
			const style = {
				top: this.getTop(index),
			};
			if (this.props.itemsPerSecond > 5) {
				style["transition"] = "none";
			}

			return (
				<div
					className="feed-item"
					key={index + this.state.index}
					style={style}
				>
					{render(item.data)}
				</div>
			);
		});
		return (
			<div
				className="scrolling-feed"
				onMouseEnter={() => {
					this.setState({ pause: true });
				}}
				onMouseLeave={() => {
					this.setState({ pause: false });
				}}
			>
				{items}
			</div>
		);
	}
}
