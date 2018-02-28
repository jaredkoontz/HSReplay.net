import { ApiArchetype, ApiArchetypeSignature } from "./interfaces";

export function extractSignature(
	data: ApiArchetype,
	gameType: string,
): { signature: ApiArchetypeSignature } {
	const signature =
		gameType === "RANKED_WILD"
			? data.wild_signature
			: data.standard_signature;
	if (signature) {
		return { signature };
	}
}
