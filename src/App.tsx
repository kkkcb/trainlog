import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import type { TrainingRecord, TrainingTag } from './types'
import { useTrainingStore } from './hooks/useTrainingStore'
import { useTagSettings } from './hooks/useTagSettings'
import { exportAllData, importAllData } from './utils/storage'
import { getTodayString, getWeekOf, shiftDays, formatDateParts } from './utils/date'
import { WeekStrip } from './components/WeekStrip'
import { TrainingList } from './components/TrainingList'
import { BottomSheet } from './components/BottomSheet'
import { QuickAddSheet } from './components/QuickAddSheet'
import { TrainingFormPage } from './pages/TrainingFormPage'
import { TagSettingsPage } from './pages/TagSettingsPage'
import { BackupPage } from './pages/BackupPage'
import { TabBar } from './components/TabBar'
import { StatsPage } from './components/StatsPage'
import { Icon } from './components/icons'
import { useToast } from './components/useToast'
import { useHapticFeedback } from './hooks/useHapticFeedback'
import './App.css'

type Page = 'home' | 'form' | 'settings' | 'backup'

export default function App() {
  const { loading, records, addRecord, updateRecord, deleteRecordById, reload } = useTrainingStore()
  const toast = useToast()
  const haptic = useHapticFeedback()

  const [selectedDate, setSelectedDate] = useState(getTodayString)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [activeTab, setActiveTab] = useState<'training' | 'stats'>('training')
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<TrainingRecord | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)

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

  const allTrainingDates = useMemo(() => new Set(Object.values(records).map((r) => r.date)), [records])

  const dateRecords = useMemo(() => {
    return Object.values(records)
      .filter((r) => r.date === selectedDate)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [selectedDate, records])

  const weekDates = useMemo(() => getWeekOf(selectedDate), [selectedDate])
  const isViewingToday = selectedDate === getTodayString()
  const { main: dateMain, week: dateWeek } = formatDateParts(selectedDate)

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

  /** 从统计页月历点击某天：跳回训练页查看该日记录 */
  const handleJumpToDate = useCallback((iso: string) => {
    haptic.onTap()
    setSelectedDate(iso)
    setActiveTab('training')
  }, [haptic])

  const handleTabChange = useCallback((tab: 'training' | 'stats') => {
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
            <div className="app__header-date">
              <div className="app__header-main">
                <h1 className="app__date">{dateMain}</h1>
                <span className="app__weekday">{dateWeek}</span>
                {isViewingToday && <span className="app__today-pill">今天</span>}
              </div>
              <p className="app__header-sub">
                {isViewingToday ? '今日' : '当日'}共 {dateRecords.length} 条训练记录
              </p>
            </div>
            <button className="app__settings-btn" onClick={handleOpenSettings} aria-label="设置">
              <Icon name="settings" size={21} strokeWidth={1.9} />
            </button>
          </header>

          {activeTab === 'training' && (
            <div className="app__tab-content">
              <WeekStrip
                weekDates={weekDates}
                selectedDate={selectedDate}
                trainingDates={allTrainingDates}
                onSelectDate={setSelectedDate}
                onLongPressDate={handleLongPressDate}
                onPrevWeek={() => setSelectedDate(shiftDays(selectedDate, -7))}
                onNextWeek={() => setSelectedDate(shiftDays(selectedDate, 7))}
              />
              <TrainingList
                records={dateRecords}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <button className="app__fab" onClick={handleAdd} aria-label="添加训练">
                <Icon name="plus" size={26} strokeWidth={2.4} />
              </button>
            </div>
          )}

          {activeTab === 'stats' && (
            <StatsPage
              records={records}
              selectedDate={selectedDate}
              onSelectDay={handleJumpToDate}
              onLongPressDay={handleLongPressDate}
            />
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
