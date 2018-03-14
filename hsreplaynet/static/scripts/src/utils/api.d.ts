import {
	BnetGameType,
	BnetRegion,
	CardClass,
	FormatType,
} from "../hearthstone";

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
