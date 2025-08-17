#!/usr/bin/env node

const fs = require("node:fs")
const path = require("node:path")

// 复制图片文件到 public 目录的脚本
function copyImages() {
  const markdownDir = path.join(__dirname, "../markdown/sections")
  const publicImagesDir = path.join(__dirname, "../public/images")

  // 确保 public/images 目录存在
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true })
  }

  // 遍历所有 sections
  const sections = fs.readdirSync(markdownDir)

  sections.forEach((section) => {
    const sectionPath = path.join(markdownDir, section)
    if (!fs.statSync(sectionPath).isDirectory()) return

    const targetDir = path.join(publicImagesDir, section)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // 复制图片文件
    const files = fs.readdirSync(sectionPath)
    files.forEach((file) => {
      if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file)) {
        const sourcePath = path.join(sectionPath, file)
        const targetPath = path.join(targetDir, file)

        fs.copyFileSync(sourcePath, targetPath)
        console.log(`复制图片: ${section}/${file}`)
      }
    })
  })

  console.log("图片复制完成！")
}

copyImages()
