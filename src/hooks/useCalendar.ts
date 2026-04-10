import { useState, useMemo, useCallback } from 'react'

export interface CalendarState {
  year: number
  month: number
}

const today = new Date()

export function useCalendar() {
  const [state, setState] = useState<CalendarState>({
    year: today.getFullYear(),
    month: today.getMonth(),
  })

  const goToPrevMonth = useCallback(() => {
    setState((prev) => {
      const m = prev.month - 1
      return m < 0 ? { year: prev.year - 1, month: 11 } : { ...prev, month: m }
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setState((prev) => {
      const m = prev.month + 1
      return m > 11 ? { year: prev.year + 1, month: 0 } : { ...prev, month: m }
    })
  }, [])

  const goToToday = useCallback(() => {
    setState({
      year: today.getFullYear(),
      month: today.getMonth(),
    })
  }, [])

  const calendarDays = useMemo(() => {
    const firstDay = new Date(state.year, state.month, 1).getDay()
    const daysInMonth = new Date(state.year, state.month + 1, 0).getDate()
    const daysInPrevMonth = new Date(state.year, state.month, 0).getDate()

    const days: Array<{ date: number; month: 'prev' | 'current' | 'next'; fullDate: string }> = []

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const m = state.month - 1
      const y = m < 0 ? state.year - 1 : state.year
      const actualMonth = m < 0 ? 11 : m
      days.push({
        date: d,
        month: 'prev',
        fullDate: `${y}-${String(actualMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        month: 'current',
        fullDate: `${state.year}-${String(state.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      })
    }

    const remaining = 42 - days.length
    for (let d = 1; d <= remaining; d++) {
      const m = state.month + 1
      const y = m > 11 ? state.year + 1 : state.year
      const actualMonth = m > 11 ? 0 : m
      days.push({
        date: d,
        month: 'next',
        fullDate: `${y}-${String(actualMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      })
    }

    return days
  }, [state.year, state.month])

  const monthLabel = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    return `${state.year}年 ${months[state.month]}`
  }, [state.year, state.month])

  const isToday = useCallback((fullDate: string) => {
    const t = today
    const todayStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
    return fullDate === todayStr
  }, [])

  return {
    ...state,
    monthLabel,
    calendarDays,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    isToday,
  }
}
