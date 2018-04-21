import React from "react";

export default class FAQ extends React.Component<null, null> {
	render(): React.ReactNode {
		return (
			<>
				<h2>Frequently Asked Questions</h2>
				<div className="col-lg-6 col-xs-12">
					<dl>
						<dt>Is signing in with Blizzard safe?</dt>
						<dd>
							We use the{" "}
							<a
								href="https://dev.battle.net/docs/read/log_in_with_blizzard#main"
								target="_blank"
								rel="noopener"
							>
								official Blizzard OAuth2 API
							</a>{" "}
							to let you sign in with your Blizzard account rather
							than create a new one. HSReplay.net never gains
							access to your email, password or anything other
							than your Battletag; it's completely secure!
						</dd>
						<dt>Do I need to sign in to upload replays?</dt>
						<dd>
							Not at all! Just{" "}
							<a href="/downloads/">
								download Hearthstone Deck Tracker
							</a>{" "}
							and use it to upload and share your replays. You may
							claim them later by clicking "Claim Account" in your
							deck tracker's settings.
						</dd>
						<dt>
							How do you know which cards opponents are holding in
							their hand?
						</dt>
						<dd>
							Once a card is played from hand we can deduce when
							that card was drawn, discovered or created in any
							other way.
						</dd>
					</dl>
				</div>
				<div className="col-lg-6 col-xs-12">
					<dl>
						<dt>How can I support what you're doing?</dt>
						<dd>
							You can support HearthSim, the team behind
							Hearthstone Deck Tracker, HSReplay.net and other
							tools by subscribing to{" "}
							<a href="/premium/" className="text-premium">
								<strong>HSReplay.net Premium</strong>
							</a>.
						</dd>
						<dt>
							Where can I get the latest news about HSReplay.net?
						</dt>
						<dd>
							You can find us on{" "}
							<a href="https://discord.gg/hearthsim">Discord</a>,{" "}
							follow us{" "}
							<a href="https://twitter.com/HSReplayNet">
								@HSReplayNet
							</a>{" "}
							and like our{" "}
							<a href="https://facebook.com/HSReplayNet">
								Facebook page
							</a>.
						</dd>
						<dt>
							I need help with the site, my replays, my
							subscription&hellip;
						</dt>
						<dd>
							Shoot us an{" "}
							<a href="mailto:contact@hsreplay.net">email</a>, or
							message us on{" "}
							<a href="https://twitter.com/HSReplayNet">
								Twitter
							</a>{" "}
							or{" "}
							<a href="https://facebook.com/HSReplay.net">
								Facebook
							</a>.
						</dd>
						<dt>I think I found a bug!</dt>
						<dd>
							Simply <a href="/contact/">contact us</a> or{" "}
							<a href="https://github.com/HearthSim/HSReplay.net/issues">
								open an issue on GitHub
							</a>.
						</dd>
					</dl>
				</div>
			</>
		);
	}
}
