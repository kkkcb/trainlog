import { useState } from 'react'
import type { TrainingRecord, TagDefinition } from '../types'
import { Icon } from '../components/icons'
import './BackupPage.css'

interface BackupPageProps {
  records: Record<string, TrainingRecord>
  tagDefinitions: TagDefinition[]
  onExport: () => Promise<string>
  onImport: (json: string) => Promise<void>
  onImported: () => void
  onBack: () => void
}

export function BackupPage({
  records,
  onExport,
  onImport,
  onImported,
  onBack,
}: BackupPageProps) {
  const [importText, setImportText] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const recordCount = Object.keys(records).length

  const handleExportCopy = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const json = await onExport()
      await navigator.clipboard.writeText(json)
      setStatus({ type: 'success', msg: `已复制 ${recordCount} 条记录到剪贴板，请粘贴到备忘录/微信收藏保存` })
    } catch {
      setStatus({ type: 'error', msg: '导出失败，请重试' })
    } finally {
      setBusy(false)
    }
  }

  const handleExportShare = async () => {
    setBusy(true)
    setStatus(null)
    try {
      const json = await onExport()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trainlog-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setStatus({ type: 'success', msg: '备份文件已下载' })
    } catch {
      setStatus({ type: 'error', msg: '导出失败，请用复制方式' })
    } finally {
      setBusy(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setImportText(text)
    } catch {
      setStatus({ type: 'error', msg: '无法读取剪贴板，请手动粘贴' })
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    setBusy(true)
    setStatus(null)
    try {
      await onImport(importText.trim())
      setStatus({ type: 'success', msg: '导入成功！' })
      setImportText('')
      onImported()
    } catch (e) {
      setStatus({ type: 'error', msg: e instanceof Error ? e.message : '导入失败，请检查数据格式' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="backup-page">
      <div className="backup-page__header">
        <button className="backup-page__back" onClick={onBack} aria-label="返回">
          <Icon name="arrowLeft" size={20} />
        </button>
        <span className="backup-page__title">数据备份</span>
        <span className="backup-page__spacer" />
      </div>

      <div className="backup-page__body">
        <div className="backup-page__status-card">
          <span className="backup-page__status-value">{recordCount}</span>
          <span className="backup-page__status-label">条训练记录</span>
        </div>

        <div className="backup-page__section">
          <label className="backup-page__section-title">导出备份</label>
          <p className="backup-page__section-desc">
            升级或换机前导出，避免数据丢失。导出后请妥善保存 JSON 内容。
          </p>
          <div className="backup-page__btn-group">
            <button
              className="backup-page__btn backup-page__btn--primary"
              onClick={handleExportShare}
              disabled={busy || recordCount === 0}
            >
              下载备份文件
            </button>
            <button
              className="backup-page__btn"
              onClick={handleExportCopy}
              disabled={busy || recordCount === 0}
            >
              复制到剪贴板
            </button>
          </div>
        </div>

        <div className="backup-page__section">
          <label className="backup-page__section-title">导入备份</label>
          <p className="backup-page__section-desc">
            粘贴之前导出的 JSON 内容。导入会覆盖当前数据，请谨慎操作。
          </p>
          <textarea
            className="backup-page__textarea"
            placeholder="在此粘贴备份的 JSON 内容..."
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={6}
          />
          <div className="backup-page__btn-group">
            <button
              className="backup-page__btn"
              onClick={handlePaste}
              disabled={busy}
            >
              从剪贴板粘贴
            </button>
            <button
              className="backup-page__btn backup-page__btn--danger"
              onClick={handleImport}
              disabled={busy || !importText.trim()}
            >
              确认导入
            </button>
          </div>
        </div>

        {status && (
          <div className={`backup-page__status ${status.type === 'error' ? 'backup-page__status--error' : 'backup-page__status--success'}`}>
            {status.msg}
          </div>
        )}
      </div>
    </div>
  )
}
