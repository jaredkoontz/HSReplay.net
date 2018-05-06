import { BlizzardAccount } from "./api";

export function getAccountKey(account: BlizzardAccount): string {
	return `${account.region}-${account.account_lo}`;
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
