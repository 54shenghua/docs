import Link from "next/link"

import { buildSectionData } from "~/core"
import { ReadingLayout } from "~/layout/ReadingLayout"

export default async function NotFound() {
  const { sections } = buildSectionData()

  // 获取第一个可用的链接作为推荐
  const firstSection = sections.at(0)
  const firstItem = firstSection?.items.at(0)

  return (
    <ReadingLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-8">
          <h1 className="mb-4 text-6xl font-bold text-zinc-800 dark:text-zinc-200">404</h1>
          <h2 className="mb-6 text-2xl font-medium text-zinc-600 dark:text-zinc-400">页面未找到</h2>
          <p className="mb-8 text-lg text-zinc-500 dark:text-zinc-500">
            抱歉，您访问的页面不存在或已被移动。
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-zinc-900 px-6 py-3 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            返回首页
          </Link>

          {firstItem && (
            <Link
              href={`/reading/${firstItem.path}`}
              className="rounded-lg border border-zinc-300 px-6 py-3 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              开始阅读
            </Link>
          )}
        </div>

        {sections.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-4 text-lg font-medium text-zinc-700 dark:text-zinc-300">推荐内容</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {sections.slice(0, 3).map((section) => (
                <div key={section.title} className="text-center">
                  <h4 className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {section.title}
                  </h4>
                  <div className="flex flex-col gap-1">
                    {section.items.slice(0, 2).map((item) => (
                      <Link
                        key={item.path}
                        href={`/reading/${item.path}`}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ReadingLayout>
  )
}
