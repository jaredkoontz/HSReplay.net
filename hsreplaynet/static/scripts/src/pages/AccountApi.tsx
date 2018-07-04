import React from "react";
import { InjectedTranslateProps, Trans, translate } from "react-i18next";
import CSRFElement from "../components/CSRFElement";
import SemanticAge from "../components/text/SemanticAge";

interface Application {
	client_id: string;
	description: string;
	homepage: string;
	id: number;
	name: string;
	token_count?: number;
	update_url?: string;
}

interface AccessToken {
	application: Application;
	created: string;
	last_used: string;
	scopes: Map<string, string>;
	token: string;
}

interface Props extends InjectedTranslateProps {
	accessTokens: AccessToken[];
	applications: Application[];
	urls: Map<string, string>;
}

interface State {}

class AccountApi extends React.Component<Props, State> {
	constructor(props: Props, context?: any) {
		super(props, context);
		this.state = {
			canceling: false,
		};
	}
	public render(): React.ReactNode {
		const { accessTokens, applications, t, urls } = this.props;

		return (
			<>
				<section
					id="oauth2-authorized-applications"
					className="box-section"
				>
					<h3>{t("Authorized applications")}</h3>
					<div className="inner">
						{accessTokens ? (
							<>
								<p>
									{t(
										"These applications have access to your HSReplay.net account. They do not have access to your Blizzard account.",
									)}
								</p>
								<ul className="list-group list-group-no-margin">
									{accessTokens.map(accessToken => (
										<li className="list-group-item">
											<form
												method="POST"
												action={urls["revoke_access"]}
												onSubmit={e => {
													if (
														!confirm(
															t(
																"This application will no longer have any access to your account. Continue?",
															),
														)
													) {
														e.preventDefault();
													}
												}}
												className="pull-right"
											>
												<CSRFElement />
												<input
													type="hidden"
													name="token"
													value="{{ token.token }}"
												/>
												<button
													type="submit"
													className="btn btn-danger"
												>
													{t("Revoke access")}
												</button>
												<br />
											</form>

											<h4 className="list-group-item-heading">
												{accessToken.application.name}
											</h4>
											<div className="list-group-item-text">
												<Trans>
													Last used{" "}
													<SemanticAge
														date={
															accessToken.last_used
														}
													/>
												</Trans>
												<div
													className="collapse"
													style={{ display: "block" }}
												>
													<h5>{t("Permissions")}</h5>
													{accessToken.scopes ? (
														<>
															<p>
																{t(
																	"This application has the following permissions:",
																)}
															</p>
															<ul className="list-unstyled">
																{Object.keys(
																	accessToken.scopes,
																).map(scope => (
																	<li>
																		<strong>
																			✓
																		</strong>{" "}
																		{
																			accessToken
																				.scopes[
																				scope
																			]
																		}
																	</li>
																))}
															</ul>
														</>
													) : (
														<p>
															{t(
																"You have not granted any permissions to this application.",
															)}
														</p>
													)}

													<h5>
														{t(
															"About this application",
														)}
													</h5>
													<p>
														{
															accessToken
																.application
																.description
														}
														{" — "}
														<strong>
															<a
																href={
																	accessToken
																		.application
																		.homepage
																}
																target="_blank"
																rel="noopener"
															>
																<span className="glyphicon glyphicon-globe" />{" "}
																{t("Website")}
															</a>
														</strong>
													</p>
												</div>
											</div>
											<div className="clearfix" />
										</li>
									))}
								</ul>
							</>
						) : (
							<p>
								{t(
									"You have not given any application access to your account.",
								)}
							</p>
						)}
					</div>
				</section>
				<section
					id="account-oauth2-applications"
					className="box-section"
				>
					<h3>{t("Developer applications")}</h3>

					<div className="inner">
						{applications && applications.length ? (
							<table className="table table-bordered">
								<thead>
									<th>{t("Application")}</th>
									<th>{t("Homepage")}</th>
									<th>{t("Client ID")}</th>
									<th>{t("Users")}</th>
								</thead>

								<tbody>
									{applications.map(application => (
										<tr>
											<td>
												<a
													href={
														application.update_url
													}
												>
													{application.name}
												</a>
											</td>
											<td>
												<a href={application.homepage}>
													{application.homepage}
												</a>
											</td>
											<td>{application.client_id}</td>
											<td>{application.token_count}</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<p>
								<Trans
									defaults="Want to use our OAuth2 API in your own app? <0>Contact us</0> to apply for a token."
									components={[
										<a
											href={`mailto:${SITE_EMAIL}`}
											key={0}
										>
											0
										</a>,
									]}
								/>
							</p>
						)}
					</div>
				</section>
			</>
		);
	}
}

export default translate()(AccountApi);
