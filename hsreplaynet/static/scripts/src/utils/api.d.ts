import {
	BnetGameType,
	BnetRegion,
	CardClass,
	FormatType,
} from "../hearthstone";
import { Region } from "../interfaces";

/**
 * Model pagination
 */
export interface Paginated<T> {
	count: number;
	next: string | null;
	previous: string | null;
	results: T;
}

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
	_has_connected_hdt?: boolean;
}

interface BlizzardAccount {
	battletag: string;
	account_hi: number; // number exceeds IEEE 64-bit - see HearthSim/HSReplay.net#651
	account_lo: number;
	region: BnetRegion;
}

/**
 * {@link /api/v1/features/}
 */
export interface Feature {
	name: string;
	status:
		| "OFF"
		| "STAFF_ONLY"
		| "AUTHORIZED_ONLY"
		| "LOGGED_IN_USERS"
		| "PUBLIC";
	description: string;
	enabled_for_user: boolean;
}

export interface Features extends Paginated<Feature[]> {}

/**
 * {@link /api/v1/collection/}
 */
export interface Collection {
	cardbacks: number[];
	collection: { [dbfId: string]: [number, number] };
	dust: number;
	gold: number;
	heroes: { [dbfId: number]: [number, number] };
}

/**
 * {@link /api/v1/archetypes/:number/}
 */
export interface Archetype {
	id: number;
	name: string;
	player_class: CardClass | number;
	player_class_name: keyof typeof CardClass | string; // drop string eventually
	standard_signature?: ArchetypeSignature;
	standard_ccp_signature_core?: ArchetypeSignatureCore;
	wild_signature?: ArchetypeSignature;
	wild_ccp_signature_core?: ArchetypeSignatureCore;
	url: string;
}

export interface ArchetypeSignature {
	components: [number, number][];
	as_of: Date;
	format: FormatType;
}

export interface ArchetypeSignatureCore {
	components: number[];
	as_of: Date;
	format: FormatType;
}

/**
 * {@link /live/streaming-now/}
 */
export interface Stream {
	deck: number[];
	hero: number;
	format: number;
	rank: number;
	legend_rank: 0 | number;
	game_type: BnetGameType;
	twitch: {
		_id: number;
		name: string;
		display_name: string;
	};
}

/**
 * {@link /analytics/meta/preview/}
 */
export interface MetaPreview {
	rank: number;
	region: Region;
	data: {
		archetype_id: number;
		pct_of_class: number;
		pct_of_total: number;
		total_games: number;
		win_rate: number;
	};
	as_of: string;
}
