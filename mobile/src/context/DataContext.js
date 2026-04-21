import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../utils/api';

const DataContext = createContext();

const EMPTY = {
  users: [], groups: [], students: [], transactions: [],
  tournaments: [], news: [], tournamentRegistrations: [], authorInfo: {},
  internalTournaments: [], attendance: [], pendingRegistrations: [],
  materials: [], clubs: [],
};

export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const d = await api.getData();
      setData(d);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('iborcuha_token');
      if (token) reload();
      else setLoading(false);
    })();
  }, [reload]);

  const addStudent = useCallback(async (student) => {
    const s = await api.addStudent(student);
    setData(d => ({ ...d, students: [...d.students, s] }));
    return s.id;
  }, []);

  const updateStudent = useCallback(async (id, changes) => {
    await api.updateStudent(id, changes);
    setData(d => ({ ...d, students: d.students.map(s => s.id === id ? { ...s, ...changes } : s) }));
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await api.deleteStudent(id);
    setData(d => ({
      ...d,
      students: d.students.filter(s => s.id !== id),
      transactions: d.transactions.filter(t => t.studentId !== id),
    }));
  }, []);

  const addGroup = useCallback(async (group) => {
    const g = await api.addGroup(group);
    setData(d => ({ ...d, groups: [...d.groups, g] }));
    return g.id;
  }, []);

  const updateGroup = useCallback(async (id, changes) => {
    await api.updateGroup(id, changes);
    setData(d => ({ ...d, groups: d.groups.map(g => g.id === id ? { ...g, ...changes } : g) }));
  }, []);

  const deleteGroup = useCallback(async (id) => {
    await api.deleteGroup(id);
    setData(d => ({
      ...d,
      groups: d.groups.filter(g => g.id !== id),
      students: d.students.map(s => s.groupId === id ? { ...s, groupId: null } : s),
    }));
  }, []);

  const addTransaction = useCallback(async (tx) => {
    const t = await api.addTransaction(tx);
    setData(d => ({ ...d, transactions: [...d.transactions, t] }));
    return t.id;
  }, []);

  const updateTransaction = useCallback(async (id, changes) => {
    await api.updateTransaction(id, changes);
    setData(d => ({ ...d, transactions: d.transactions.map(t => t.id === id ? { ...t, ...changes } : t) }));
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    await api.deleteTransaction(id);
    setData(d => ({ ...d, transactions: d.transactions.filter(t => t.id !== id) }));
  }, []);

  const addTournament = useCallback(async (tournament) => {
    const t = await api.addTournament(tournament);
    setData(d => ({ ...d, tournaments: [...d.tournaments, t] }));
    return t.id;
  }, []);

  const updateTournament = useCallback(async (id, changes) => {
    await api.updateTournament(id, changes);
    setData(d => ({ ...d, tournaments: d.tournaments.map(t => t.id === id ? { ...t, ...changes } : t) }));
  }, []);

  const deleteTournament = useCallback(async (id) => {
    await api.deleteTournament(id);
    setData(d => ({ ...d, tournaments: d.tournaments.filter(t => t.id !== id) }));
  }, []);

  const addNews = useCallback(async (news) => {
    const n = await api.addNews(news);
    setData(d => ({ ...d, news: [...d.news, n] }));
    return n.id;
  }, []);

  const deleteNews = useCallback(async (id) => {
    await api.deleteNews(id);
    setData(d => ({ ...d, news: d.news.filter(n => n.id !== id) }));
  }, []);

  const saveAttendanceBulk = useCallback(async (groupId, date, records) => {
    await api.saveAttendanceBulk({ groupId, date, records });
    setData(d => {
      const filtered = d.attendance.filter(a => !(a.groupId === groupId && a.date === date));
      const newRecs = records.map(r => ({ groupId, studentId: r.studentId, date, present: r.present }));
      return { ...d, attendance: [...filtered, ...newRecs] };
    });
  }, []);

  const addMaterial = useCallback(async (material) => {
    const m = await api.addMaterial(material);
    setData(d => ({ ...d, materials: [m, ...d.materials] }));
    return m.id;
  }, []);

  const deleteMaterial = useCallback(async (id) => {
    await api.deleteMaterial(id);
    setData(d => ({ ...d, materials: d.materials.filter(m => m.id !== id) }));
  }, []);

  const updateMaterial = useCallback(async (id, changes) => {
    await api.updateMaterial(id, changes);
    setData(d => ({ ...d, materials: d.materials.map(m => m.id === id ? { ...m, ...changes } : m) }));
  }, []);

  const addClub = useCallback(async (club) => {
    const c = await api.addClub(club);
    setData(d => ({ ...d, clubs: [...(d.clubs || []), c] }));
    return c.id;
  }, []);

  const updateClub = useCallback(async (id, changes) => {
    await api.updateClub(id, changes);
    setData(d => ({ ...d, clubs: (d.clubs || []).map(c => c.id === id ? { ...c, ...changes } : c) }));
  }, []);

  const deleteClub = useCallback(async (id) => {
    await api.deleteClub(id);
    setData(d => ({ ...d, clubs: (d.clubs || []).filter(c => c.id !== id) }));
  }, []);

  const addInternalTournament = useCallback(async (tournament) => {
    const t = await api.addInternalTournament(tournament);
    setData(d => ({ ...d, internalTournaments: [...(d.internalTournaments || []), t] }));
    return t.id;
  }, []);

  const updateInternalTournament = useCallback(async (id, changes) => {
    await api.updateInternalTournament(id, changes);
    setData(d => ({ ...d, internalTournaments: (d.internalTournaments || []).map(t => t.id === id ? { ...t, ...changes } : t) }));
  }, []);

  const deleteInternalTournament = useCallback(async (id) => {
    await api.deleteInternalTournament(id);
    setData(d => ({ ...d, internalTournaments: (d.internalTournaments || []).filter(t => t.id !== id) }));
  }, []);

  const registerTournament = useCallback(async (tournamentId, studentId) => {
    await api.registerTournament(tournamentId, studentId);
    setData(d => ({ ...d, tournamentRegistrations: [...(d.tournamentRegistrations || []), { tournamentId, studentId }] }));
  }, []);

  const unregisterTournament = useCallback(async (tournamentId, studentId) => {
    await api.unregisterTournament(tournamentId, studentId);
    setData(d => ({ ...d, tournamentRegistrations: (d.tournamentRegistrations || []).filter(r => !(r.tournamentId === tournamentId && r.studentId === studentId)) }));
  }, []);

  const updateTrainer = useCallback(async (id, changes) => {
    await api.updateTrainer(id, changes);
    await reload();
  }, [reload]);

  const approveRegistration = useCallback(async (id) => {
    await api.approveRegistration(id);
    await reload();
  }, [reload]);

  const rejectRegistration = useCallback(async (id) => {
    await api.rejectRegistration(id);
    await reload();
  }, [reload]);

  const updateAuthor = useCallback(async (changes) => {
    await api.updateAuthor(changes);
    setData(d => ({ ...d, authorInfo: { ...d.authorInfo, ...changes } }));
  }, []);

  const deleteAttendance = useCallback(async (groupId, studentId, date) => {
    await api.deleteAttendance({ groupId, studentId, date });
    setData(d => ({ ...d, attendance: d.attendance.filter(a => !(a.groupId === groupId && a.studentId === studentId && a.date === date)) }));
  }, []);

  // Legacy update helper for direct state manipulation
  const update = useCallback(async (updater) => {
    setData(d => updater(d));
  }, []);

  return (
    <DataContext.Provider value={{
      data, loading, reload, update,
      addStudent, updateStudent, deleteStudent,
      addGroup, updateGroup, deleteGroup,
      addTransaction, updateTransaction, deleteTransaction,
      addTournament, updateTournament, deleteTournament,
      registerTournament, unregisterTournament,
      addNews, deleteNews,
      saveAttendanceBulk, deleteAttendance,
      addMaterial, updateMaterial, deleteMaterial,
      addClub, updateClub, deleteClub,
      addInternalTournament, updateInternalTournament, deleteInternalTournament,
      updateTrainer, approveRegistration, rejectRegistration,
      updateAuthor,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
