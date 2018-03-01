import { distanceInWordsStrict, distanceInWordsToNow } from "date-fns";

export function getDuration(from: Date, to: Date): string {
	return distanceInWordsStrict(from, to);
}

/**
 * @deprecated Use SemanticAge component instead
 */
export function getAge(since: Date, noSuffix?: boolean): string {
	return distanceInWordsToNow(since, {
		addSuffix: !noSuffix,
	});
}
