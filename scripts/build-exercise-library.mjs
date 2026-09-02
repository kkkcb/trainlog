/**
 * 构建动作图解素材库：
 * 从 scripts/exercise-manifest.json（bryllim/workout-guide，CC BY-SA 4.0）里
 * 按 scripts/exercise-zh.json 的精选清单挑选动作，下载 3 帧插画（jsdelivr CDN，
 * 带本地缓存 scripts/.wg-assets/），SVGO 压缩后输出
 * src/assets/exercises/<slug>.f{n}.svg 与 src/data/exerciseLibrary.ts。
 * 产物入库；此后构建不依赖网络。
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { optimize } from 'svgo'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CDN = 'https://cdn.jsdelivr.net/gh/bryllim/workout-guide@main/packages/workout-guide'
const manifest = JSON.parse(readFileSync(path.join(root, 'scripts/exercise-manifest.json'), 'utf8'))
const zhMap = JSON.parse(readFileSync(path.join(root, 'scripts/exercise-zh.json'), 'utf8'))

const bySlug = new Map(manifest.map((e) => [e.slug, e]))
const outDir = path.join(root, 'src/assets/exercises')
const cacheDir = path.join(root, 'scripts/.wg-assets')
const dataDir = path.join(root, 'src/data')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
mkdirSync(cacheDir, { recursive: true })
mkdirSync(dataDir, { recursive: true })

let written = 0
const missing = []

for (const [slug, zh] of Object.entries(zhMap)) {
  const entry = bySlug.get(slug)
  if (!entry) {
    missing.push(`${slug}(不在 manifest)`)
    continue
  }
  for (const frame of entry.frames) {
    const cachePath = path.join(cacheDir, frame.path)
    let svg
    if (existsSync(cachePath)) {
      svg = readFileSync(cachePath, 'utf8')
    } else {
      const url = `${CDN}/${frame.path}`
      const res = await fetch(url)
      if (!res.ok) {
        missing.push(`${slug}#f${frame.index}(HTTP ${res.status})`)
        continue
      }
      svg = await res.text()
      mkdirSync(path.dirname(cachePath), { recursive: true })
      writeFileSync(cachePath, svg)
    }
    const result = optimize(svg, {
      path: frame.path,
      multipass: true,
      plugins: [
        { name: 'preset-default', params: { overrides: {
          convertPathData: { floatPrecision: 1 },
          convertTransform: { floatPrecision: 2 },
        } } },
        'mergePaths',
        'collapseGroups',
        'removeUselessStrokeAndFill',
        'cleanupIds',
        'removeDimensions',
      ],
    })
    writeFileSync(path.join(outDir, `${slug}.f${frame.index}.svg`), result.data)
    written++
  }
}

// 生成元数据表（帧 URL 由 ExerciseIllustration 用 import.meta.glob 解析）
const entries = []
for (const [slug, zh] of Object.entries(zhMap)) {
  const e = bySlug.get(slug)
  if (!e) continue
  entries.push({
    slug,
    zh,
    en: e.name,
    equipment: e.equipment,
    muscle: e.primaryMuscle,
    frames: 3,
  })
}
entries.sort((a, b) => a.zh.localeCompare(b.zh, 'zh'))

const ts = `/**
 * 动作图解素材库（生成文件，勿手改）——由 scripts/build-exercise-library.mjs 生成
 * 插画：bryllim/workout-guide · CC BY-SA 4.0 · © Bryl Lim
 */
import type { ExerciseLibraryEntry } from '../types'

export const EXERCISE_LIBRARY: ExerciseLibraryEntry[] = ${JSON.stringify(entries, null, 2)}

const byZh = new Map(EXERCISE_LIBRARY.map((e) => [e.zh, e]))
const bySlug = new Map(EXERCISE_LIBRARY.map((e) => [e.slug, e]))

export function findExerciseByName(name: string): ExerciseLibraryEntry | undefined {
  return byZh.get(name) ?? bySlug.get(name)
}
`
writeFileSync(path.join(dataDir, 'exerciseLibrary.ts'), ts)

console.log(`frames written: ${written}, exercises: ${entries.length}`)
if (missing.length) {
  console.error('missing/skipped:', missing.join(', '))
  process.exit(1)
}
