"use client"

import { useModalStack } from "rc-modal-sheet"

import { DividerVertical } from "../divider"
import { MLink } from "../link"

export const PageFooter = () => {
  const { present } = useModalStack()
  return (
    <footer className="py-8">
      <div className="space-y-4 text-center opacity-50">
        <div>
          本内容采用{" "}
          <a
            href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
            rel="noreferrer"
            target="_blank"
          >
            知识共享署名 - 非商业性使用 - 相同方式共享 4.0 国际许可协议 (CC BY-NC-SA 4.0)
          </a>{" "}
          进行许可。
        </div>
        <div>
          本站由 Innei 大佬的项目{" "}
          <a href="https://github.com/Innei/book-ssg-template" rel="noreferrer" target="_blank">
            Book SSG Template
          </a>{" "}
          驱动，不胜感激！
        </div>
        <div>
          © 2024-2025{" "}
          <a href="https://www.54sher.com" target="_blank" rel="noreferrer">
            升华工作室
          </a>
          <DividerVertical />
          <MLink href="https://github.com/54Shenghua">GitHub</MLink>
          <DividerVertical />
          Under MIT license.
        </div>
      </div>
    </footer>
  )
}
