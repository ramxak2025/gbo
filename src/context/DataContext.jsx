import { createContext, useContext, useState, useCallback } from 'react'
import { loadData, saveData, resetData as resetStorage, generateId } from '../utils/storage'

const DataContext = createContext()

export function DataProvider({ children, initialData, onDataChange }) {
  const [data, setData] = useState(initialData)

  const update = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveData(next)
      if (onDataChange) onDataChange(next)
      return next
    })
  }, [onDataChange])

  const addStudent = useCallback((student) => {
    const id = generateId()
    const newStudent = { ...student, id, createdAt: new Date().toISOString() }
    update(d => ({ ...d, students: [...d.students, newStudent] }))
    return id
  }, [update])

  const updateStudent = useCallback((id, changes) => {
    update(d => ({
      ...d,
      students: d.students.map(s => s.id === id ? { ...s, ...changes } : s)
    }))
  }, [update])

  const deleteStudent = useCallback((id) => {
    update(d => ({
      ...d,
      students: d.students.filter(s => s.id !== id),
      transactions: d.transactions.filter(t => t.studentId !== id)
    }))
  }, [update])

  const addGroup = useCallback((group) => {
    const id = generateId()
    update(d => ({ ...d, groups: [...d.groups, { ...group, id }] }))
    return id
  }, [update])

  const updateGroup = useCallback((id, changes) => {
    update(d => ({
      ...d,
      groups: d.groups.map(g => g.id === id ? { ...g, ...changes } : g)
    }))
  }, [update])

  const deleteGroup = useCallback((id) => {
    update(d => ({
      ...d,
      groups: d.groups.filter(g => g.id !== id),
      students: d.students.map(s => s.groupId === id ? { ...s, groupId: null } : s)
    }))
  }, [update])

  const addTransaction = useCallback((tx) => {
    const id = generateId()
    update(d => ({ ...d, transactions: [...d.transactions, { ...tx, id, date: new Date().toISOString() }] }))
    return id
  }, [update])

  const updateTransaction = useCallback((id, changes) => {
    update(d => ({
      ...d,
      transactions: d.transactions.map(t => t.id === id ? { ...t, ...changes } : t)
    }))
  }, [update])

  const deleteTransaction = useCallback((id) => {
    update(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }))
  }, [update])

  const addTournament = useCallback((tournament) => {
    const id = generateId()
    update(d => ({ ...d, tournaments: [...d.tournaments, { ...tournament, id }] }))
    return id
  }, [update])

  const updateTournament = useCallback((id, changes) => {
    update(d => ({
      ...d,
      tournaments: d.tournaments.map(t => t.id === id ? { ...t, ...changes } : t)
    }))
  }, [update])

  const deleteTournament = useCallback((id) => {
    update(d => ({ ...d, tournaments: d.tournaments.filter(t => t.id !== id) }))
  }, [update])

  const addNews = useCallback((news) => {
    const id = generateId()
    update(d => ({ ...d, news: [...d.news, { ...news, id, date: new Date().toISOString() }] }))
    return id
  }, [update])

  const deleteNews = useCallback((id) => {
    update(d => ({ ...d, news: d.news.filter(n => n.id !== id) }))
  }, [update])

  const addTrainer = useCallback((trainer) => {
    const id = generateId()
    update(d => ({ ...d, users: [...d.users, { ...trainer, id, role: 'trainer' }] }))
    return id
  }, [update])

  const updateTrainer = useCallback((id, changes) => {
    update(d => ({
      ...d,
      users: d.users.map(u => u.id === id ? { ...u, ...changes } : u)
    }))
  }, [update])

  const deleteTrainer = useCallback((id) => {
    update(d => ({
      ...d,
      users: d.users.filter(u => u.id !== id),
      groups: d.groups.filter(g => g.trainerId !== id),
      students: d.students.filter(s => s.trainerId !== id),
      transactions: d.transactions.filter(t => t.trainerId !== id),
      news: d.news.filter(n => n.trainerId !== id),
    }))
  }, [update])

  const resetAll = useCallback(() => {
    const fresh = resetStorage()
    setData(fresh)
    if (onDataChange) onDataChange(fresh)
  }, [onDataChange])

  return (
    <DataContext.Provider value={{
      data, update, resetAll,
      addStudent, updateStudent, deleteStudent,
      addGroup, updateGroup, deleteGroup,
      addTransaction, updateTransaction, deleteTransaction,
      addTournament, updateTournament, deleteTournament,
      addNews, deleteNews,
      addTrainer, updateTrainer, deleteTrainer,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
