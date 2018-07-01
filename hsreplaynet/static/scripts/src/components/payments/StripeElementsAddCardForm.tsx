import React from "react";
import { InjectedTranslateProps, translate } from "react-i18next";
import { CardElement, injectStripe } from "react-stripe-elements";
import UserData from "../../UserData";
import CSRFElement from "../CSRFElement";

const enum Step {
	READY,
	WORKING,
}

interface Props extends InjectedTranslateProps {
	action: string;
	currency: string;
}
interface State {
	sourceId: string;
	step: Step;
}

class StripeElementsAddCardForm extends React.Component<Props, State> {
	private formRef: HTMLFormElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			sourceId: "",
			step: Step.READY,
		};
	}

	private async handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		// FIXME: Deduplicate code from StripeElementsCheckoutForm.tsx
		event.preventDefault();
		this.setState({ step: Step.WORKING });

		const result = await (this.props as any).stripe.createSource({
			currency: this.props.currency,
			flow: "none",
			type: "card",
			owner: {
				email: UserData.getEmail(),
			},
		});

		// handle errors (dup. )
		if (result.error) {
			let errorMessage = "An internal error occurred.";
			const presentErrorToUser =
				[
					"validation_error",
					"card_error",
					"invalid_request_error",
				].indexOf(result.error.type) !== -1;

			if (presentErrorToUser && result.error.message) {
				errorMessage = result.error.message;
			}

			if (!presentErrorToUser) {
				throw new Error(
					`${result.error.type}: ${result.error.message}`,
				);
			}
			return;
		}

		if (!result.source.id) {
			throw new Error("Did not get a sourceId");
		}

		this.setState({ sourceId: result.source.id }, () =>
			this.formRef.submit(),
		);
	}

	public render(): React.ReactNode {
		const { t } = this.props;
		return (
			<form
				ref={ref => (this.formRef = ref)}
				method="POST"
				action={this.props.action}
				onSubmit={evt => this.handleSubmit(evt)}
			>
				<CSRFElement />
				<div
					style={{
						backgroundColor: "white",
						border: "1px solid #ccc",
						padding: "10px",
						maxWidth: "500px",
					}}
				>
					<CardElement />
					<input
						type="hidden"
						name="stripeToken"
						value={this.state.sourceId}
					/>
					<input
						type="hidden"
						name="stripeTokenType"
						value="source"
					/>
				</div>
				<p>
					<button
						type="submit"
						className="btn btn-info"
						disabled={this.state.step === Step.WORKING}
					>
						{this.state.step === Step.WORKING
							? t("Working…")
							: t("Add card")}
					</button>
				</p>
			</form>
		);
	}
}

export default injectStripe(translate()(StripeElementsAddCardForm));
