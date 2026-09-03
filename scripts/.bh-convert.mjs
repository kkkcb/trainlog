/** 一次性转换：react-native-body-highlighter 的 TS 模型 → src/data/bodyModel.ts */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

function convert(p) {
  let s = readFileSync(p, 'utf8')
  s = s.replace(/import[^;]+;/, '')
  s = s.replace(': BodyPart[]', '')
  return s.replace('export const bodyFront', 'const bodyFront').replace('export const bodyBack', 'const bodyBack')
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const f = await import('data:text/javascript,' + encodeURIComponent(convert(path.join(root, 'scripts/.bh-front.ts')) + '\nexport { bodyFront }'))
const b = await import('data:text/javascript,' + encodeURIComponent(convert(path.join(root, 'scripts/.bh-back.ts')) + '\nexport { bodyBack }'))

const colors = {}
for (const p of f.bodyFront) colors[p.slug] = p.color
for (const p of b.bodyBack) colors[p.slug] = p.color
console.log('front parts:', f.bodyFront.length, 'back parts:', b.bodyBack.length)
console.log('colors:', JSON.stringify(colors))

function pathsOf(p) {
  const pt = p.path
  if (Array.isArray(pt)) return pt
  if (typeof pt === 'string') return [pt]
  if (pt && typeof pt === 'object') {
    const l = Array.isArray(pt.left) ? pt.left : typeof pt.left === 'string' ? [pt.left] : []
    const r = Array.isArray(pt.right) ? pt.right : typeof pt.right === 'string' ? [pt.right] : []
    return [...l, ...r]
  }
  return []
}

const model = {
  front: { viewBox: '0 0 724 1448', parts: f.bodyFront.map((p) => ({ slug: p.slug, paths: pathsOf(p) })) },
  back: { viewBox: '724 0 724 1448', parts: b.bodyBack.map((p) => ({ slug: p.slug, paths: pathsOf(p) })) },
}

const header = `/**
 * 人体肌肉图模型（生成文件，勿手改）
 * 来源: react-native-body-highlighter (MIT) © ELABBASSI Hicham
 */
export interface BodyPartModel {
  slug: string
  paths: string[]
}

export const BODY_BASE_COLORS: Record<string, string> = ${JSON.stringify(colors)}

export const BODY_MODEL: {
  front: { viewBox: string; parts: BodyPartModel[] }
  back: { viewBox: string; parts: BodyPartModel[] }
} = `

writeFileSync(path.join(root, 'src/data/bodyModel.ts'), header + JSON.stringify(model) + '\n')
console.log('bodyModel.ts written')
