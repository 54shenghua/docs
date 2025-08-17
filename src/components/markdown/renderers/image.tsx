"use client"

import type { Zoom } from "medium-zoom"
import mediumZoom from "medium-zoom"
import { usePathname } from "next/navigation"
import * as React from "react"
import { useEffect, useRef, useState } from "react"

import { isServerSide } from "~/lib/env"
import { isVideoExt } from "~/lib/mine-type"

import { Divider } from "../../divider"

let zoomer: Zoom

// 处理图片路径的辅助函数
const resolveImagePath = (src: string, currentPath: string) => {
  // 如果是绝��路径或外部链接，直接返回
  if (src.startsWith("http") || src.startsWith("/")) {
    return src
  }

  // 处理相对路径
  if (src.startsWith("./")) {
    // 从当前路径中提取目录信息
    const pathParts = currentPath.split("/")
    if (pathParts.length >= 3) {
      // /reading/cate/slug
      const cate = pathParts[2]
      const imageName = src.replace("./", "")
      return `/images/${cate}/${imageName}`
    }
  }

  // 如果是直接的文件名，也处理为相对路径
  if (!src.includes("/")) {
    const pathParts = currentPath.split("/")
    if (pathParts.length >= 3) {
      const cate = pathParts[2]
      return `/images/${cate}/${src}`
    }
  }

  return src
}

export const MarkdownImage = (props: {
  src: string
  alt?: string
  width?: number
  height?: number
}) => {
  const { src, alt } = props
  const pathname = usePathname()

  // 解析图片路径
  const resolvedSrc = resolveImagePath(src, pathname)

  const nextProps = {
    ...props,
    src: resolvedSrc,
  }
  nextProps.alt = alt?.replace(/^[¡!]/, "")
  const [zoom] = useState(() => {
    if (isServerSide) return null
    if (zoomer) {
      return zoomer
    }
    zoomer = mediumZoom("img")
    return zoomer
  })

  const imageRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const $image = imageRef.current
    if (!$image) return
    if (!zoom) return
    if (imageRef) {
      zoom.attach($image)
    }
    return () => {
      zoom.detach($image)
    }
  }, [src, zoom])

  const ext = src.split(".").pop()
  if (ext && isVideoExt(ext)) {
    const figcaption = alt?.replace(/^[¡!]/, "")
    return (
      <div className="flex flex-col items-center">
        <video className="w-full" src={src} controls playsInline muted autoPlay={false} />
        {figcaption && (
          <p className="mt-1 flex flex-col items-center justify-center text-sm">
            <Divider className="w-[80px] opacity-80" />
            <span className="opacity-90">{figcaption}</span>
          </p>
        )}
      </div>
    )
  } else {
    return <img ref={imageRef} alt={nextProps.alt || ""} {...nextProps} />
  }
}
