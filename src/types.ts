export type MediaType = "photo" | "video";

export interface MediaItem {
  id: string;
  url: string;
  type: MediaType;
  thumbnailUrl: string | null;
  company: number;
  author: string;
  caption: string;
  createdAt: string;
  likes: number;
  isDemo: boolean;
}

export interface PlatformStats {
  trainees: number;
  companies: number;
  media: number;
  photos: number;
  videos: number;
}

export interface PlatformConfig {
  uploadCodeRequired: boolean;
  maxFileMb: number;
  maxFiles: number;
}

export interface Company {
  id: number;
  number: string;
  name: string;
  motto: string;
  summary: string;
  image: string;
  accent: string;
  members: number;
}
