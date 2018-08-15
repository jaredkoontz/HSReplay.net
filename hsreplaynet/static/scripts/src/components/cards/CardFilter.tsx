import React from "react";
import {
	CardFilterConsumer,
	CardFilterFunction,
	CardFilterProps,
} from "./CardFilterManager";

interface Props extends CardFilterProps {
	filter: CardFilterFunction | null;
}

class CardFilter extends React.Component<Props> {
	public componentDidMount(): void {
		if (this.props.filter) {
			this.props.addFilter(this.props.filter);
		}
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<{}>,
		snapshot?: any,
	): void {
		if (prevProps.filter !== this.props.filter) {
			if (prevProps.filter) {
				this.props.removeFilter(prevProps.filter);
			}
			if (this.props.filter) {
				this.props.addFilter(this.props.filter);
			}
		}
	}

	public componentWillUnmount(): void {
		if (this.props.filter) {
			this.props.removeFilter(this.props.filter);
		}
	}

	public render(): React.ReactNode {
		return this.props.children || null;
	}
}

export default props => (
	<CardFilterConsumer>
		{(filterProps: CardFilterProps) => (
			<CardFilter {...filterProps} {...props} />
		)}
	</CardFilterConsumer>
);
