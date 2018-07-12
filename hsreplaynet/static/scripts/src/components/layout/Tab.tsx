import React from "react";
import { ModalStyle } from "../premium/PremiumModal";

interface Props {
	id: string;
	hidden?: boolean;
	disabled?: boolean;
	label?: React.ReactNode;
	highlight?: boolean;
	premiumModalOnClick?: ModalStyle;
}

export default class Tab extends React.Component<Props> {
	public render(): React.ReactNode {
		return <div>{this.props.children}</div>;
	}
}
