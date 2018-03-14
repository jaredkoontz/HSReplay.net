import { BlizzardAccount } from "./api";

export function getAccountKey(account: BlizzardAccount): string {
	return `${account.region}-${account.account_lo}`;
}

export function prettyBlizzardAccount(account: BlizzardAccount): string {
	return account.battletag;
}
