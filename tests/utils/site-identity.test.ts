import { describe, expect, it } from "vitest";
import { resolveBlogSiteIdentity } from "../../src/utils/site-identity";

describe("resolveBlogSiteIdentity", () => {
	it("uses defaults without settings", () => {
		expect(resolveBlogSiteIdentity()).toEqual({
			siteTitle: "My Blog",
			siteTagline: "Thoughts, stories, and ideas.",
			siteLogo: null,
		});
	});

	it("uses configured values and ignores a logo without a url", () => {
		expect(
			resolveBlogSiteIdentity({
				title: "Reiseblog",
				tagline: "Unterwegs",
				logo: { mediaId: "media-1", alt: "Logo" },
			}),
		).toEqual({
			siteTitle: "Reiseblog",
			siteTagline: "Unterwegs",
			siteLogo: null,
		});
	});
});
