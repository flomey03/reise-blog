/**
 * Deterministic fallback covers for posts without a featured image.
 *
 * The post id (its slug) is hashed with FNV-1a, so a given post always gets
 * the same motif and palette -- across builds, reorderings and deployments.
 */

export type CoverMotif = "contours" | "trail" | "waves" | "sunrise" | "compass";

const MOTIFS: CoverMotif[] = [
	"contours",
	"trail",
	"waves",
	"sunrise",
	"compass",
];

const PALETTE_COUNT = 4;

export interface CoverStyle {
	motif: CoverMotif;
	palette: number;
}

export function getCoverStyle(seed: string): CoverStyle {
	let hash = 2166136261;

	for (let i = 0; i < seed.length; i++) {
		hash ^= seed.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}

	// Avalanche the low bits so neighbouring slugs don't cluster on one motif.
	hash ^= hash >>> 15;
	hash = Math.imul(hash, 2246822507);
	hash ^= hash >>> 13;
	hash >>>= 0; // keep modulo results non-negative

	return {
		motif: MOTIFS[hash % MOTIFS.length]!,
		palette: (hash >>> 5) % PALETTE_COUNT,
	};
}
