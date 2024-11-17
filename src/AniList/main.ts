// TODO: Fix TypeScript errors
// TODO: Fix ESLint errors
import {
  BasicRateLimiter,
  ContentRating,
  DiscoverSection,
  DiscoverSectionItem,
  DiscoverSectionProviding,
  DiscoverSectionType,
  Extension,
  Form,
  MangaProviding,
  PagedResults,
  PaperbackInterceptor,
  Request,
  Response,
  SearchQuery,
  SearchResultItem,
  SettingsFormProviding,
  SourceManga,
  Tag,
  TagSection,
} from "@paperback/types";
import {
  CountryCode,
  discoverSectionQuery,
  DiscoverSectionQueryVariables,
  MediaSort,
  searchQuery,
  SearchQueryVariables,
  titleViewQuery,
  TitleViewQueryVariables,
} from "./GraphQLQueries";
import { SettingsForm } from "./SettingsForm";

const GRAPHQL_ENDPOINT = "https://graphql.anilist.co";

type AniListImplementation = Extension &
  DiscoverSectionProviding &
  MangaProviding &
  SettingsFormProviding;

class AniListInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return data;
  }
}

export class AniListExtension implements AniListImplementation {
  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 15,
    bufferInterval: 10,
    ignoreImages: true,
  });

  mainInterceptor = new AniListInterceptor("main");

  async initialise(): Promise<void> {
    this.mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }

  async getSettingsForm(): Promise<Form> {
    return new SettingsForm();
  }

  async getSearchResults(
    query: SearchQuery,
    metadata?: number,
  ): Promise<PagedResults<SearchResultItem>> {
    const variables: SearchQueryVariables = {
      page: metadata ?? 1,
      search: query.title,
    };

    return await this.getItems<SearchQueryVariables, SearchResultItem>(
      searchQuery,
      variables,
      metadata,
      query.title,
    );
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const trending_now: DiscoverSection = {
      id: "trending-now",
      title: "Trending Now",
      type: DiscoverSectionType.prominentCarousel,
    };

    const all_time_popular: DiscoverSection = {
      id: "all-time-popular",
      title: "All Time Popular",
      type: DiscoverSectionType.simpleCarousel,
    };

    const popular_manga: DiscoverSection = {
      id: "popular-manga",
      title: "Popular Manga",
      type: DiscoverSectionType.simpleCarousel,
    };

    const popular_manhwa: DiscoverSection = {
      id: "popular-manhwa",
      title: "Popular Manhwa",
      type: DiscoverSectionType.simpleCarousel,
    };

    const top_100_manga: DiscoverSection = {
      id: "top-100-manga",
      title: "Top 100 Manga",
      type: DiscoverSectionType.simpleCarousel,
    };

    return [
      trending_now,
      all_time_popular,
      popular_manga,
      popular_manhwa,
      top_100_manga,
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: number | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let sort: string;
    let countryOfOrigin: string | undefined;
    switch (section.id) {
      case "trending-now":
        sort = MediaSort.TRENDING_DESC;
        break;
      case "all-time-popular":
        sort = MediaSort.POPULARITY_DESC;
        break;
      case "popular-manga":
        sort = MediaSort.POPULARITY_DESC;
        countryOfOrigin = CountryCode.JP;
        break;
      case "popular-manhwa":
        sort = MediaSort.POPULARITY_DESC;
        countryOfOrigin = CountryCode.KR;
        break;
      case "top-100-manga":
        sort = MediaSort.SCORE_DESC;
        break;
    }

    const variables: DiscoverSectionQueryVariables = {
      page: metadata ?? 1,
      sort: [sort!],
      countryOfOrigin: countryOfOrigin,
    };

    return await this.getItems<
      DiscoverSectionQueryVariables,
      DiscoverSectionItem
    >(discoverSectionQuery, variables, metadata, section);
  }

  async getItems<queryVariablesType, resultItemsType>(
    query: string,
    queryVariables: queryVariablesType,
    metadata: number | undefined,
    search: string | DiscoverSection,
  ): Promise<PagedResults<resultItemsType>> {
    const items: resultItemsType[] = [];

    const json = await this.makeRequest<queryVariablesType>(
      query,
      queryVariables,
      search,
    );
    // @ts-ignore
    const searchResults = json.data.Page.media;

    for (const searchResult of searchResults) {
      items.push({
        mangaId: searchResult.id!.toString(),
        title:
          searchResult.title.userPreferred ??
          searchResult.title.english ??
          searchResult.title.native ??
          "No Title",
        imageUrl: searchResult.coverImage.large,
      } as resultItemsType);
    }

    // @ts-ignore
    metadata = json.data.Page.pageInfo.hasNextPage
      ? (metadata ?? 1) + 1
      : undefined;

    return {
      items,
      metadata,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const variables: TitleViewQueryVariables = {
      id: +mangaId,
    };
    const json = await this.makeRequest<TitleViewQueryVariables>(
      titleViewQuery,
      variables,
    );

    // @ts-ignore
    const mangaDetails = json.data.Media;

    const thumbnailUrl = mangaDetails.coverImage.extraLarge;
    const synopsis = mangaDetails.description
      ? mangaDetails.description.replace(/<br>|<i>|<\/i>|<a.*?>|<\/a>/g, "")
      : "No description";
    const secondaryTitles = [
      mangaDetails.title.romaji ?? "No Romaji Title",
      mangaDetails.title.english ?? "No English Title",
      mangaDetails.title.native ?? "No Native Title",
    ];
    const primaryTitle =
      mangaDetails.title.userPreferred ??
      secondaryTitles.find((e) => e !== undefined) ??
      "No Title";
    let status;
    switch (mangaDetails.status) {
      case "FINISHED":
        status = "Finished";
        break;
      case "NOT_YET_RELEASING":
        status = "Not Yet Released";
        break;
      case "CANCELLED":
        status = "Canceled";
        break;
      case "HIATUS":
        status = "Hiatus";
        break;
      default:
        status = "Releasing";
    }
    let author;
    let artist;
    let exitLoop;
    for (const staff of mangaDetails.staff.edges) {
      switch (staff.role) {
        case staff.role.startsWith("Story & Art"):
          artist = undefined;
          exitLoop = true;
        case staff.role.startsWith("Story") && !author:
        case staff.role.startsWith("Original Story") && !author:
          author = staff.node.name.full;
          break;
        case staff.role.startsWith("Art"):
          artist = staff.node.name.full;
          break;
        default:
          break;
      }
      if ((author && artist) || exitLoop) break;
    }
    const bannerUrl = mangaDetails.bannerImage;
    const rating = mangaDetails.averageScore
      ? mangaDetails.averageScore / 100
      : undefined;
    const genres: Tag[] = [];
    for (const genre of mangaDetails.genres) {
      genres.push({
        id: genre.replace(" ", "-").toLowerCase(),
        title: genre,
      });
    }
    const tags: Tag[] = [];
    for (const tag of mangaDetails.tags) {
      genres.push({
        id: tag.id!.toString(),
        title: tag.name,
      });
    }
    const tagGroups: TagSection[] = [
      { id: "genres", title: "Genres", tags: genres },
      { id: "tags", title: "Tags", tags: tags },
    ];
    const contentRating: ContentRating = mangaDetails.isAdult
      ? ContentRating.ADULT
      : genres.some((e) => e.id === "ecchi")
        ? ContentRating.MATURE
        : ContentRating.EVERYONE;
    const artworkUrls = [thumbnailUrl];

    return {
      mangaId: mangaId,
      mangaInfo: {
        thumbnailUrl,
        synopsis,
        primaryTitle,
        secondaryTitles,
        contentRating,
        status,
        artist,
        author,
        bannerUrl,
        rating,
        tagGroups,
        artworkUrls,
      },
    };
  }

  async makeRequest<QueryVariablesType>(
    query: string,
    QueryVariables: QueryVariablesType,
    search?: string | DiscoverSection,
  ): Promise<unknown> {
    const request = {
      url: GRAPHQL_ENDPOINT,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: query,
        variables: QueryVariables,
      }),
    };

    const [_, buffer] = await Application.scheduleRequest(request);
    const data = Application.arrayBufferToUTF8String(buffer);
    const json: unknown = JSON.parse(data);
    if (json == undefined) {
      throw new Error(
        `Failed to parse JSON for the ${
          typeof search === undefined
            ? "title"
            : typeof search === "string"
              ? 'given search "' + search + '"'
              : "section " + search
        }: ${json}`,
      );
    } else if (
      typeof json === "object" &&
      json != null &&
      "errors" in json &&
      json.errors != null &&
      Array.isArray(json.errors)
    ) {
      for (const error of json.errors) {
        if (
          typeof error === "object" &&
          error != null &&
          "status" in error &&
          error.status != null &&
          "message" in error &&
          error.message != null
        ) {
          throw new Error(
            `AniList returned an error: [${error.status}] ${error.message}`,
          );
        }
      }
    }

    return json;
  }
}

export const AniList = new AniListExtension();
