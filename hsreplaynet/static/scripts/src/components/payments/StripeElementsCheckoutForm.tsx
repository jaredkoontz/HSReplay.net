import React from "react";
import { CardElement, injectStripe } from "react-stripe-elements";
import BtnGroup from "../BtnGroup";
import { CheckoutFormInstanceProps } from "./CheckoutForm";
import UserData from "../../UserData";

const enum StripeCheckoutStep {
	READY_TO_PAY,
	CONFIRM_3D_SECURE,
	WORKING,
	SUBMIT
}

export interface StripePlan {
	stripeId: string;
	description: string;
	amount: number;
	currency: string;
}

interface Props extends CheckoutFormInstanceProps {
	plans: StripePlan[];
	defaultSource?: string;
	coupon?: string;
}

interface State {
	step?: StripeCheckoutStep;
	errorMessage?: null | string;
	sourceId?: string;
	selectedPlan: string;
	email?: string;
}

interface Redirect {
	url: string;
}

class StripeElementsCheckoutForm extends React.Component<Props, State> {
	private formRef: HTMLFormElement;
	private cardElement: any; // CardElement

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			step: StripeCheckoutStep.READY_TO_PAY,
			errorMessage: null,
			selectedPlan: this.props.plans
				? this.props.plans[0].stripeId
				: null,
			email: UserData.getEmail()
		};
	}

	private getPlanData(stripeId: string): StripePlan | null {
		return this.props.plans
			? this.props.plans.find(p => p.stripeId === stripeId)
			: null;
	}

	private async handleSubmit(event) {
		event.preventDefault();

		if (this.state.selectedPlan === null) {
			return;
		}

		if (this.state.step === StripeCheckoutStep.CONFIRM_3D_SECURE) {
			// continue with card, despite 3D Secure
			this.setState({ step: StripeCheckoutStep.SUBMIT }, () =>
				this.submit()
			);
			return;
		}

		if (this.state.step !== StripeCheckoutStep.READY_TO_PAY) {
			return false;
		}

		// commit to work
		this.setState({ step: StripeCheckoutStep.WORKING, errorMessage: null });

		const method: string = "card";

		let sourceData = null;
		switch (method) {
			case "card":
				sourceData = {
					type: "card",
					flow: "none",
					currency: "usd",
					owner: {
						email: this.state.email
					}
				};
				break;
			default:
				throw new Error(`Unknown method "${method}"`);
		}

		const commonSourceData = {
			currency: "usd"
		};
		sourceData = Object.assign({}, sourceData, commonSourceData);

		const result = await (this.props as any).stripe.createSource(
			sourceData
		);

		// handle errors
		if (result.error) {
			let errorMessage = "An internal error occurred.";
			const presentErrorToUser =
				[
					"validation_error",
					"card_error",
					"invalid_request_error"
				].indexOf(result.error.type) !== -1;

			if (presentErrorToUser && result.error.message) {
				errorMessage = result.error.message;
			}
			this.setState({
				step: StripeCheckoutStep.READY_TO_PAY,
				errorMessage
			});

			if (!presentErrorToUser) {
				throw new Error(
					`${result.error.type}: ${result.error.message}`
				);
			}
			return;
		}

		// finalize source
		const { source } = result;
		switch (method) {
			case "card":
				const { id: sourceId, card } = source;

				if (card.three_d_secure === "required") {
					this.setState({
						sourceId,
						step: StripeCheckoutStep.CONFIRM_3D_SECURE
					});
					return;
				}

				this.setState(
					{
						sourceId,
						step: StripeCheckoutStep.SUBMIT
					},
					() => this.submit()
				);
				break;
		}

		// emit event
		const selectedPlan = this.getPlanData(this.state.selectedPlan);
		if (selectedPlan) {
			this.props.onSubscribe(selectedPlan.amount / 100);
		}
	}

	private static redirect(redirect: Redirect) {
		window.location.replace(redirect.url);
	}

	private reset() {
		if (this.cardElement) {
			this.cardElement.clear();
		}
		this.setState({
			sourceId: null,
			step: StripeCheckoutStep.READY_TO_PAY
		});
	}

	private submit() {
		this.formRef.submit();
	}

	private static getButtonMessage(step: StripeCheckoutStep) {
		switch (step) {
			case StripeCheckoutStep.READY_TO_PAY:
				return "Pay Now";
			case StripeCheckoutStep.CONFIRM_3D_SECURE:
				return "Continue";
			case StripeCheckoutStep.WORKING:
				return "Working…";
			case StripeCheckoutStep.SUBMIT:
				return "Confirming…";
		}
	}

	private getButtons() {
		const buttons = [];
		const submittables = [
			StripeCheckoutStep.READY_TO_PAY,
			StripeCheckoutStep.CONFIRM_3D_SECURE
		];

		buttons.push(
			<button
				className="promo-button text-premium checkout-button"
				type="submit"
				disabled={submittables.indexOf(this.state.step) === -1}
			>
				{StripeElementsCheckoutForm.getButtonMessage(this.state.step)}
			</button>
		);

		if (this.state.step === StripeCheckoutStep.CONFIRM_3D_SECURE) {
			buttons.push(
				<button
					className="promo-button checkout-button"
					type="reset"
					onClick={() => this.reset()}
				>
					Reset
				</button>
			);
		}

		return buttons;
	}

	getPlanButtons() {
		return this.props.plans.map((plan: StripePlan) => ({
			label: <h4>{plan.description}</h4>,
			value: plan.stripeId,
			className: "btn btn-default"
		}));
	}

	getCouponMessage() {
		if (!this.props.coupon) {
			return null;
		}

		return (
			<p
				className="alert alert-success text-center"
				style={{ marginTop: "20px" }}
			>
				You have an active coupon for{" "}
				<strong>{this.props.coupon}</strong>.<br />
				This amount will be deducted from your purchase.
			</p>
		);
	}

	public componentWillUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any
	): void {
		if (nextState.step !== this.state.step) {
			this.props.onDisable(
				nextState.step !== StripeCheckoutStep.READY_TO_PAY
			);
		}
	}

	public render(): React.ReactNode {
		let message = null;
		const disabled = this.state.step !== StripeCheckoutStep.READY_TO_PAY;

		switch (this.state.step) {
			case StripeCheckoutStep.READY_TO_PAY:
				if (this.state.errorMessage) {
					message = (
						<div className="alert alert-danger text-left">
							{this.state.errorMessage}
						</div>
					);
				}
				break;
			case StripeCheckoutStep.CONFIRM_3D_SECURE:
				message = (
					<p className="alert alert-warning text-left">
						Your card requires 3D Secure which we don't support at
						this time. It is likely the payment will fail, but you
						can try anyway.
					</p>
				);
				break;
		}

		return (
			<form
				ref={ref => (this.formRef = ref)}
				method="post"
				action={this.props.submitUrl}
				onSubmit={evt => this.handleSubmit(evt)}
				style={{
					width: "100%"
				}}
			>
				<div
					style={{ margin: "25px 0 10px 0" }}
					className="text-center"
				>
					<label id="choose-plan">Choose your plan</label>
					<BtnGroup
						className="btn-group btn-group-flex"
						buttons={this.getPlanButtons()}
						id="stripe-plan"
						name="plan"
						onChange={selectedPlan =>
							this.setState({ selectedPlan })
						}
						value={this.state.selectedPlan}
						aria-labelledby="choose-plan"
						disabled={disabled}
						required
					/>
				</div>
				{this.getCouponMessage()}
				<div
					style={{
						margin: "25px auto",
						width: "100%"
					}}
				>
					<label htmlFor="stripe-email">Email address</label>
					<div style={{ width: "100%" }}>
						<input
							id="stripe-email"
							type="email"
							style={{
								padding: "9px",
								width: "100%"
							}}
							placeholder="thelichking@example.com"
							disabled={disabled}
							value={this.state.email}
							onChange={e =>
								this.setState({ email: e.target.value })
							}
						/>
						<p className="help-block">
							We'll send your invoices here.
						</p>
					</div>
				</div>
				<div style={{ margin: "25px auto" }}>
					<label htmlFor="stripe-email">Payment details</label>
					<div
						style={Object.assign(
							{
								backgroundColor: "white",
								border: "solid 1px #ccc",
								padding: "10px"
							},
							disabled
								? {
										backgroundColor: "#eee",
										pointerEvents: "none"
									}
								: {}
						)}
					>
						{disabled ? (
							<div style={{ position: "absolute" }}>●●●●</div>
						) : null}
						<div
							style={
								disabled
									? {
											visibility: "hidden"
										}
									: null
							}
						>
							<CardElement
								style={{
									base: {
										fontSize: "16px"
									}
								}}
								ref={ref =>
									(this.cardElement = ref
										? ref._element
										: null)
								}
								onChange={e => {
									if (e.error) {
										this.setState({
											errorMessage: e.error.message
										});
									} else if (
										this.state.errorMessage !== null
									) {
										this.setState({ errorMessage: null });
									}
								}}
							/>
						</div>
					</div>
					{message ? (
						message
					) : (
						<p className="help-block">
							Transmitted securely to our payment provider. We
							don't store these.
						</p>
					)}
				</div>
				<div style={{ textAlign: "center" }}>{this.getButtons()}</div>
				<input
					type="hidden"
					name="stripeToken"
					value={this.state.sourceId}
				/>
				<input type="hidden" name="stripeTokenType" value={"source"} />
				<input
					type="hidden"
					name="stripeEmail"
					value={this.state.email}
				/>
				<div dangerouslySetInnerHTML={this.props.csrfElement} />
			</form>
		);
	}
}

export default injectStripe(StripeElementsCheckoutForm);
