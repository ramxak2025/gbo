import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '../utils/api'

const DataContext = createContext()

const EMPTY_DATA = {
  users: [], groups: [], students: [], transactions: [],
  tournaments: [], news: [], tournamentRegistrations: [], authorInfo: {},
  internalTournaments: [], attendance: [], pendingRegistrations: [],
  materials: [], clubs: [],
}

export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const d = await api.getData()
      setData(d)
    } catch {
      // not logged in or error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('iborcuha_token')
    if (token) reload()
    else setLoading(false)
  }, [reload])

  // Raw update: for tournament registrations and author info
  const update = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(data) : updater
    // Detect what changed and call appropriate API
    // Tournament registrations
    if (next.tournamentRegistrations !== data.tournamentRegistrations) {
      const oldRegs = data.tournamentRegistrations
      const newRegs = next.tournamentRegistrations
      // Find added
      for (const nr of newRegs) {
        if (!oldRegs.find(r => r.tournamentId === nr.tournamentId && r.studentId === nr.studentId)) {
          await api.registerTournament(nr.tournamentId, nr.studentId)
        }
      }
      // Find removed
      for (const or of oldRegs) {
        if (!newRegs.find(r => r.tournamentId === or.tournamentId && r.studentId === or.studentId)) {
          await api.unregisterTournament(or.tournamentId, or.studentId)
        }
      }
    }
    // Author info
    if (next.authorInfo !== data.authorInfo) {
      await api.updateAuthor(next.authorInfo)
    }
    setData(next)
  }, [data])

  const addStudent = useCallback(async (student) => {
    const s = await api.addStudent(student)
    setData(d => ({ ...d, students: [...d.students, s] }))
    return s.id
  }, [])

  const updateStudent = useCallback(async (id, changes) => {
    await api.updateStudent(id, changes)
    setData(d => ({
      ...d,
      students: d.students.map(s => s.id === id ? { ...s, ...changes } : s)
    }))
  }, [])

  const deleteStudent = useCallback(async (id) => {
    await api.deleteStudent(id)
    setData(d => ({
      ...d,
      students: d.students.filter(s => s.id !== id),
      transactions: d.transactions.filter(t => t.studentId !== id),
      tournamentRegistrations: d.tournamentRegistrations.filter(r => r.studentId !== id),
    }))
  }, [])

  const addGroup = useCallback(async (group) => {
    const g = await api.addGroup(group)
    setData(d => ({ ...d, groups: [...d.groups, g] }))
    return g.id
  }, [])

  const updateGroup = useCallback(async (id, changes) => {
    await api.updateGroup(id, changes)
    setData(d => ({
      ...d,
      groups: d.groups.map(g => g.id === id ? { ...g, ...changes } : g)
    }))
  }, [])

  const deleteGroup = useCallback(async (id) => {
    await api.deleteGroup(id)
    setData(d => ({
      ...d,
      groups: d.groups.filter(g => g.id !== id),
      students: d.students.map(s => s.groupId === id ? { ...s, groupId: null } : s)
    }))
  }, [])

  const addTransaction = useCallback(async (tx) => {
    const t = await api.addTransaction(tx)
    setData(d => ({ ...d, transactions: [...d.transactions, t] }))
    return t.id
  }, [])

  const updateTransaction = useCallback(async (id, changes) => {
    await api.updateTransaction(id, changes)
    setData(d => ({
      ...d,
      transactions: d.transactions.map(t => t.id === id ? { ...t, ...changes } : t)
    }))
  }, [])

  const deleteTransaction = useCallback(async (id) => {
    await api.deleteTransaction(id)
    setData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }))
  }, [])

  const addTournament = useCallback(async (tournament) => {
    const t = await api.addTournament(tournament)
    setData(d => ({ ...d, tournaments: [...d.tournaments, t] }))
    return t.id
  }, [])

  const updateTournament = useCallback(async (id, changes) => {
    await api.updateTournament(id, changes)
    setData(d => ({
      ...d,
      tournaments: d.tournaments.map(t => t.id === id ? { ...t, ...changes } : t)
    }))
  }, [])

  const deleteTournament = useCallback(async (id) => {
    await api.deleteTournament(id)
    setData(d => ({
      ...d,
      tournaments: d.tournaments.filter(t => t.id !== id),
      tournamentRegistrations: d.tournamentRegistrations.filter(r => r.tournamentId !== id),
    }))
  }, [])

  const addNews = useCallback(async (news) => {
    const n = await api.addNews(news)
    setData(d => ({ ...d, news: [...d.news, n] }))
    return n.id
  }, [])

  const deleteNews = useCallback(async (id) => {
    await api.deleteNews(id)
    setData(d => ({ ...d, news: d.news.filter(n => n.id !== id) }))
  }, [])

  const addTrainer = useCallback(async (trainer) => {
    const t = await api.addTrainer(trainer)
    setData(d => ({ ...d, users: [...d.users, { ...t, role: 'trainer' }] }))
    return t.id
  }, [])

  const updateTrainer = useCallback(async (id, changes) => {
    await api.updateTrainer(id, changes)
    setData(d => ({
      ...d,
      users: d.users.map(u => u.id === id ? { ...u, ...changes } : u)
    }))
  }, [])

  const deleteTrainer = useCallback(async (id) => {
    await api.deleteTrainer(id)
    setData(d => ({
      ...d,
      users: d.users.filter(u => u.id !== id),
      groups: d.groups.filter(g => g.trainerId !== id),
      students: d.students.filter(s => s.trainerId !== id),
      transactions: d.transactions.filter(t => t.trainerId !== id),
      news: d.news.filter(n => n.trainerId !== id),
    }))
  }, [])

  const addInternalTournament = useCallback(async (tournament) => {
    const t = await api.addInternalTournament(tournament)
    setData(d => ({ ...d, internalTournaments: [...d.internalTournaments, t] }))
    return t.id
  }, [])

  const updateInternalTournament = useCallback(async (id, changes) => {
    await api.updateInternalTournament(id, changes)
    setData(d => ({
      ...d,
      internalTournaments: d.internalTournaments.map(t => t.id === id ? { ...t, ...changes } : t)
    }))
  }, [])

  const deleteInternalTournament = useCallback(async (id) => {
    await api.deleteInternalTournament(id)
    setData(d => ({ ...d, internalTournaments: d.internalTournaments.filter(t => t.id !== id) }))
  }, [])

  const saveAttendanceBulk = useCallback(async (groupId, date, records) => {
    await api.saveAttendanceBulk({ groupId, date, records })
    // Update local: remove old records for this group+date, add new ones
    setData(d => {
      const filtered = d.attendance.filter(a => !(a.groupId === groupId && a.date === date))
      const newRecords = records.map(r => ({ id: '', groupId, studentId: r.studentId, date, present: r.present }))
      return { ...d, attendance: [...filtered, ...newRecords] }
    })
  }, [])

  const addMaterial = useCallback(async (material) => {
    const m = await api.addMaterial(material)
    setData(d => ({ ...d, materials: [m, ...d.materials] }))
    return m.id
  }, [])

  const updateMaterial = useCallback(async (id, changes) => {
    await api.updateMaterial(id, changes)
    setData(d => ({
      ...d,
      materials: d.materials.map(m => m.id === id ? { ...m, ...changes } : m)
    }))
  }, [])

  const deleteMaterial = useCallback(async (id) => {
    await api.deleteMaterial(id)
    setData(d => ({ ...d, materials: d.materials.filter(m => m.id !== id) }))
  }, [])

  const addClub = useCallback(async (club) => {
    const c = await api.addClub(club)
    setData(d => ({ ...d, clubs: [c, ...d.clubs] }))
    return c.id
  }, [])

  const updateClub = useCallback(async (id, changes) => {
    await api.updateClub(id, changes)
    setData(d => {
      let users = d.users
      // If headTrainerId changed, update isHeadTrainer flags on users
      if ('headTrainerId' in changes) {
        users = d.users.map(u => {
          if (u.clubId === id && u.isHeadTrainer) return { ...u, isHeadTrainer: false }
          if (u.id === changes.headTrainerId) return { ...u, isHeadTrainer: true, clubId: id }
          return u
        })
      }
      return {
        ...d,
        clubs: d.clubs.map(c => c.id === id ? { ...c, ...changes } : c),
        users,
      }
    })
  }, [])

  const deleteClub = useCallback(async (id) => {
    await api.deleteClub(id)
    setData(d => ({
      ...d,
      clubs: d.clubs.filter(c => c.id !== id),
      users: d.users.map(u => u.clubId === id ? { ...u, clubId: null, isHeadTrainer: false } : u),
    }))
  }, [])

  const assignTrainerToClub = useCallback(async (clubId, trainerId) => {
    await api.assignTrainerToClub(clubId, trainerId)
    setData(d => {
      const club = d.clubs.find(c => c.id === clubId)
      return {
        ...d,
        users: d.users.map(u => u.id === trainerId ? { ...u, clubId, clubName: club?.name || '' } : u)
      }
    })
  }, [])

  const removeTrainerFromClub = useCallback(async (clubId, trainerId) => {
    await api.removeTrainerFromClub(clubId, trainerId)
    setData(d => ({
      ...d,
      users: d.users.map(u => u.id === trainerId ? { ...u, clubId: null, isHeadTrainer: false, clubName: '' } : u)
    }))
  }, [])

  const resetAll = useCallback(() => {
    // Not implemented for DB version — would need admin API
  }, [])

  return (
    <DataContext.Provider value={{
      data, loading, reload, update, resetAll,
      addStudent, updateStudent, deleteStudent,
      addGroup, updateGroup, deleteGroup,
      addTransaction, updateTransaction, deleteTransaction,
      addTournament, updateTournament, deleteTournament,
      addNews, deleteNews,
      addTrainer, updateTrainer, deleteTrainer,
      addInternalTournament, updateInternalTournament, deleteInternalTournament,
      saveAttendanceBulk,
      addMaterial, updateMaterial, deleteMaterial,
      addClub, updateClub, deleteClub, assignTrainerToClub, removeTrainerFromClub,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
