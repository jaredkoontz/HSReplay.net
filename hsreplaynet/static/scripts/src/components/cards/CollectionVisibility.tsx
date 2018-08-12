import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { Account } from "../../UserData";
import InfoboxFilterGroup from "../InfoboxFilterGroup";
import { fetchCSRF } from "../../helpers";
import CopyText from "../CopyText";
import InfoboxFilter from "../InfoboxFilter";

interface Props extends InjectedTranslateProps {
	visibility: string;
	account: Account;
}

interface State {
	visibility: string;
	working: boolean;
}

class CollectionVisibility extends React.Component<Props, State> {
	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			visibility: props.visibility,
			working: false,
		};
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<InfoboxFilterGroup
				header={t("Visibility")}
				disabled={this.state.working}
				deselectable
				onClick={value => {
					this.setState({ working: true });
					const headers = new Headers();
					headers.set("content-type", "application/json");
					fetchCSRF(`/api/v1/collection/visibility/`, {
						body: JSON.stringify({ visibility: value }),
						credentials: "same-origin",
						headers,
						method: "PATCH",
					})
						.then((response: Response) => {
							let { visibility } = this.state;
							if (!response.ok) {
								console.error(response.toString());
							} else {
								visibility = value;
							}
							this.setState({ visibility, working: false });
						})
						.catch(reason => {
							console.error(reason);
							this.setState({ working: false });
						});
				}}
				selectedValue={this.state.visibility}
			>
				<InfoboxFilter value={"public"}>
					{this.state.visibility === "public"
						? t("Public")
						: t("Private")}
				</InfoboxFilter>
				{this.state.visibility === "public" ? (
					<CopyText
						text={`https://hsreplay.net/collection/${
							this.props.account.region
						}/${this.props.account.account_lo}/`}
					/>
				) : null}
			</InfoboxFilterGroup>
		);
	}
}
export default translate()(CollectionVisibility);
