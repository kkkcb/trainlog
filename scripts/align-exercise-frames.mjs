/**
 * 帧对齐（素材库生成后处理）：
 * 部分动作的三帧插画中人物大小/位置剧变（波比跳、碰脚尖等），
 * 轮播时人形忽大忽小乱跳。此脚本把每帧内容框归一到三帧联合框：
 * scale = min(uw/fw, uh/fh)，再平移居中。人形保持一致大小，只换姿态。
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = path.join(root, 'src/assets/exercises')

const RASTER = 100 // 检测用栅格边长（SVG 512 空间）
const THRESHOLD = 25 // 亮度阈值：高于此视为内容像素

async function contentBox(svgPath) {
  const { data, info } = await sharp(svgPath, { density: 20 })
    .resize(RASTER, RASTER, { fit: 'contain', background: '#000' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] > THRESHOLD) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  return { minX, minY, maxX, maxY }
}

async function alignExercise(slug) {
  const framePaths = [1, 2, 3].map((f) => path.join(assetsDir, `${slug}.f${f}.svg`))
  const boxes = []
  for (const p of framePaths) {
    const b = await contentBox(p)
    if (!b) return { slug, status: 'blank-skip' }
    boxes.push(b)
  }

  // 三帧联合框（栅格空间 → SVG 512 空间）
  const k = 512 / RASTER
  const uMinX = Math.min(...boxes.map((b) => b.minX))
  const uMinY = Math.min(...boxes.map((b) => b.minY))
  const uMaxX = Math.max(...boxes.map((b) => b.maxX))
  const uMaxY = Math.max(...boxes.map((b) => b.maxY))
  const uw = (uMaxX - uMinX) * k
  const uh = (uMaxY - uMinY) * k
  const uCx = ((uMinX + uMaxX) / 2) * k
  const uCy = ((uMinY + uMaxY) / 2) * k

  let changed = 0
  for (let i = 0; i < 3; i++) {
    const b = boxes[i]
    const fw = Math.max(1, (b.maxX - b.minX) * k)
    const fh = Math.max(1, (b.maxY - b.minY) * k)
    const s = Math.min(uw / fw, uh / fh)
    const fCx = ((b.minX + b.maxX) / 2) * k
    const fCy = ((b.minY + b.maxY) / 2) * k
    const tx = uCx - s * fCx
    const ty = uCy - s * fCy
    const p = framePaths[i]
    let svg = readFileSync(p, 'utf8')
    // 已对齐过则跳过
    if (svg.includes('data-align')) continue
    const openEnd = svg.indexOf('>', svg.indexOf('<svg'))
    if (openEnd === -1) continue
    svg =
      svg.slice(0, openEnd + 1) +
      `<g data-align="1" transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(4)})">` +
      svg.slice(openEnd + 1).replace(/<\/svg>\s*$/, '</g></svg>')
    writeFileSync(p, svg)
    changed++
  }
  return { slug, status: 'aligned', frames: changed }
}

const files = readdirSync(assetsDir).filter((f) => f.endsWith('.f1.svg'))
const slugs = [...new Set(files.map((f) => f.replace(/\.f1\.svg$/, '')))]

let aligned = 0
for (const slug of slugs) {
  const r = await alignExercise(slug)
  if (r.status === 'aligned') aligned++
}
console.log(`exercises: ${slugs.length}, aligned: ${aligned}`)
