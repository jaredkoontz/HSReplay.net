import React from "react";
import UserData from "../../UserData";
import Feature from "../Feature";
import Modal from "../Modal";
import CollectionSetup from "./CollectionSetup";

interface Props {
	hasCollection: boolean;
	wrapper?: (body: React.ReactNode) => React.ReactNode;
}

interface State {
	showModal?: boolean;
}

export default class CollectionBanner extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			showModal: false,
		};
	}

	public render(): React.ReactNode {
		if (this.props.hasCollection) {
			return null;
		}
		let next = "";
		if (document.location) {
			next += document.location.pathname;
			if (document.location.hash) {
				next += `${document.location.hash}`;
			}
		}
		return (
			<Feature feature="collection-syncing">
				{this.state.showModal ? (
					<Modal
						onClose={() =>
							this.setState({
								showModal: false,
							})
						}
					>
						<CollectionSetup />
					</Modal>
				) : null}
				{this.wrap(
					<div onClick={this.showModal}>{this.renderChildren()}</div>,
				)}
			</Feature>
		);
	}

	private wrap(body: React.ReactNode): React.ReactNode {
		if (this.props.wrapper) {
			return this.props.wrapper(body);
		}
		return body;
	}

	showModal = (): void => {
		this.setState({ showModal: true });
	};

	private renderChildren(): React.ReactNode {
		const { children } = this.props;
		if (!children) {
			return null;
		}
		if (typeof children === "function") {
			return (children as any)(UserData.isAuthenticated());
		} else {
			return this.props.children;
		}
	}
}
