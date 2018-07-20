import React from "react";
import { Elements, Stripe, StripeProvider } from "react-stripe-elements";
import UserData from "../../UserData";

interface Props {}

interface State {
	stripe: Stripe;
}

export default class StripeElementsProvider extends React.Component<
	Props,
	State
> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			stripe: (window as any).Stripe
				? (window as any).Stripe(UserData.getStripePublicKey())
				: null,
		};
	}

	public componentDidMount(): void {
		if (document.getElementById("stripe-js")) {
			return;
		}
		const script = document.createElement("script");
		script.id = "stripe-js";
		script.src = "https://js.stripe.com/v3/";
		script.async = true;
		script.onload = () =>
			this.setState({
				stripe: (window as any).Stripe(UserData.getStripePublicKey()),
			});
		document.head.appendChild(script);
	}

	public render(): React.ReactNode {
		// If locale is unsupported, Stripe automatically falls back to browser locale.
		const locale = UserData.getLocale();
		return (
			<StripeProvider stripe={this.state.stripe}>
				<Elements locale={locale}>{this.props.children}</Elements>
			</StripeProvider>
		);
	}
}
