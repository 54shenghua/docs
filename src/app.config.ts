import type { Metadata } from "next"

export const DONATE = {
  link: "https://github.com/sponsors/Innei",
  qrcode: [
    "https://cdn.jsdelivr.net/gh/Innei/img-bed@master/20191211132347.png",
    "https://cdn.innei.ren/bed/2023/0424213144.png",
  ],
}

export const CONFIG = {
  /**
   * mark this book is work in progress
   */
  wip: true,
  /**
   * public book hostname
   */
  urlBase: "https://docs.54sher.com",
}

export const SEO = {
  title: {
    absolute: "升华工作室文档",
    template: `%s | ${"升华工作室文档"}`,
  },
  metadataBase: new URL(CONFIG.urlBase),
  // twitter: {
  //   card: "summary_large_image",
  //   creator: "@__oQuery",
  //   site: "https://innei.in",
  // },
  openGraph: {
    type: "book",
    authors: ["grtsinry43", "steamfinder"],
    tags: ["54sher", "升华工作室", "文档", "docs", "nextjs", "react"],
    locale: "zh-CN",
    images: [],
  },
} satisfies Metadata
