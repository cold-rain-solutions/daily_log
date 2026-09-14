import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daily Log",
    short_name: "Daily Log",
    description: "Fast daily task log — capture during meetings, carry over what's left.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2f5f1",
    theme_color: "#1f6f50",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
