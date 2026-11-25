import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rythu Mitra",
    short_name: "Rythu Mitra",
    description:
      "AI agricultural companion for farmers in Telangana.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F8F2",
    theme_color: "#1F7A3D",
    lang: "en",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
