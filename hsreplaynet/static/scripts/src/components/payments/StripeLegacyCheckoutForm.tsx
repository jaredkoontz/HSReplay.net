import React from "react";
import { CardElement, injectStripe } from "react-stripe-elements";
import BtnGroup from "../BtnGroup";
import { CheckoutFormInstanceProps } from "./CheckoutForm";
import { StripePlan } from "./StripeElementsCheckoutForm";
import CheckoutProcess from "../../checkout/CheckoutProcess";
import UserData from "../../UserData";

const enum CheckoutStep {
	LOADING_STRIPE,
	READY_TO_CHECKOUT,
	CHECKOUT,
	SUBMIT
}

interface Props extends CheckoutFormInstanceProps {
	apiKey: string;
	coupon?: string;
	plans: StripePlan[];
	defaultSource?: string;
	image?: string;
}

interface State {
	useDefaultSource?: boolean;
	selectedPlan?: string;
	step?: CheckoutStep;
	token?: stripe.StripeTokenResponse;
}

export default class StripeLegacyCheckoutForm extends React.Component<
	Props,
	State
> {
	private form: HTMLFormElement;
	private handler: StripeCheckoutHandler;

	constructor(props: Props, context: any) {
		super(props, context);
		this.state = {
			selectedPlan: props.plans[0].stripeId,
			step: CheckoutStep.LOADING_STRIPE,
			useDefaultSource: !!this.props.defaultSource
		};
	}

	public componentDidMount(): void {
		let promise = null;

		if (typeof StripeCheckout !== "undefined") {
			promise = Promise.resolve();
		} else {
			promise = new Promise<void>((resolve, reject) => {
				const script = document.createElement("script");
				script.type = "text/javascript";
				script.src = "https://checkout.stripe.com/checkout.js";
				script.onload = () => resolve();
				script.onerror = () => reject();
				document.body.appendChild(script);
			});
		}
		promise.then(() => {
			this.handler = StripeCheckout.configure({
				key: this.props.apiKey,
				image: this.props.image,
				name: "HearthSim Premium",
				locale: "auto",
				panelLabel: "Subscribe for",
				email: UserData.getEmail(),
				allowRememberMe: false
			});
			this.setState({ step: CheckoutStep.READY_TO_CHECKOUT });
		});
	}

	getPlanButtons() {
		return this.props.plans.map((plan: StripePlan) => ({
			label: <h4>{plan.description}</h4>,
			value: plan.stripeId,
			className: "btn btn-default"
		}));
	}

	private static getButtonMessage(
		step: CheckoutStep,
		useDefaultSource?: boolean
	) {
		switch (step) {
			case CheckoutStep.LOADING_STRIPE:
				return "Loading…";
			case CheckoutStep.READY_TO_CHECKOUT:
				if (useDefaultSource) {
					return "Subscribe now";
				} else {
					return "Sign me up!";
				}
			case CheckoutStep.CHECKOUT:
				return "Waiting for payment";
			case CheckoutStep.SUBMIT:
				return "Confirming…";
		}
	}

	checkout(submit?: boolean) {
		if (this.state.step !== CheckoutStep.READY_TO_CHECKOUT) {
			return;
		}

		const useDefaultSource = this.state.useDefaultSource;

		if (submit && useDefaultSource) {
			this.submit();
			return;
		}

		this.setState({ step: CheckoutStep.CHECKOUT, useDefaultSource: false });

		const plan: StripePlan = this.props.plans.find(
			(plan: StripePlan) => plan.stripeId === this.state.selectedPlan
		);
		if (!plan) {
			// no valid plan selected
			console.error("No valid plan selected");
			return;
		}

		if (!this.handler) {
			// no checkout handler created
			console.error("No handler created");
			return;
		}

		const checkout = new CheckoutProcess(plan.stripeId, this.handler);
		checkout
			.checkout({
				amount: plan.amount,
				currency: plan.currency,
				description: plan.description
			})
			.then(token => this.submit(token))
			.catch(() =>
				this.setState({
					step: CheckoutStep.READY_TO_CHECKOUT,
					useDefaultSource
				})
			);
	}

	submit(token?: stripe.StripeTokenResponse) {
		this.setState({ step: CheckoutStep.SUBMIT, token: token }, () =>
			this.form.submit()
		);
	}

	public componentWillUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		nextContext: any
	): void {
		if (nextState.step !== this.state.step) {
			this.props.onDisable(
				nextState.step !== CheckoutStep.READY_TO_CHECKOUT &&
					nextState.step !== CheckoutStep.LOADING_STRIPE
			);
		}
	}

	renderCouponMessage() {
		if (!this.props.coupon) {
			return null;
		}

		return (
			<p className="alert alert-success">
				You have an active coupon for{" "}
				<strong>{this.props.coupon}</strong>.<br />
				This amount will be deducted from your purchase.
			</p>
		);
	}

	renderDefaultSource() {
		if (!this.state.useDefaultSource) {
			return null;
		}

		return (
			<p className="text-center">
				Using <strong>{this.props.defaultSource}</strong>
			</p>
		);
	}

	public render(): React.ReactNode {
		const disabled = this.state.step !== CheckoutStep.READY_TO_CHECKOUT;
		const canSelectPlan =
			!disabled || this.state.step === CheckoutStep.LOADING_STRIPE;

		return (
			<form
				className="text-center"
				method="post"
				action={this.props.submitUrl}
				ref={ref => (this.form = ref)}
				onSubmit={e => {
					e.preventDefault();
					this.checkout(true);
				}}
			>
				<div style={{ margin: "25px 0" }}>
					<label id="choose-plan">Choose your plan</label>
					<BtnGroup
						className="btn-group btn-group-flex"
						buttons={this.getPlanButtons()}
						name="plan"
						onChange={selectedPlan =>
							this.setState({ selectedPlan })
						}
						value={this.state.selectedPlan}
						aria-labelledby="choose-plan"
						disabled={!canSelectPlan}
						required
					/>
				</div>
				{this.renderCouponMessage()}
				<p>
					<button
						className="promo-button text-premium checkout-button"
						disabled={disabled}
					>
						{StripeLegacyCheckoutForm.getButtonMessage(
							this.state.step,
							this.state.useDefaultSource
						)}
					</button>
				</p>
				{this.renderDefaultSource()}
				{this.state.token
					? [
							<input
								type="hidden"
								name="stripeToken"
								value={this.state.token.id}
							/>,
							<input
								type="hidden"
								name="stripeEmail"
								value={(this.state.token as any).email}
							/>,
							<input
								type="hidden"
								name="stripeTokenType"
								value={this.state.token.type}
							/>
						]
					: null}
				<div dangerouslySetInnerHTML={this.props.csrfElement} />
			</form>
		);
	}
}
