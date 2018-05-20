import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { Consumer as ModalConsumer } from "../utils/modal";

class CloseModalButton extends React.Component<InjectedTranslateProps> {
	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<ModalConsumer>
				{({ onClose }) => (
					<span
						onClick={() => onClose()}
						aria-label={t("Close")}
						className="modal-close"
					>
						&times;
					</span>
				)}
			</ModalConsumer>
		);
	}
}

export default translate()(CloseModalButton);
