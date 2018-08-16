import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import { CardElement, injectStripe } from "react-stripe-elements";
import UserData from "../../UserData";
import BtnGroup from "../BtnGroup";
import CSRFElement from "../CSRFElement";
import { CheckoutFormInstanceProps } from "./CheckoutForm";

const enum StripeCheckoutStep {
	READY_TO_PAY,
	CONFIRM_3D_SECURE,
	WORKING,
	SUBMIT,
}

export interface StripePlan {
	stripeId: string;
	description: string;
	amount: number;
	currency: string;
}

interface Props extends CheckoutFormInstanceProps, InjectedTranslateProps {
	plans: StripePlan[];
	defaultSource?: string;
	coupon?: string;
}

interface State {
	step: StripeCheckoutStep;
	errorMessage: null | string;
	sourceId: string | null;
	selectedPlan: string;
	email: string;
}

interface Redirect {
	url: string;
}

class StripeElementsCheckoutForm extends React.Component<Props, State> {
	private formRef: HTMLFormElement;
	private cardElement: CardElement;

	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			step: StripeCheckoutStep.READY_TO_PAY,
			errorMessage: null,
			sourceId: null,
			selectedPlan: this.props.plans
				? this.props.plans[0].stripeId
				: null,
			email: UserData.getEmail() || "",
		};
	}

	private getPlanData(stripeId: string): StripePlan | null {
		return this.props.plans
			? this.props.plans.find(p => p.stripeId === stripeId)
			: null;
	}

	private async handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (this.state.selectedPlan === null) {
			return;
		}

		if (this.state.step === StripeCheckoutStep.CONFIRM_3D_SECURE) {
			// continue with card, despite 3D Secure
			this.setState({ step: StripeCheckoutStep.SUBMIT }, () =>
				this.submit(),
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
						email: this.state.email,
					},
				};
				break;
			default:
				throw new Error(`Unknown method "${method}"`);
		}

		const commonSourceData = {
			currency: "usd",
		};
		sourceData = Object.assign({}, sourceData, commonSourceData);

		const result = await (this.props as any).stripe.createSource(
			sourceData,
		);

		// handle errors
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
			this.setState({
				step: StripeCheckoutStep.READY_TO_PAY,
				errorMessage,
			});

			if (!presentErrorToUser) {
				throw new Error(
					`${result.error.type}: ${result.error.message}`,
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
						step: StripeCheckoutStep.CONFIRM_3D_SECURE,
					});
					return;
				}

				this.setState(
					{
						sourceId,
						step: StripeCheckoutStep.SUBMIT,
					},
					() => this.submit(),
				);
				break;
		}

		// emit event
		const selectedPlan = this.getPlanData(this.state.selectedPlan);
		if (selectedPlan) {
			this.props.onSubscribe(selectedPlan.amount / 100);
		}
	}

	private static redirect(redirect: Redirect): void {
		window.location.replace(redirect.url);
	}

	private reset(): void {
		if (this.cardElement) {
			this.cardElement.clear();
		}
		this.setState({
			sourceId: null,
			step: StripeCheckoutStep.READY_TO_PAY,
		});
	}

	private submit(): void {
		this.formRef.submit();
	}

	private getButtons(): React.ReactNode {
		const { t } = this.props;
		const submittables = [
			StripeCheckoutStep.READY_TO_PAY,
			StripeCheckoutStep.CONFIRM_3D_SECURE,
		];
		const is3dSecure =
			this.state.step === StripeCheckoutStep.CONFIRM_3D_SECURE;

		let label: string;

		switch (this.state.step) {
			case StripeCheckoutStep.READY_TO_PAY:
				label = t("Pay now");
				break;
			case StripeCheckoutStep.CONFIRM_3D_SECURE:
				label = t("Continue");
				break;
			case StripeCheckoutStep.WORKING:
				label = t("Working…");
				break;
			case StripeCheckoutStep.SUBMIT:
				label = t("Confirming…");
				break;
		}

		return (
			<>
				<button
					className="promo-button text-premium checkout-button"
					type="submit"
					disabled={submittables.indexOf(this.state.step) === -1}
				>
					{label}
				</button>
				{is3dSecure ? (
					<button
						className="promo-button checkout-button"
						type="reset"
						onClick={() => this.reset()}
					>
						{t("Reset")}
					</button>
				) : null}
			</>
		);
	}

	getPlanButtons() {
		return this.props.plans.map((plan: StripePlan) => ({
			label: <h4>{plan.description}</h4>,
			value: plan.stripeId,
			className: "btn btn-default",
		}));
	}

	getCouponMessage(): React.ReactNode {
		if (!this.props.coupon) {
			return null;
		}

		return (
			<p
				className="alert alert-success text-center"
				style={{ marginTop: "20px" }}
			>
				<Trans
					defaults="You have an active coupon for <0>{couponDescription}</0>.<1></1>This amount will be deducted from your purchase."
					components={[<strong key={0}>0</strong>, <br key={1} />]}
					tOptions={{
						couponDescription: this.props.coupon,
					}}
				/>
			</p>
		);
	}

	public componentDidUpdate(
		prevProps: Readonly<Props>,
		prevState: Readonly<State>,
		prevContext: any,
	): void {
		if (this.state.step !== prevState.step) {
			this.props.onDisable(
				this.state.step !== StripeCheckoutStep.READY_TO_PAY,
			);
		}
	}

	public render(): React.ReactNode {
		const { t } = this.props;
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
						{t(
							"Your card requires 3D Secure which we don't support at this time. The payment may fail.",
						)}
					</p>
				);
				break;
		}

		return (
			<form
				ref={ref => (this.formRef = ref)}
				method="post"
				action={this.props.submitUrl}
				onSubmit={evt => {
					this.props.onInteract();
					this.handleSubmit(evt);
				}}
				style={{
					width: "100%",
				}}
			>
				<div
					style={{ margin: "25px 0 10px 0" }}
					className="text-center"
				>
					<label id="choose-plan">{t("Choose your plan")}</label>
					<BtnGroup
						className="btn-group btn-group-flex"
						buttons={this.getPlanButtons()}
						id="stripe-plan"
						name="plan"
						onChange={selectedPlan => {
							this.props.onInteract();
							this.setState({ selectedPlan });
						}}
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
						width: "100%",
					}}
				>
					<label htmlFor="stripe-email">{t("Email address")}</label>
					<div style={{ width: "100%" }}>
						<input
							id="stripe-email"
							type="email"
							style={{
								padding: "9px",
								width: "100%",
								border: "solid 1px #ccc",
								borderRadius: "none",
							}}
							placeholder="thelichking@example.com"
							disabled={disabled}
							required
							value={this.state.email}
							onFocus={() => this.props.onInteract()}
							onChange={e => {
								this.props.onInteract();
								this.setState({ email: e.target.value });
							}}
							autoComplete="email"
							autoCorrect="off"
							spellCheck={false}
						/>
						<p className="help-block">
							{t("We'll send your invoices here.")}
						</p>
					</div>
				</div>
				<div style={{ margin: "25px auto" }}>
					<label htmlFor="stripe-email">{t("Payment details")}</label>
					<div
						style={Object.assign(
							{
								backgroundColor: "white",
								border: "solid 1px #ccc",
								padding: "10px",
							},
							this.state.errorMessage
								? {
										border: "solid 1px #eb1c26",
								  }
								: {},
							disabled
								? {
										backgroundColor: "#eee",
										pointerEvents: "none",
								  }
								: {},
						)}
					>
						{disabled ? (
							<div style={{ position: "absolute" }}>●●●●</div>
						) : null}
						<div
							style={
								disabled
									? {
											visibility: "hidden",
									  }
									: null
							}
						>
							<CardElement
								style={{
									base: {
										fontSize: "16px",
									},
								}}
								ref={ref =>
									(this.cardElement = ref
										? ref._element
										: null)
								}
								onFocus={() => this.props.onInteract()}
								onChange={e => {
									this.props.onInteract();
									if (e.error) {
										this.setState({
											errorMessage: e.error.message,
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
							{t(
								"Transmitted securely to our payment provider. We don't store these.",
							)}
						</p>
					)}
				</div>
				<div style={{ textAlign: "center" }}>{this.getButtons()}</div>
				<input
					type="hidden"
					name="stripeToken"
					value={this.state.sourceId}
				/>
				<input type="hidden" name="stripeTokenType" value="source" />
				<input
					type="hidden"
					name="stripeEmail"
					value={this.state.email}
				/>
				<CSRFElement />
			</form>
		);
	}
}

export default injectStripe(translate()(StripeElementsCheckoutForm));
