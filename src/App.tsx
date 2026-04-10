import { useState } from 'react'
import type { TrainingRecord } from './types'
import { useTrainingStore } from './hooks/useTrainingStore'
import { useCalendar } from './hooks/useCalendar'
import { useTagSettings } from './hooks/useTagSettings'
import { CalendarGrid } from './components/CalendarGrid'
import { TrainingList } from './components/TrainingList'
import { BottomSheet } from './components/BottomSheet'
import { QuickAddSheet } from './components/QuickAddSheet'
import { TrainingFormPage } from './pages/TrainingFormPage'
import './App.css'

function getTodayString(): string {
  const t = new Date()
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

export default function App() {
  const { loading, getRecordsByDate, getTrainingDates, getTagsByDate, addRecord, updateRecord, deleteRecordById } = useTrainingStore()

  const todayStr = getTodayString()
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [currentPage, setCurrentPage] = useState<'home' | 'form'>('home')
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<TrainingRecord | null>(null)
  const [quickAddDate, setQuickAddDate] = useState<string | null>(null)

  const calendar = useCalendar()
  const { presetTags, addPresetTag, removePresetTag } = useTagSettings()

  const trainingDates = getTrainingDates(calendar.year, calendar.month)
  const tagsByDate = getTagsByDate(calendar.year, calendar.month)
  const dateRecords = getRecordsByDate(selectedDate)

  const handleAdd = () => {
    setEditingRecord(undefined)
    setCurrentPage('form')
  }

  const handleEdit = (record: TrainingRecord) => {
    setEditingRecord(record)
    setCurrentPage('form')
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
    setCurrentPage('home')
    setEditingRecord(undefined)
  }

  const handleFormBack = () => {
    setCurrentPage('home')
    setEditingRecord(undefined)
  }

  const handleLongPressDate = (fullDate: string) => {
    setSelectedDate(fullDate)
    setQuickAddDate(fullDate)
  }

  const handleQuickAdd = async (date: string, tags: string[]) => {
    await addRecord(date, { tags })
    setQuickAddDate(null)
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
            <h1 className="app__title"><span className="app__title-accent">Train</span>Log</h1>
          </header>
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
          <button className="app__fab" onClick={handleAdd}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </>
      )}

      {currentPage === 'form' && (
        <TrainingFormPage
          date={selectedDate}
          existingRecord={editingRecord}
          presetTags={presetTags}
          onAddPresetTag={addPresetTag}
          onRemovePresetTag={removePresetTag}
          onSave={handleFormSave}
          onBack={handleFormBack}
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
        isOpen={!!quickAddDate}
        date={quickAddDate || ''}
        presetTags={presetTags}
        onAdd={handleQuickAdd}
        onClose={() => setQuickAddDate(null)}
      />
    </div>
  )
}
