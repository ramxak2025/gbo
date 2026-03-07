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

  return (
    <DataContext.Provider value={{
      data, loading, reload,
      addStudent, updateStudent, deleteStudent,
      addGroup, updateGroup, deleteGroup,
      addTransaction, updateTransaction, deleteTransaction,
      addTournament, deleteTournament,
      addNews, deleteNews,
      saveAttendanceBulk,
      addMaterial, deleteMaterial,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
