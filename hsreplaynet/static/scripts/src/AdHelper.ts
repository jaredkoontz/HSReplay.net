import UserData from "./UserData";

export function debugAds(): boolean {
	return UserData.hasFeature("ads-debug");
}

export function showAds(): boolean {
	// always render ads if in debug mode
	if (debugAds()) {
		return true;
	}
	// do not render for users outside of feature group
	if (!UserData.hasFeature("ads")) {
		return false;
	}

	// do not render for Premium users
	if (UserData.isPremium()) {
		return false;
	}

	return true;
}

export default class AdHelper {
	private static _enabledAds: string[] | null = null;

	static create() {
		if (this._enabledAds === null) {
			this._enabledAds = Object.assign([], window["_ads"]);
		}
	}

	static isAdEnabled(adId: string, ignoreDebug?: boolean): boolean {
		if (!ignoreDebug && debugAds()) {
			return true;
		}
		return this._enabledAds && this._enabledAds.indexOf(adId) !== -1;
	}
}
