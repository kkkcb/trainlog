/**
 * kei 头像眨眼动画生成器（可重跑复现）
 *
 * 流程：
 * 1. 源图 src/assets/avatar.jpg（1254×1254 自画像）
 * 2. 校准的瞳孔包围盒（长连通段扫描实测，见 CALIBRATED_EYES）
 * 3. 闭眼帧 = 从瞳孔正下方脸颊裁等高皮肤条带 → 垂直翻转 → 贴到眼位
 *    （上眼睑被镜框挡住，用下眼睑上合的生理动作，肤色无缝）
 * 4. 4 帧（睁/半闭/全闭/半闭）缩放堆叠 → 动画 WebP（回退 GIF）
 *
 * 调节：LID_HALF / LID_FULL 控制闭合度；delays 控制节奏
 * 重跑：node scripts/animate-avatar.cjs
 */

const sharp = require('sharp')
const path = require('path')

const SRC = path.join(__dirname, '..', 'src', 'assets', 'avatar.jpg')
const OUT_DIR = path.join(__dirname, '..', 'src', 'assets')

const EXPAND_X = 1.25 // 眼眶横向扩展：连眼白一起盖住
const LID_HALF = 100 // 半闭：盖住瞳孔上半（px）
const LID_FULL = 195 // 全闭：盖满瞳孔并余量（px）
const OUT_H = 448 // 输出帧高

// 手动校准（长连通段扫描实测）：瞳孔包围盒（原图坐标 1254×1254）
const CALIBRATED_EYES = [
  { name: 'left', x: 449, y: 690, w: 78, h: 180 },
  { name: 'right', x: 792, y: 690, w: 106, h: 180 },
]

const CHEEK_TOP = 885 // 眼睑皮肤来源：瞳孔下缘下方的脸颊区

async function lidStrip(eye, h) {
  const w = Math.round(eye.w * EXPAND_X) + 8
  const padX = Math.round((w - eye.w) / 2)
  const left = Math.max(0, eye.x - padX)
  const strip = await sharp(SRC)
    .extract({ left, top: CHEEK_TOP, width: w, height: h })
    .flip() // 垂直翻转：贴到眼位后肤色从下往上过渡自然
    .toBuffer()
  return { input: strip, left, top: eye.y - 2 }
}

async function main() {
  // 1. 睁眼帧（原图）
  const frames = [await sharp(SRC).toBuffer()]

  // 2/3. 半闭、全闭帧
  for (const h of [LID_HALF, LID_FULL, LID_HALF]) {
    const comps = []
    for (const eye of CALIBRATED_EYES) {
      comps.push(await lidStrip(eye, h))
    }
    frames.push(await sharp(SRC).composite(comps).toBuffer())
  }

  // 4. 缩放堆叠
  const scaled = []
  for (const f of frames) {
    scaled.push(await sharp(f).resize({ height: OUT_H }).png().toBuffer())
  }
  const frameW = (await sharp(scaled[0]).metadata()).width
  const strip = await sharp({
    create: { width: frameW, height: OUT_H * scaled.length, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(scaled.map((f, i) => ({ input: f, left: 0, top: i * OUT_H })))
    .png()
    .toBuffer()

  // 5. 动画 WebP（失败回退 GIF）
  const delays = [3200, 50, 83, 50]
  let outFile = path.join(OUT_DIR, 'avatar-blink.webp')
  try {
    await sharp(strip)
      .webp({ delay: delays, loop: 0 })
      .toFile(outFile)
    const m = await sharp(outFile).metadata()
    if (!m.pages || m.pages < 2) throw new Error('webp 未含多帧')
    console.log('webp ok: ' + m.pages + ' frames, ' + m.width + 'x' + m.height)
  } catch (e) {
    console.log('webp 失败，回退 GIF:', e.message)
    outFile = path.join(OUT_DIR, 'avatar-blink.gif')
    await sharp(strip)
      .gif({ delay: delays, loop: 0 })
      .toFile(outFile)
  }

  const size = require('fs').statSync(outFile).size
  console.log('DONE: ' + outFile + ' (' + (size / 1024).toFixed(0) + ' KB)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
