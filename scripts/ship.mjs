/**
 * ship：验证完成后一键 同步远端 + 打 tag。
 * 流程：门禁(check/test/build) → 有改动则提交 → push main → 自动递增 tag → push tag。
 * 用法：node scripts/ship.mjs "提交信息"
 * 网络抖动自动重试（GitHub 偶发 SSL 握手失败）。
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const message = process.argv[2]
const run = (cmd, opts = {}) => {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', stdio: 'pipe', ...opts })
  return { ok: r.status === 0, out: String(r.stdout || '') + String(r.stderr || '') }
}
const runLive = (cmd) => {
  const r = spawnSync(cmd, { shell: true, stdio: 'inherit' })
  return r.status === 0
}
const withRetry = (label, cmd, times = 3) => {
  for (let i = 1; i <= times; i++) {
    const r = run(cmd)
    if (r.ok) return true
    console.log(`  ${label} 第${i}次失败，${i < times ? '2秒后重试' : '放弃'}：${r.out.trim().slice(0, 120)}`)
    if (i < times) spawnSync('sleep', { shell: true }) || run('ping -n 3 127.0.0.1 >nul')
  }
  return false
}

// 1) 门禁
console.log('▶ 门禁: check / test / build')
if (!runLive('npm run check')) { console.error('✗ check 未过，终止'); process.exit(1) }
if (!runLive('npm test --silent')) { console.error('✗ 测试未过，终止'); process.exit(1) }
if (!runLive('npm run build')) { console.error('✗ 构建未过，终止'); process.exit(1) }

// 2) 提交（有脏改动才需要 message）
const dirty = run('git status --porcelain').out.trim().length > 0
if (dirty) {
  if (!message) { console.error('✗ 有未提交改动，需要提交信息：node scripts/ship.mjs "信息"'); process.exit(1) }
  run('git add -A')
  if (!run(`git commit -m "${message.replace(/"/g, "'")}"`).ok) { console.error('✗ commit 失败'); process.exit(1) }
  console.log(`✓ 已提交：${message}`)
} else {
  console.log('· 无本地改动，跳过提交')
}

// 3) 推送 main
console.log('▶ 推送 main …')
if (!withRetry('push main', 'git push origin main')) { console.error('✗ push main 失败（网络）'); process.exit(1) }
console.log('✓ main 已同步')

// 4) 自动 tag：v0.N 递增
const tags = run('git tag --list "v*"').out.trim().split('\n').filter(Boolean)
let next = 'v0.1'
if (tags.length > 0) {
  const nums = tags.map((t) => Number(t.replace(/^v0\./, ''))).filter((n) => !Number.isNaN(n))
  next = `v0.${(nums.length ? Math.max(...nums) : 0) + 1}`
}
run(`git tag ${next}`)
if (!withRetry('push tag', `git push origin ${next}`)) {
  run(`git tag -d ${next}`)
  console.error(`✗ tag ${next} 推送失败，已回滚本地 tag`)
  process.exit(1)
}
console.log(`✓ 已打 tag：${next}`)

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
console.log(`\n🚢 ship 完成：${pkg.name}@${pkg.version} · main + ${next}`)
