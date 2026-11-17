/**
 * German dictionary.
 *
 * Every UI string in the site lives here. Established anglicisms and keywords
 * (Timeline, Map, Categories, Login, Blog, Tags, Powered by, Admin, ...) are
 * kept in English on purpose; everything else is German with a warm, personal
 * tone — the same voice as the sign-in intro.
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
		allPosts: "Alle Beiträge",
		browseAllPosts: "Schau dir alle Beiträge an",
		backToFirstPage: "Zurück zum Anfang",
		firstPage: "Zum Anfang",
		noMorePosts: "Du hast alles gesehen",
		untitled: "Ohne Titel",
		signIn: "Login",
		signOut: "Logout",
		search: "Suche",
		searchPosts: "Beiträge durchsuchen",
		tags: "Tags",
		readArticle: "Beitrag lesen",
		continueReading: "Weiterlesen",
		published: "Veröffentlicht",
		readingTime: "Lesezeit",
		minRead: (minutes: number) => `${minutes} Min. Lesezeit`,
		minutes: (minutes: number) => `${minutes} Min.`,
		author: (count: number) => (count === 1 ? "Autor" : "Autoren"),
		postsCount: (count: number) => `${count} ${count === 1 ? "Beitrag" : "Beiträge"}`,
		placesCount: (count: number) => `${count} ${count === 1 ? "Ort" : "Orte"}`,
	},
	base: {
		main: "Hauptinhalt",
		site: "Website",
		admin: "Admin",
		navigate: "Navigation",
		colorTheme: "Farbschema",
		light: "Hell",
		dark: "Dunkel",
		system: "System",
		poweredBy: "Powered by",
		skipToContent: "Zum Inhalt springen",
	},
	home: {
		eyebrow: "Blog",
		noPosts: "Hier ist noch nichts zu lesen",
		noPostsLead: "Hier ist noch Platz für deinen ersten Beitrag.",
		createPost: "Ersten Beitrag schreiben",
		latestPosts: "Neueste Beiträge",
		viewAll: "Alle Beiträge",
		viewAllHidden: " ansehen",
	},
	postsIndex: {
		title: "Alle Beiträge",
		description: "Alle Blogbeiträge auf einen Blick",
		eyebrow: "Archiv",
		lead: "Hier findest du alle Beiträge – die neuesten zuerst.",
		noPosts: "Hier ist noch nichts zu lesen",
		noPostsLead: "Sobald ein Beitrag veröffentlicht ist, taucht er hier auf.",
		end: "Du bist am Ende des Archivs angekommen.",
	},
	post: {
		onThisPage: "Auf dieser Seite",
		discussion: "Diskussion",
		moreFromBlogHidden: "Weitere Beiträge im Blog",
	},
	search: {
		title: (query: string) => (query ? `Suche: ${query}` : "Suche"),
		description: "Blogbeiträge durchsuchen",
		eyebrow: "Suche",
		question: "Wonach suchst du?",
		postsLabel: "Beiträge",
		hint: "Wir durchsuchen Titel und den ganzen Text. Du weißt nicht, wo du anfangen sollst?",
		count: (amount: number, hasMore: boolean) =>
			hasMore ? `Top ${amount} Ergebnisse` : `${amount} ${amount === 1 ? "Ergebnis" : "Ergebnisse"}`,
		forQuery: "für",
		noResults: (query: string) => `Leider nichts gefunden für „${query}“`,
		noResultsLead:
			"Vielleicht mit anderer Schreibweise oder weniger Worten? Du kannst auch einfach durch alle Beiträge stöbern.",
	},
	category: {
		title: (label: string) => `${label} Beiträge`,
		description: (label: string) => `Alle Beiträge in ${label}`,
		eyebrow: "Kategorie",
		fallbackDescription: (label: string) => `Beiträge in ${label}, die neuesten zuerst.`,
		emptyTitle: "Hier ist noch nichts",
		emptyLead: (label: string) => `Zu ${label} gibt es noch keine Beiträge.`,
		endLead: "Mehr gibt es in dieser Kategorie nicht.",
	},
	tag: {
		title: (label: string) => `Beiträge mit „${label}“`,
		description: (label: string) => `Alle Beiträge mit dem Tag ${label}`,
		eyebrow: "Tag",
		fallbackDescription: (label: string) => `Beiträge mit ${label}, die neuesten zuerst.`,
		emptyTitle: "Hier ist noch nichts",
		emptyLead: (label: string) => `Mit ${label} sind noch keine Beiträge versehen.`,
		endLead: "Mehr gibt es mit diesem Tag nicht.",
	},
	categories: {
		title: "Categories",
		description: "Alle Kategorien und ihre Beiträge.",
		eyebrow: "Stöbern",
		lead: "Jedes Thema mit veröffentlichten Beiträgen.",
		empty: "Noch keine Kategorien mit Beiträgen.",
	},
	login: {
		title: "Login",
		description: "Melde dich an, um alle Beiträge zu lesen.",
		eyebrow: "Mitglieder",
		lead: "Schön, dass du bei unserem Reiseblog vorbeischaust!! Bitte gib hier deine Email an, dann schicken wir dir einen Zugangslink :)",
		signedIn: "Angemeldet",
		signedInAs: "Du bist angemeldet als",
		backToSite: "Zurück zur Website",
		manageMembers: "Mitglieder verwalten",
		memberOnly: "Dieser Bereich ist nur für Mitglieder. Melde dich an, dann geht's weiter.",
		linkExpired: "Der Link ist abgelaufen oder wurde schon benutzt. Hol dir einfach einen neuen.",
		button: "Anmeldelink schicken",
		success:
			"Wenn deine Adresse dabei ist, ist der Link schon unterwegs. Schau in dein Postfach – und falls nichts da ist, auch in den Spam-Ordner.",
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
		title: "Kein Zugriff",
		description: "Dieser Beitrag ist für eine andere Gruppe.",
		eyebrow: "Kein Zugriff",
		heading: "Dieser Beitrag ist für eine andere Gruppe",
		lead: "Du bist angemeldet, aber nicht in der Gruppe, für die dieser Beitrag gedacht ist. Wenn du dazu dazugehören möchtest, sag einfach Bescheid.",
		readOther: "Andere Beiträge lesen",
	},
	notFound: {
		title: "Seite nicht gefunden",
		code: "Fehler 404",
		heading: "Seite nicht gefunden",
		lead: "Die Seite, die du suchst, gibt es nicht mehr oder sie ist umgezogen.",
		goHome: "Zurück zur Startseite",
		browsePosts: "Beiträge stöbern",
		searchPlaceholder: "Oder Beiträge suchen",
	},
	timeline: {
		title: "Timeline",
		description: "Alle Beiträge der Reihe nach – von alt nach neu, nach Kategorie sortiert.",
		eyebrow: "Reise",
		lead: "Alle Beiträge der Reihe nach – von alt nach neu, nach Kategorie sortiert.",
		uncategorised: "Ohne Kategorie",
		membersOnly: "Die Timeline ist nur für Mitglieder.",
		signInToSee: "um sie zu sehen.",
		onlyThisCategory: "Nur diese Kategorie",
	},
	map: {
		title: "Map",
		description: "Alle Beiträge mit Koordinaten auf einer Karte.",
		eyebrow: "Stöbern",
		heading: "Map",
		lead: "Jeder Beitrag mit einem Ort wird zu einem Pin. Klick drauf und der Beitrag geht auf.",
		empty: "Noch kein Beitrag hat Koordinaten.",
		membersOnly: "Die Map ist nur für Mitglieder.",
		signInToSee: "um die Orte zu sehen.",
		withoutLocation: (count: number) =>
			`${count} ${count === 1 ? "Beitrag hat" : "Beiträge haben"} noch keinen Ort — trag Breiten- und Längengrad im Editor nach.`,
		ariaLabel: "Karte der Beiträge",
	},
	pagination: {
		label: "Seitennavigation",
		first: "Erste Seite",
		next: "Nächste Seite",
	},
	authForm: {
		empty: "Bitte gib eine E-Mail-Adresse ein.",
		error: "Das hat nicht geklappt. Versuch es gleich noch einmal.",
		label: "E-Mail-Adresse",
		placeholder: "du@beispiel.de",
	},
	loginEmail: {
		subject: (siteName: string) => `Dein Anmeldelink für ${siteName}`,
		text: (url: string) =>
			`Hallo! Hier ist dein Link für die Anmeldung:\n\n${url}\n\nDer Link ist 15 Minuten gültig und funktioniert nur einmal. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.`,
		html: (url: string) =>
			`<p>Hallo! Hier ist dein Link für die Anmeldung:</p><p><a href="${url}">Anmelden</a></p><p>Der Link ist 15 Minuten gültig und funktioniert nur einmal. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail einfach ignorieren.</p>`,
	},
} as const;
