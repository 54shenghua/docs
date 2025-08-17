import Link from "next/link"

import { Divider } from "~/components/divider"
import { PageFooter } from "~/components/footer"
import { MobileHeader } from "~/components/header"
import { HeaderDrawerContentProvider } from "~/components/header/provider"
import { buildSectionData } from "~/core"
import { LayoutContainer } from "~/layout/components/LayoutContainer"
import { LeftAside } from "~/layout/components/LeftAside"
import { getLastGitUpdateTime } from "~/lib/git"

export default async () => {
  const { sections } = buildSectionData()

  // 获取最后更新时间
  const lastUpdate = getLastGitUpdateTime(".")
  const lastUpdateText = lastUpdate
    ? lastUpdate.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
      })
    : "未知"

  return (
    <HeaderDrawerContentProvider element={<LeftAside asWeight />}>
      <MobileHeader />
      <LayoutContainer>
        <div className="relative mr-4 hidden min-w-0 xl:block" data-hide-print>
          <LeftAside />
        </div>

        <main className="min-w-0 px-4 py-14 lg:px-8 xl:px-2">
          <div className="prose prose-neutral mx-auto max-w-none dark:prose-invert">
            {/* Hero Section */}
            <div className="text-center">
              <h1 className="mb-6 text-3xl font-bold"> 升华工作室技术文档 </h1>

              <p className="mx-auto max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
                汇集开发经验与最佳实践的技术知识库。从前端到后端，从基础概念到高级架构，
                这里记录着我们在项目开发中积累的宝贵经验和深度思考。
              </p>
            </div>

            <Divider className="my-8" />

            {/* Quick Access */}
            <div>
              <h2 className="mb-4 text-xl font-semibold"> 快速访问 </h2>
              <div className="not-prose grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {sections.slice(0, 6).map((section) => (
                  <Link
                    key={section.title}
                    href={`/reading/${section.items[0]?.path}`}
                    className="group block rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-zinc-900 group-hover:text-accent dark:text-zinc-100">
                        {section.title}
                      </h3>
                      <div className="text-zinc-400 transition-transform group-hover:translate-x-0.5">
                        →
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {section.items.length} 篇文档
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Introduction */}
            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold"> 关于升华工作室 </h2>
              <div className="space-y-4 text-zinc-700 dark:text-zinc-300">
                <p>盛世升华，服务中南</p>
                <p>
                  中南大学校团委网络信息部（升华工作室）致力于探索和实践现代软件开发的最佳方案。
                  我们深信技术的力量不仅在于解决问题， 更在于创造价值、提升效率，
                  让开发者能够专注于真正重要的创新工作。
                </p>
                <p>
                  这份文档汇集了我们在日常开发中遇到的挑战、总结的经验，以及对技术趋势的思考。
                  无论你是刚入门的新手还是经验丰富的开发者，都希望能在这里找到对你有帮助的内容。
                </p>
                <p>
                  我们相信知识的分享能够推动整个技术社区的进步。如果你在阅读过程中有任何疑问或建议，
                  欢迎通过 GitHub Issues 与我们交流讨论。
                </p>
              </div>
            </div>

            {/* Overview */}
            <div className="not-prose mt-8">
              <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        持续更新中
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <span>📚 {sections.length} 个章节 </span>
                      <span>•</span>
                      <span>
                        📄 {sections.reduce((acc, section) => acc + section.items.length, 0)} 篇文档
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    最后更新：{lastUpdateText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </LayoutContainer>

      <PageFooter />
    </HeaderDrawerContentProvider>
  )
}
