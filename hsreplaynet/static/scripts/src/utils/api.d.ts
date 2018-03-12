import { BnetRegion } from "../hearthstone";

/**
 * {@link /api/v1/account/}
 */
export interface Account {
	id: number;
	battletag: string;
	username: string;
	is_premium: boolean;
	blizzard_accounts: BlizzardAccount[];
	tokens: string[];
}

interface BlizzardAccount {
	battletag: string;
	account_hi: number; // number exceeds IEEE 64-bit - see HearthSim/HSReplay.net#651
	account_lo: number;
	region: BnetRegion;
}
