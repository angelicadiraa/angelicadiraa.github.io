export interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface SiteInfo {
  name: string;
  logo: string;
  location: { street: string; city: string; country: string };
  email: string;
  phone: string;
  instagramUrl: string;
  instagramHandle: string;
  copyright: string;
  bio: string;
  details: { label: string; value: string }[];
}
