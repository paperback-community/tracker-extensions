// Discover section query

export const discoverSectionQuery = `
query ($page: Int, $sort: [MediaSort], $countryOfOrigin: CountryCode
) {
  Page (page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
    }
    media (sort: $sort, type: MANGA, countryOfOrigin: $countryOfOrigin) {
			id
      title {
        english
        native
				userPreferred
      }
      coverImage {
        large
      }
    }
  }
}
`;

export interface DiscoverSectionQueryVariables {
  page: number;
  sort: string[];
  countryOfOrigin: string | undefined;
}

export const MediaSort = {
  ID: "ID",
  ID_DESC: "ID_DESC",
  TITLE_ROMAJI: "TITLE_ROMAJI",
  TITLE_ROMAJI_DESC: "TITLE_ROMAJI_DESC",
  TITLE_ENGLISH: "TITLE_ENGLISH",
  TITLE_ENGLISH_DESC: "TITLE_ENGLISH_DESC",
  TITLE_NATIVE: "TITLE_NATIVE",
  TITLE_NATIVE_DESC: "TITLE_NATIVE_DESC",
  TYPE: "TYPE",
  TYPE_DESC: "TYPE_DESC",
  FORMAT: "FORMAT",
  FORMAT_DESC: "FORMAT_DESC",
  START_DATE: "START_DATE",
  START_DATE_DESC: "START_DATE_DESC",
  END_DATE: "END_DATE",
  END_DATE_DESC: "END_DATE_DESC",
  SCORE: "SCORE",
  SCORE_DESC: "SCORE_DESC",
  POPULARITY: "POPULARITY",
  POPULARITY_DESC: "POPULARITY_DESC",
  TRENDING: "TRENDING",
  TRENDING_DESC: "TRENDING_DESC",
  EPISODES: "EPISODES",
  EPISODES_DESC: "EPISODES_DESC",
  DURATION: "DURATION",
  DURATION_DESC: "DURATION_DESC",
  STATUS: "STATUS",
  STATUS_DESC: "STATUS_DESC",
  CHAPTERS: "CHAPTERS",
  CHAPTERS_DESC: "CHAPTERS_DESC",
  VOLUMES: "VOLUMES",
  VOLUMES_DESC: "VOLUMES_DESC",
  UPDATED_AT: "UPDATED_AT",
  UPDATED_AT_DESC: "UPDATED_AT_DESC",
  SEARCH_MATCH: "SEARCH_MATCH",
  FAVOURITES: "FAVOURITES",
  FAVOURITES_DES: "FAVOURITES_DES",
};

export const CountryCode = {
  JP: "JP",
  KR: "KR",
  CN: "CN",
};

export const searchQuery = `
query ($page: Int, $search: String) {
  Page (page: $page, perPage: 50) {
    pageInfo {
      hasNextPage
    }
    media (search: $search, type: MANGA, isAdult: false) {
			id
      title {
				userPreferred
        english
        native
      }
      coverImage {
        large
      }
    }
  }
}
`;

// Search query

export interface SearchQueryVariables {
  page: number;
  search: string;
}

// Title view query

export const titleViewQuery = `
query($id: Int) {
	Media(id: $id) {
		title {
			english
			native
			romaji
			userPreferred
		}
		status
		description(asHtml: false)
		coverImage {
			extraLarge
		}
		bannerImage
		genres
		averageScore
		tags {
			id
			name
		}
		staff {
			edges {
				node {
					name {
						full
					}
				}
				role
			}
		}
		isAdult
	}
}
`;

export interface TitleViewQueryVariables {
  id: number;
}
