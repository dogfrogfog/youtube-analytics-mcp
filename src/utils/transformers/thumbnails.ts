export interface Thumbnail {
  url: string;
}

export interface Thumbnails {
  default?: Thumbnail;
  medium?: Thumbnail;
  high?: Thumbnail;
  standard?: Thumbnail;
  maxres?: Thumbnail;
}

export interface RegionRestriction {
  allowed?: string[];
  blocked?: string[];
}

export function transformThumbnails(thumbnails: any, includeHighRes: boolean = false): Thumbnails {
  const result: Thumbnails = {
    default: thumbnails?.default?.url ? { url: thumbnails.default.url } : undefined,
    medium: thumbnails?.medium?.url ? { url: thumbnails.medium.url } : undefined,
    high: thumbnails?.high?.url ? { url: thumbnails.high.url } : undefined
  };
  
  if (includeHighRes) {
    result.standard = thumbnails?.standard?.url ? { url: thumbnails.standard.url } : undefined;
    result.maxres = thumbnails?.maxres?.url ? { url: thumbnails.maxres.url } : undefined;
  }
  
  return result;
}

export function transformVideoThumbnails(thumbnails: any): Thumbnails {
  return transformThumbnails(thumbnails, true);
}

export function transformSearchThumbnails(thumbnails: any): Thumbnails {
  return transformThumbnails(thumbnails, false);
}

export function transformRegionRestriction(restriction: any): RegionRestriction | undefined {
  if (!restriction) return undefined;
  return {
    allowed: restriction.allowed || undefined,
    blocked: restriction.blocked || undefined
  };
}