import { cookie } from "cookie_js";
import Settings from "./Settings";
import { BlizzardAccount } from "./utils/api";

interface UserDataProps {
	accounts: Account[];
	battletag: string;
	card_art_url: string;
	groups: string[];
	is_authenticated: boolean;
	premium: boolean;
	debug: boolean;
	username: string;
	email: string;
	staff: boolean;
	hearthstone_locale: string;
	ipcountry: string;
	features: FeatureMap;
	login?: string[];
}

interface FeatureMap {
	[feature: string]: Feature;
}

interface Feature {
	enabled: boolean;
}

export interface Account extends BlizzardAccount {
	/** @deprecated use {@link account_lo} instead */
	lo: number;
	/** @deprecated use {@link prettyBlizzardAccount} instead */
	display: string;
}

function getUserDataAccountKey(account: Account) {
	return `${account.region}-${account.lo}`;
}

export default class UserData {
	private static _instance: UserDataProps = null;
	private static _settings = new Settings();

	static create() {
		if (this._instance === null) {
			this._instance = Object.assign({}, window["_userdata"]);
		}
	}

	static hasFeature(feature: string): boolean {
		return !!(
			this._instance &&
			this._instance.features &&
			this._instance.features[feature] &&
			this._instance.features[feature].enabled
		);
	}

	static isPremium(): boolean {
		return !!(this._instance && UserData._instance.premium);
	}

	static isAuthenticated(): boolean {
		return !!(this._instance && UserData._instance.is_authenticated);
	}

	static isStaff(): boolean {
		return !!(this._instance && UserData._instance.staff);
	}

	static isDebug(): boolean {
		return !!(this._instance && UserData._instance.debug);
	}

	static getUsername(): string | null {
		return this._instance ? UserData._instance.username : null;
	}

	static getEmail(): string | null {
		return this._instance ? UserData._instance.email : null;
	}

	static getHearthstoneLocale(): string | null {
		return this._instance ? UserData._instance.hearthstone_locale : null;
	}

	static getAccounts(): Account[] {
		if (!this._instance) {
			return [];
		}
		let accounts = UserData._instance.accounts || [];
		accounts = accounts.map(account => ({
			account_lo: account.account_lo || account.lo,
			lo: account.account_lo || account.lo,
			...account,
		}));
		return accounts;
	}

	static getDefaultAccountKey(): string {
		const accounts = this.getAccounts();
		if (accounts.length === 0) {
			return null;
		}

		let fromUrl = null;
		if (document && document.location && document.location.search) {
			const search = document.location.search.replace(/^\?/, "");
			const parts = search.split("&");
			for (const part of parts) {
				const param = part.split("=", 2);
				if (param.length === 2 && param[0] === "hearthstone_account") {
					fromUrl = param[1];
					break;
				}
			}
		}
		if (
			accounts.findIndex(x => getUserDataAccountKey(x) === fromUrl) !== -1
		) {
			this.setDefaultAccount(fromUrl);
			return fromUrl;
		}

		const fromCookie = cookie.get("default-account", null);
		if (
			accounts.findIndex(x => getUserDataAccountKey(x) === fromCookie) !==
			-1
		) {
			return fromCookie;
		}

		return getUserDataAccountKey(accounts[0]);
	}

	static setDefaultAccount(key: string): void {
		cookie.set("default-account", key, { path: "/", expires: 365 });
	}

	static getSetting(key: string): any {
		return this._settings.get(key);
	}

	static setSetting(key: string, value: any) {
		return this._settings.set(key, value);
	}

	static getIpCountry(): string | null {
		return this._instance ? UserData._instance.ipcountry : null;
	}

	static getLoginUrl(key?: string): string | null {
		if (!this._instance) {
			return null;
		}
		const urls = this._instance.login;
		key = key || "default";
		if (!urls || !urls[key]) {
			return null;
		}
		return urls[key];
	}
}
