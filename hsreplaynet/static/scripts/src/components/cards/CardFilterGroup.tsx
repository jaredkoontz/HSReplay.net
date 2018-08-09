import React from "react";
import { CardFilterFunction } from "./CardFilterManager";
import InfoboxFilterGroup from "../InfoboxFilterGroup";

const { Provider, Consumer } = React.createContext<CardFilterFunction | null>(
	null,
);
export { Consumer as FilterConsumer };

interface Props {
	title: string;
	filter: CardFilterFunction;
	collapsible?: boolean;
}

export default class CardFilterGroup extends React.Component<Props> {
	public render(): React.ReactNode {
		return (
			<Provider value={this.props.filter}>
				<InfoboxFilterGroup
					header={this.props.title}
					deselectable
					selectedValue={null}
					collapsed={this.props.collapsible}
					collapsible={this.props.collapsible}
					onClick={value => {}}
				>
					{this.props.children}
				</InfoboxFilterGroup>
			</Provider>
		);
	}
}
