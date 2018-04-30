import React from "react";

interface Props {
	slots: React.ReactNode[];
	index: number;
}

interface State {
	height: number;
}

export default class SlotMachine extends React.Component<Props, State> {
	private ref: HTMLElement | null = null;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			height: 0,
		};
	}

	public componentDidMount(): void {
		this.measureHeight();
	}

	public render(): React.ReactNode {
		return (
			<div className="slot-machine" ref={ref => (this.ref = ref)}>
				<ul
					style={{
						top: `${-this.props.index * this.state.height}px`,
					}}
				>
					{this.props.slots.map((slot, index) => (
						<li
							key={index}
							className={
								index === this.props.index
									? "active"
									: undefined
							}
						>
							{slot}
						</li>
					))}
				</ul>
			</div>
		);
	}

	private measureHeight(): void {
		if (!this.ref) {
			return;
		}
		const { height } = this.ref.getBoundingClientRect();
		this.setState({ height });
	}
}
