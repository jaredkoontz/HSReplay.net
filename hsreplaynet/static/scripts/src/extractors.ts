import { Archetype, ArchetypeSignature } from "./utils/api";

export function extractSignature(
	data: Archetype,
	gameType: string,
): { signature: ArchetypeSignature } {
	const signature =
		gameType === "RANKED_WILD"
			? data.wild_signature
			: data.standard_signature;
	if (signature) {
		return { signature };
	}
}
