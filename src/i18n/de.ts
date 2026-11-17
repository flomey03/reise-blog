/**
 * German source dictionary.
 *
 * Every UI string in the site lives here exactly as it appears today. Nothing
 * is translated in this step — the German and English texts are copied over
 * verbatim so the refactor is invisible to visitors. Translation happens later.
 *
 * Adding another language means copying this file and translating the values.
 * The `Translations` type in ./index.ts is derived from this object, so a
 * missing or misspelled key in a future dictionary fails `astro check`.
 *
 * Strings that contain markup are split into their text parts; the markup
 * stays in the template. Interpolations are functions so the call sites read
 * naturally and the parameter types are checked.
 */
export const de = {
	common: {
		allPosts: "All posts",
		browseAllPosts: "Browse all posts",
		backToFirstPage: "Back to the first page",
		firstPage: "First page",
		noMorePosts: "No more posts",
		untitled: "Untitled",
		signIn: "Sign in",
		signOut: "Sign out",
		search: "Search",
		searchPosts: "Search posts",
		tags: "Tags",
		readArticle: "Read article",
		continueReading: "Continue reading",
		published: "Published",
		readingTime: "Reading time",
		minRead: (minutes: number) => `${minutes} min read`,
		minutes: (minutes: number) => `${minutes} min`,
		author: (count: number) => (count === 1 ? "Author" : "Authors"),
		postsCount: (count: number) => `${count} ${count === 1 ? " post" : " posts"}`,
		placesCount: (count: number) => `${count} ${count === 1 ? " place" : " places"}`,
	},
	base: {
		main: "Main",
		site: "Site",
		admin: "Admin",
		navigate: "Navigate",
		colorTheme: "Color theme",
		light: "Light",
		dark: "Dark",
		system: "System",
		poweredBy: "Powered by",
	},
	home: {
		eyebrow: "Blog",
		noPosts: "No posts yet",
		noPostsLead: "Create your first post in the admin panel.",
		createPost: "Create a post",
		latestPosts: "Latest posts",
		viewAll: "View all",
		viewAllHidden: " posts",
	},
	postsIndex: {
		title: "All Posts",
		description: "Browse all blog posts",
		eyebrow: "Archive",
		lead: "Every post, newest first.",
		noPosts: "No posts yet",
		noPostsLead: "Published posts will show up here.",
		end: "You have reached the end of the archive.",
	},
	post: {
		onThisPage: "On this page",
		discussion: "Discussion",
		moreFromBlogHidden: "More from the blog",
	},
	search: {
		title: (query: string) => (query ? `Search: ${query}` : "Search"),
		description: "Search blog posts",
		eyebrow: "Search",
		question: "What are you looking for?",
		postsLabel: "Posts",
		hint: "Searches post titles and full text. Not sure where to start?",
		count: (amount: number, hasMore: boolean) =>
			hasMore ? `Top ${amount} results` : `${amount} ${amount === 1 ? "result" : "results"}`,
		forQuery: "for",
		noResults: (query: string) => `No results for “${query}”`,
		noResultsLead:
			"Check the spelling, try fewer or different words, or browse every post instead.",
	},
	category: {
		title: (label: string) => `${label} posts`,
		description: (label: string) => `All posts in ${label}`,
		eyebrow: "Category",
		fallbackDescription: (label: string) => `Posts filed under ${label}, newest first.`,
		emptyTitle: "Nothing here yet",
		emptyLead: (label: string) => `No posts have been filed under ${label} so far.`,
		endLead: "This page is past the last post.",
	},
	tag: {
		title: (label: string) => `Posts tagged "${label}"`,
		description: (label: string) => `All posts tagged with ${label}`,
		eyebrow: "Tag",
		fallbackDescription: (label: string) => `Posts tagged ${label}, newest first.`,
		emptyTitle: "Nothing here yet",
		emptyLead: (label: string) => `No posts have been tagged ${label} so far.`,
		endLead: "This page is past the last post.",
	},
	categories: {
		title: "Categories",
		description: "Every category and its posts.",
		eyebrow: "Browse",
		lead: "Every topic with published posts.",
		empty: "No categories with posts yet.",
	},
	login: {
		title: "Sign in",
		description: "Sign in to read every post.",
		eyebrow: "Members",
		lead: "Schön, dass du bei unserem Reiseblog vorbeischaust!! Bitte gib hier deine Email an, dann schicken wir dir einen Zugangslink :)",
		signedIn: "Signed in",
		signedInAs: "You are signed in as",
		backToSite: "Back to the site",
		manageMembers: "Manage members",
		memberOnly: "This area is for members. Sign in to continue.",
		linkExpired: "This link has expired or was already used. Request a new one.",
		button: "Send sign-in link",
		success:
			"If your address can sign in, the link is on its way. Check your inbox (and spam folder).",
	},
	loginConfirm: {
		title: "Anmelden",
		description: "Anmeldelink bestätigen.",
		eyebrow: "Mitglieder",
		heading: "Fast geschafft",
		lead: "Ein Klick und du bist angemeldet. Der Link funktioniert einmal.",
		remember: "Angemeldet bleiben (30 Tage)",
		rememberHint: "Ohne Haken gilt die Anmeldung nur für diese Browsersitzung.",
		button: "Jetzt anmelden",
		expired: "Link abgelaufen?",
		requestNew: "Neuen anfordern",
	},
	noAccess: {
		title: "No access",
		description: "This post is for a different group.",
		eyebrow: "No access",
		heading: "This post is for a different group",
		lead: "You are signed in, but not in the group this post is meant for. Ask me if you need access.",
		readOther: "Read other posts",
	},
	notFound: {
		title: "Page not found",
		code: "Error 404",
		heading: "Page not found",
		lead: "The page you’re looking for doesn’t exist or may have moved.",
		goHome: "Go home",
		browsePosts: "Browse posts",
		searchPlaceholder: "Or search posts",
	},
	timeline: {
		title: "Timeline",
		description: "Every post in chronological order, grouped by category.",
		eyebrow: "Journey",
		lead: "Every post in chronological order, grouped by category.",
		uncategorised: "Uncategorised",
		membersOnly: "The timeline is for members.",
		signInToSee: "to see it.",
		onlyThisCategory: "Only this category",
	},
	map: {
		title: "Map",
		description: "Every post with coordinates on one map.",
		eyebrow: "Browse",
		heading: "Map",
		lead: "Every post with a place becomes a pin. Click a pin to open the post.",
		empty: "No post has coordinates yet.",
		membersOnly: "The map is for members.",
		signInToSee: "to see the places.",
		withoutLocation: (count: number) =>
			`${count} posts have no place yet — add latitude and longitude in the post editor.`,
		ariaLabel: "Map of posts",
	},
	pagination: {
		label: "Pagination",
		first: "First page",
		next: "Next page",
	},
	authForm: {
		empty: "Enter an email address.",
		error: "That did not work. Please try again in a moment.",
		label: "Email address",
		placeholder: "you@example.com",
	},
	loginEmail: {
		subject: (siteName: string) => `Sign in to ${siteName}`,
		text: (url: string) =>
			`Open this link to sign in:\n\n${url}\n\nThe link is valid for 15 minutes and can be used once. If you did not request it, ignore this email.`,
		html: (url: string) =>
			`<p>Open this link to sign in:</p><p><a href="${url}">Sign in</a></p><p>The link is valid for 15 minutes and can be used once. If you did not request it, ignore this email.</p>`,
	},
} as const;
