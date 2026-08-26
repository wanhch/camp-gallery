export type MediaType = "photo" | "video";
export type MediaStatus = "public" | "hidden";
export interface MediaItem { id: string; url: string; type: MediaType; thumbnailUrl: string | null; company: number; categoryId: number; caption: string; createdAt: string; likes: number; isDemo: boolean; featured: boolean }
export interface AdminMediaItem extends MediaItem { uploaderName: string; categoryName: string; status: MediaStatus }
export interface RankingItem { categoryId: number; name: string; count: number }
export interface PlatformStats { trainees: number; companies: number; media: number; photos: number; videos: number; ranking: RankingItem[] }
export interface PlatformConfig { maxFileMb: number; maxFiles: number; aiMode: "demo" | "live" }
export interface Category { id: number; slug: string; name: string; number: string | null; kind: "company" | "staff"; rankable: boolean }
export interface UploadProfile { name: string; categoryId: number }
export interface Company { id: number; number: string; name: string; motto: string; summary: string; image: string; accent: string; members: number }
