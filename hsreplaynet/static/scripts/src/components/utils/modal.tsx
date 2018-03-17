/* tslint:disable:max-classes-per-file */
import React from "react";
import PropTypes from "prop-types";
import { Account } from "../../UserData";

interface Props {
	value: Value;
}

interface Value {
	onClose: () => any;
}

export class Provider extends React.Component<Props> {
	static childContextTypes = {
		modal: PropTypes.object,
	};

	getChildContext() {
		return { modal: this.props.value };
	}

	public render(): React.ReactNode {
		return this.props.children;
	}
}

export class Consumer extends React.Component {
	static contextTypes = {
		modal: PropTypes.object,
	};

	public render(): React.ReactNode {
		if (typeof this.props.children !== "function") {
			throw new Error("modal provider expected render prop as children");
		}
		const renderProp = this.props.children as (
			account: Account | null,
		) => React.ReactNode;
		return renderProp(this.context.modal);
	}
}
