import { BlizzardAccount } from "./api";
import { BnetRegion } from "../hearthstone";

export function getAccountKey(account: BlizzardAccount): string {
	return `${account.region}-${account.account_lo}`;
}

const REGION_NAMES = {
	[BnetRegion.REGION_US]: "Americas",
	[BnetRegion.REGION_EU]: "Europe",
	[BnetRegion.REGION_KR]: "Asia",
	[BnetRegion.REGION_CN]: "China",
	[BnetRegion.REGION_TW]: "Taiwan (Legacy)",
	[BnetRegion.REGION_PTR]: "Public Test Realm",
};

export function prettyBlizzardAccount(account: BlizzardAccount): string {
	const region = REGION_NAMES[account.region] || "Unknown region";
	return `${account.battletag} (${region})`;
}

export function addNextToUrl(url: string, next: string): string {
	if (!next) {
		return url;
	}
	const origin =
		document && document.location && document.location.origin
			? document.location.origin
			: "";
	const parsed = new URL(url, origin);
	const param = `next=${encodeURIComponent(next)}`;
	url += parsed.search ? `&${param}` : `?${param}`;
	return url;
}
