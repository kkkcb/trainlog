import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import type { TrainingRecord, TrainingTag } from './types'
import { useTrainingStore } from './hooks/useTrainingStore'
import { useCalendar } from './hooks/useCalendar'
import { useTagSettings } from './hooks/useTagSettings'
import { exportAllData, importAllData } from './utils/storage'
import { calculateGamification } from './utils/gamification'
import { CalendarGrid } from './components/CalendarGrid'
import { TrainingList } from './components/TrainingList'
import { BottomSheet } from './components/BottomSheet'
import { QuickAddSheet } from './components/QuickAddSheet'
import { TrainingFormPage } from './pages/TrainingFormPage'
import { TagSettingsPage } from './pages/TagSettingsPage'
import { BackupPage } from './pages/BackupPage'
import { TabBar } from './components/TabBar'
import { StatsPage } from './components/StatsPage'
import { StreakCard } from './components/StreakCard'
import { AchievementsPage } from './components/AchievementsPage'
import { Icon } from './components/icons'
import { useToast } from './components/useToast'
import { useHapticFeedback } from './hooks/useHapticFeedback'
import './App.css'

type Page = 'home' | 'form' | 'settings' | 'backup'

function getTodayString(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** "2026-08-27" -> "8月27日 · 周四" */
function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${WEEKDAY_NAMES[d.getDay()]}`
}

export default function App() {
  const { loading, records, addRecord, updateRecord, deleteRecordById, reload } = useTrainingStore()
  const toast = useToast()
  const haptic = useHapticFeedback()

  const todayStr = getTodayString()
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [activeTab, setActiveTab] = useState<'training' | 'stats' | 'achievements'>('training')
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<TrainingRecord | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)

  const calendar = useCalendar()
  const { tagDefinitions, addTag, removeTag, updateTagMetrics } = useTagSettings()

  useEffect(() => {
    const handler = () => {
      pageStackRef.current.pop()
      const prev = pageStackRef.current[pageStackRef.current.length - 1] ?? 'home'
      setCurrentPage(prev)
      setEditingRecord(undefined)
      setQuickAddDate(null)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  const trainingDates = useMemo(() => {
    const prefix = `${calendar.year}-${String(calendar.month + 1).padStart(2, '0')}`
    const dates = new Set<string>()
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(prefix)) dates.add(r.date)
    })
    return dates
  }, [calendar.year, calendar.month, records])

  const tagsByDate = useMemo(() => {
    const prefix = `${calendar.year}-${String(calendar.month + 1).padStart(2, '0')}`
    const result: Record<string, string[]> = {}
    const seen: Record<string, Set<string>> = {}
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(prefix) && r.tags.length > 0) {
        if (!seen[r.date]) {
          seen[r.date] = new Set()
          result[r.date] = []
        }
        const s = seen[r.date]
        r.tags.forEach((tag) => {
          if (!s.has(tag.name)) {
            s.add(tag.name)
            result[r.date].push(tag.name)
          }
        })
      }
    })
    return result
  }, [calendar.year, calendar.month, records])

  const dateRecords = useMemo(() => {
    return Object.values(records)
      .filter((r) => r.date === selectedDate)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [selectedDate, records])

  const gamificationStats = useMemo(() => calculateGamification(records), [records])

  const pageStackRef = useRef<Page[]>(['home'])

  const pushPage = useCallback((page: Page) => {
    pageStackRef.current.push(page)
    setCurrentPage(page)
    if (page !== 'home') {
      history.pushState(null, '')
    }
  }, [])

  const handleAdd = () => {
    setEditingRecord(undefined)
    pushPage('form')
  }

  const handleEdit = (record: TrainingRecord) => {
    setEditingRecord(record)
    pushPage('form')
  }

  const handleDelete = (record: TrainingRecord) => {
    setDeleteTarget(record)
  }

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await deleteRecordById(deleteTarget.id)
      haptic.onSuccess()
      toast.show('已删除', 'success')
      setDeleteTarget(null)
    }
  }

  const handleFormSave = async (data: Partial<TrainingRecord>) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, data)
      haptic.onSuccess()
      toast.show('已更新', 'success')
    } else {
      await addRecord(selectedDate, data)
      haptic.onSuccess()
      toast.show('已添加训练记录', 'success')
    }
    setEditingRecord(undefined)
    history.back()
  }

  const handleFormBack = () => {
    history.back()
  }

  const handleLongPressDate = (fullDate: string) => {
    haptic.onSelect()
    setSelectedDate(fullDate)
    setQuickAddDate(fullDate)
  }

  const handleQuickAdd = async (date: string, tagNames: string[]) => {
    const tags: TrainingTag[] = tagNames.map((name) => {
      const def = tagDefinitions.find((d) => d.name === name)
      return { name, metrics: def && def.metrics.length > 0 ? {} : undefined }
    })
    await addRecord(date, { tags })
    haptic.onSuccess()
    toast.show(`已添加 ${tagNames.length} 个训练`, 'success')
    setQuickAddDate(null)
  }

  const handleOpenSettings = () => {
    pushPage('settings')
  }

  const handleSettingsBack = () => {
    history.back()
  }

  const handleOpenBackup = () => {
    pushPage('backup')
  }

  const handleBackupExport = useCallback(() => {
    return exportAllData(tagDefinitions)
  }, [tagDefinitions])

  const handleBackupImport = useCallback(async (json: string) => {
    await importAllData(json)
  }, [])

  const handleBackupImported = useCallback(() => {
    reload()
  }, [reload])

  const handleBackupBack = () => {
    history.back()
  }

  const handleTabChange = useCallback((tab: 'training' | 'stats' | 'achievements') => {
    haptic.onTap()
    setActiveTab(tab)
  }, [haptic])

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <span className="app-loading__text">加载中...</span>
      </div>
    )
  }

  return (
    <div className="app">
      {currentPage === 'home' && (
        <>
          <header className="app__header">
            <h1 className="app__title"><span className="app__title-accent">Train</span>Log</h1>
            <button className="app__settings-btn" onClick={handleOpenSettings} aria-label="设置">
              <Icon name="settings" size={21} strokeWidth={1.9} />
            </button>
          </header>

          {activeTab === 'training' && (
            <>
              <StreakCard stats={gamificationStats} />
              <CalendarGrid
                calendar={calendar}
                trainingDates={trainingDates}
                tagsByDate={tagsByDate}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onLongPressDate={handleLongPressDate}
              />
              <div className="app__section">
                <div className="app__section-header">
                  <span className="app__section-title">{formatDateLabel(selectedDate)}</span>
                  <span className="app__section-count">{dateRecords.length} 条记录</span>
                </div>
                <TrainingList
                  records={dateRecords}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            </>
          )}

          {activeTab === 'achievements' && (
            <AchievementsPage stats={gamificationStats} />
          )}

          {activeTab === 'stats' && (
            <StatsPage records={records} />
          )}

          {activeTab === 'training' && (
            <button className="app__fab" onClick={handleAdd} aria-label="添加训练">
              <Icon name="plus" size={26} strokeWidth={2.4} />
            </button>
          )}

          <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      )}

      {currentPage === 'form' && (
        <TrainingFormPage
          key={editingRecord ? editingRecord.id : '__new__'}
          date={selectedDate}
          existingRecord={editingRecord}
          tagDefinitions={tagDefinitions}
          onSave={handleFormSave}
          onBack={handleFormBack}
        />
      )}

      {currentPage === 'settings' && (
        <TagSettingsPage
          tagDefinitions={tagDefinitions}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onUpdateTagMetrics={updateTagMetrics}
          onOpenBackup={handleOpenBackup}
          onBack={handleSettingsBack}
        />
      )}

      {currentPage === 'backup' && (
        <BackupPage
          records={records}
          tagDefinitions={tagDefinitions}
          onExport={handleBackupExport}
          onImport={handleBackupImport}
          onImported={handleBackupImported}
          onBack={handleBackupBack}
        />
      )}

      <BottomSheet
        isOpen={!!deleteTarget}
        title="确定删除这条训练记录吗？"
        confirmText="删除"
        cancelText="取消"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <QuickAddSheet
        key={quickAddDate ?? 'closed'}
        isOpen={!!quickAddDate}
        date={quickAddDate || ''}
        tagDefinitions={tagDefinitions}
        onAdd={handleQuickAdd}
        onClose={() => setQuickAddDate(null)}
      />
    </div>
  )
}
