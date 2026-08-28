import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import type { TrainingRecord, TrainingTag } from './types'
import { useTrainingStore } from './hooks/useTrainingStore'
import { useCalendar } from './hooks/useCalendar'
import { useTagSettings } from './hooks/useTagSettings'
import { exportAllData, importAllData } from './utils/storage'
import { getTodayString, formatDateParts } from './utils/date'
import { CalendarGrid } from './components/CalendarGrid'
import { TrainingList } from './components/TrainingList'
import { CalendarPet } from './components/PetCompanion'
import { TabBar, type HomeTab } from './components/TabBar'
import { BottomSheet } from './components/BottomSheet'
import { QuickAddSheet } from './components/QuickAddSheet'
import { TrainingFormPage } from './pages/TrainingFormPage'
import { TagSettingsPage } from './pages/TagSettingsPage'
import { BackupPage } from './pages/BackupPage'
import { DiaryPage } from './pages/DiaryPage'
import { StatsPage } from './components/StatsPage'
import { Icon } from './components/icons'
import { useToast } from './components/useToast'
import { useHapticFeedback } from './hooks/useHapticFeedback'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import avatarImg from './assets/avatar.jpg'
import './App.css'

type Page = 'home' | 'form' | 'settings' | 'backup'

export default function App() {
  const { loading, records, addRecord, updateRecord, deleteRecordById, reload } = useTrainingStore()
  const toast = useToast()
  const haptic = useHapticFeedback()

  const [selectedDate, setSelectedDate] = useState(getTodayString)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<TrainingRecord | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)
  // 喂养信号：成功记录训练时 +1，驱动宠物庆祝动画
  const [feedSignal, setFeedSignal] = useState(0)
  // 首页底部标签：日历 / 训记
  const [homeTab, setHomeTab] = useState<HomeTab>('calendar')

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

  // Android 返回键（Capacitor 8 无默认处理，需自行接管）：
  // 优先关弹层 → 子页面后退 → 主页才退出
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listener = CapApp.addListener('backButton', () => {
      if (quickAddDate) {
        setQuickAddDate(null)
        return
      }
      if (deleteTarget) {
        setDeleteTarget(null)
        return
      }
      if (currentPage !== 'home') {
        history.back()
        return
      }
      CapApp.exitApp()
    })
    return () => {
      listener.then((l) => l.remove()).catch(() => {})
    }
  }, [quickAddDate, deleteTarget, currentPage])

  const monthPrefix = useMemo(
    () => `${calendar.year}-${String(calendar.month + 1).padStart(2, '0')}`,
    [calendar.year, calendar.month]
  )

  const trainingDates = useMemo(() => {
    const dates = new Set<string>()
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(monthPrefix)) dates.add(r.date)
    })
    return dates
  }, [monthPrefix, records])

  const tagsByDate = useMemo(() => {
    const result: Record<string, string[]> = {}
    const seen: Record<string, Set<string>> = {}
    Object.values(records).forEach((r) => {
      if (r.date.startsWith(monthPrefix) && r.tags.length > 0) {
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
  }, [monthPrefix, records])

  const dateRecords = useMemo(() => {
    return Object.values(records)
      .filter((r) => r.date === selectedDate)
      .sort((a, b) => a.createdAt - b.createdAt)
  }, [selectedDate, records])

  // 宠物候选格：本月、今天及之前的日期
  const todayStr = getTodayString()
  const petCandidates = useMemo(() => {
    return calendar.calendarDays
      .filter((d) => d.month === 'current' && d.fullDate <= todayStr)
      .map((d) => {
        const idx = calendar.calendarDays.indexOf(d)
        return { index: idx, date: d.fullDate }
      })
  }, [calendar.calendarDays, todayStr])

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
    setFeedSignal((n) => n + 1)
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
    setFeedSignal((n) => n + 1)
    setQuickAddDate(null)
  }

  const handleOpenSettings = () => {
    pushPage('settings')
  }

  const handleHomeTabChange = useCallback(
    (tab: HomeTab) => {
      haptic.onTap()
      setHomeTab(tab)
    },
    [haptic]
  )

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
            <img className="app__avatar" src={avatarImg} alt="我的头像" />
            <div className="app__header-main">
              <h1 className="app__date">{dateMain}</h1>
              <span className="app__weekday">{dateWeek}</span>
              {isViewingToday && <span className="app__today-pill">今天</span>}
            </div>
            <div className="app__header-actions">
              <button className="app__settings-btn" onClick={handleOpenSettings} aria-label="设置">
                <Icon name="settings" size={21} strokeWidth={1.9} />
              </button>
            </div>
          </header>

          <main className="app__main">
            {homeTab === 'calendar' ? (
              <>
                <div className="app__calendar-card">
                  <CalendarGrid
                    calendar={calendar}
                    trainingDates={trainingDates}
                    tagsByDate={tagsByDate}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onLongPressDate={handleLongPressDate}
                    pet={
                      <CalendarPet
                        candidates={petCandidates}
                        records={records}
                        trainingDates={trainingDates}
                        selectedDate={selectedDate}
                        feedSignal={feedSignal}
                        onQuickAdd={(date) => {
                          setSelectedDate(date)
                          setQuickAddDate(date)
                        }}
                      />
                    }
                  />
                  <p className="app__calendar-hint">宠物住在日历上 · 戳它 / 双击 / 长按它有惊喜</p>
                </div>

                <TrainingList
                  records={dateRecords}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />

                <StatsPage records={records} />
              </>
            ) : (
              <DiaryPage />
            )}
          </main>

          {homeTab === 'calendar' && (
            <button className="app__fab" onClick={handleAdd} aria-label="添加训练">
              <Icon name="plus" size={26} strokeWidth={2.4} />
            </button>
          )}

          <TabBar active={homeTab} onChange={handleHomeTabChange} />
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
