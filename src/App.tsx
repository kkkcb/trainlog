import { useState, useMemo, useEffect, useCallback } from 'react'
import type { TrainingRecord, TrainingTag } from './types'
import { useTrainingStore } from './hooks/useTrainingStore'
import { useCalendar } from './hooks/useCalendar'
import { useTagSettings } from './hooks/useTagSettings'
import { exportAllData, importAllData } from './utils/storage'
import { CalendarGrid } from './components/CalendarGrid'
import { TrainingList } from './components/TrainingList'
import { BottomSheet } from './components/BottomSheet'
import { QuickAddSheet } from './components/QuickAddSheet'
import { TrainingFormPage } from './pages/TrainingFormPage'
import { TagSettingsPage } from './pages/TagSettingsPage'
import { BackupPage } from './pages/BackupPage'
import { TabBar } from './components/TabBar'
import { StatsPage } from './components/StatsPage'
import './App.css'

type Page = 'home' | 'form' | 'settings' | 'backup'

function getTodayString(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function App() {
  const { loading, records, addRecord, updateRecord, deleteRecordById, reload } = useTrainingStore()

  const todayStr = getTodayString()
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [activeTab, setActiveTab] = useState<'training' | 'stats'>('training')
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<TrainingRecord | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)

  const calendar = useCalendar()
  const { tagDefinitions, addTag, removeTag, updateTagMetrics } = useTagSettings()

  useEffect(() => {
    const handler = () => {
      setCurrentPage('home')
      setEditingRecord(undefined)
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

  const pushPage = useCallback((page: Page) => {
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
      setDeleteTarget(null)
    }
  }

  const handleFormSave = async (data: Partial<TrainingRecord>) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, data)
    } else {
      await addRecord(selectedDate, data)
    }
    setEditingRecord(undefined)
    history.back()
  }

  const handleFormBack = () => {
    history.back()
  }

  const handleLongPressDate = (fullDate: string) => {
    setSelectedDate(fullDate)
    setQuickAddDate(fullDate)
  }

  const handleQuickAdd = async (date: string, tagNames: string[]) => {
    const tags: TrainingTag[] = tagNames.map((name) => {
      const def = tagDefinitions.find((d) => d.name === name)
      return { name, metrics: def && def.metrics.length > 0 ? {} : undefined }
    })
    await addRecord(date, { tags })
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

  const handleTabChange = useCallback((tab: 'training' | 'stats') => {
    setActiveTab(tab)
  }, [])

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
            <button className="app__settings-btn" onClick={handleOpenSettings}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </header>

          {activeTab === 'training' && (
            <>
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
                  <span className="app__section-title">{selectedDate}</span>
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

          {activeTab === 'stats' && (
            <StatsPage records={records} />
          )}

          {activeTab === 'training' && (
            <button className="app__fab" onClick={handleAdd}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
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
