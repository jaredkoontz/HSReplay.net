import clipboard from "clipboard-polyfill";
import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";

interface Props extends InjectedTranslateProps {
	text: string;
	onCopy?: () => void;
}

interface State {
	confirming: boolean;
}

class CopyText extends React.Component<Props, State> {
	private input: HTMLInputElement;
	private timeout: number = null;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			confirming: false,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<div className="form-group">
				<div className="input-group">
					<input
						type="text"
						readOnly
						id="replay-share-url"
						className="form-control"
						value={this.props.text}
						onSelect={e =>
							this.input.setSelectionRange(
								0,
								this.input.value.length,
							)
						}
						ref={node => (this.input = node)}
					/>
					<span className="input-group-btn">
						<button
							className="btn btn-default"
							id="replay-share-copy-url"
							type="button"
							onClick={e => this.onCopy(e)}
						>
							{this.state.confirming ? t("Copied!") : t("Copy")}
						</button>
					</span>
				</div>
			</div>
		);
	}

	protected onCopy(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();
		clipboard.writeText(this.props.text).then(() => {
			this.setState({ confirming: true });
			window.clearTimeout(this.timeout);
			this.timeout = window.setTimeout(() => {
				this.setState({ confirming: false });
				this.timeout = null;
			}, 1000);
			if (this.props.onCopy) {
				this.props.onCopy();
			}
		});
	}
}
export default translate()(CopyText);
