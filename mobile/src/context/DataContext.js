import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const DataContext = createContext();

const EMPTY_DATA = {
  users: [], groups: [], students: [], transactions: [],
  tournaments: [], news: [], tournamentRegistrations: [],
  authorInfo: null, internalTournaments: [], attendance: [],
  pendingRegistrations: [], materials: [], clubs: [],
  parents: [], studentGroups: [], branches: [],
};

export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getData();
      setData({ ...EMPTY_DATA, ...result });
    } catch (e) {
      console.warn('Data reload failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback((updater) => {
    setData(prev => ({ ...prev, ...updater(prev) }));
  }, []);

  // Students
  const addStudent = useCallback(async (student) => {
    const result = await api.addStudent(student);
    const id = result.id;
    setData(prev => {
      const newStudent = { ...student, id };
      const newStudents = [...prev.students, newStudent];
      let newGroups = prev.studentGroups;
      if (student.groupIds?.length) {
        const entries = student.groupIds.map(gid => ({ studentId: id, groupId: gid }));
        newGroups = [...prev.studentGroups, ...entries];
      }
      return { ...prev, students: newStudents, studentGroups: newGroups };
    });
    return id;
  }, []);

  const updateStudent = useCallback(async (id, changes) => {
    await api.updateStudent(id, changes);
    setData(prev => {
      const students = prev.students.map(s => s.id === id ? { ...s, ...changes } : s);
      let studentGroups = prev.studentGroups;
      if (changes.groupIds) {
        studentGroups = [
          ...prev.studentGroups.filter(sg => sg.studentId !== id),
          ...changes.groupIds.map(gid => ({ studentId: id, groupId: gid })),
        ];
      }
      return { ...prev, students, studentGroups };
    });
  }, []);

  const deleteStudent = useCallback(async (id) => {
    await api.deleteStudent(id);
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      transactions: prev.transactions.filter(t => t.studentId !== id),
      tournamentRegistrations: prev.tournamentRegistrations.filter(r => r.studentId !== id),
      studentGroups: prev.studentGroups.filter(sg => sg.studentId !== id),
    }));
  }, []);

  // Groups
  const addGroup = useCallback(async (group) => {
    const result = await api.addGroup(group);
    const id = result.id;
    setData(prev => ({ ...prev, groups: [...prev.groups, { ...group, id }] }));
    return id;
  }, []);

  const updateGroup = useCallback(async (id, changes) => {
    await api.updateGroup(id, changes);
    setData(prev => ({
      ...prev,
      groups: prev.groups.map(g => g.id === id ? { ...g, ...changes } : g),
    }));
  }, []);

  const deleteGroup = useCallback(async (id) => {
    await api.deleteGroup(id);
    setData(prev => ({
      ...prev,
      groups: prev.groups.filter(g => g.id !== id),
      students: prev.students.map(s => s.groupId === id ? { ...s, groupId: null } : s),
    }));
  }, []);

  // Transactions
  const addTransaction = useCallback(async (tx) => {
    const result = await api.addTransaction(tx);
    const id = result.id;
    setData(prev => ({ ...prev, transactions: [...prev.transactions, { ...tx, id }] }));
    return id;
  }, []);

  const updateTransaction = useCallback(async (id, changes) => {
    await api.updateTransaction(id, changes);
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...changes } : t),
    }));
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    await api.deleteTransaction(id);
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
  }, []);

  // Tournaments
  const addTournament = useCallback(async (tournament) => {
    const result = await api.addTournament(tournament);
    const id = result.id;
    setData(prev => ({ ...prev, tournaments: [...prev.tournaments, { ...tournament, id }] }));
    return id;
  }, []);

  const updateTournament = useCallback(async (id, changes) => {
    await api.updateTournament(id, changes);
    setData(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t => t.id === id ? { ...t, ...changes } : t),
    }));
  }, []);

  const deleteTournament = useCallback(async (id) => {
    await api.deleteTournament(id);
    setData(prev => ({
      ...prev,
      tournaments: prev.tournaments.filter(t => t.id !== id),
      tournamentRegistrations: prev.tournamentRegistrations.filter(r => r.tournamentId !== id),
    }));
  }, []);

  // News
  const addNews = useCallback(async (news) => {
    const result = await api.addNews(news);
    const id = result.id;
    setData(prev => ({ ...prev, news: [{ ...news, id }, ...prev.news] }));
    return id;
  }, []);

  const deleteNews = useCallback(async (id) => {
    await api.deleteNews(id);
    setData(prev => ({ ...prev, news: prev.news.filter(n => n.id !== id) }));
  }, []);

  // Trainers
  const addTrainer = useCallback(async (trainer) => {
    const result = await api.addTrainer(trainer);
    const id = result.id;
    setData(prev => ({
      ...prev,
      users: [...prev.users, { ...trainer, id, role: 'trainer' }],
    }));
    return id;
  }, []);

  const updateTrainer = useCallback(async (id, changes) => {
    await api.updateTrainer(id, changes);
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...changes } : u),
    }));
  }, []);

  const deleteTrainer = useCallback(async (id) => {
    await api.deleteTrainer(id);
    setData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== id),
      groups: prev.groups.filter(g => g.trainerId !== id),
      students: prev.students.filter(s => {
        const group = prev.groups.find(g => g.id === s.groupId);
        return !group || group.trainerId !== id;
      }),
    }));
  }, []);

  // Internal tournaments
  const addInternalTournament = useCallback(async (tournament) => {
    const result = await api.addInternalTournament(tournament);
    const id = result.id;
    setData(prev => ({
      ...prev,
      internalTournaments: [...prev.internalTournaments, { ...tournament, id }],
    }));
    return id;
  }, []);

  const updateInternalTournament = useCallback(async (id, changes) => {
    await api.updateInternalTournament(id, changes);
    setData(prev => ({
      ...prev,
      internalTournaments: prev.internalTournaments.map(t => t.id === id ? { ...t, ...changes } : t),
    }));
  }, []);

  const deleteInternalTournament = useCallback(async (id) => {
    await api.deleteInternalTournament(id);
    setData(prev => ({
      ...prev,
      internalTournaments: prev.internalTournaments.filter(t => t.id !== id),
    }));
  }, []);

  // Attendance
  const saveAttendanceBulk = useCallback(async (groupId, date, records) => {
    await api.saveAttendanceBulk({ groupId, date, records });
    setData(prev => {
      const filtered = prev.attendance.filter(
        a => !(a.groupId === groupId && a.date === date)
      );
      const newRecords = records.map(r => ({ ...r, groupId, date }));
      return { ...prev, attendance: [...filtered, ...newRecords] };
    });
  }, []);

  const qrCheckin = useCallback(async (token) => {
    const result = await api.qrCheckin(token);
    if (result.ok) {
      const today = new Date().toISOString().split('T')[0];
      setData(prev => ({
        ...prev,
        attendance: [...prev.attendance, { ...result.record, date: today }],
      }));
    }
    return result;
  }, []);

  // Materials
  const addMaterial = useCallback(async (material) => {
    const result = await api.addMaterial(material);
    const id = result.id;
    setData(prev => ({ ...prev, materials: [{ ...material, id }, ...prev.materials] }));
    return id;
  }, []);

  const updateMaterial = useCallback(async (id, changes) => {
    await api.updateMaterial(id, changes);
    setData(prev => ({
      ...prev,
      materials: prev.materials.map(m => m.id === id ? { ...m, ...changes } : m),
    }));
  }, []);

  const deleteMaterial = useCallback(async (id) => {
    await api.deleteMaterial(id);
    setData(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
  }, []);

  // Clubs
  const addClub = useCallback(async (club) => {
    const result = await api.addClub(club);
    const id = result.id;
    setData(prev => ({ ...prev, clubs: [{ ...club, id }, ...prev.clubs] }));
    return id;
  }, []);

  const updateClub = useCallback(async (id, changes) => {
    await api.updateClub(id, changes);
    setData(prev => {
      const clubs = prev.clubs.map(c => c.id === id ? { ...c, ...changes } : c);
      let users = prev.users;
      if (changes.headTrainerId !== undefined) {
        users = users.map(u => {
          if (u.clubId === id) {
            return { ...u, isHeadTrainer: u.id === changes.headTrainerId };
          }
          return u;
        });
      }
      return { ...prev, clubs, users };
    });
  }, []);

  const deleteClub = useCallback(async (id) => {
    await api.deleteClub(id);
    setData(prev => ({
      ...prev,
      clubs: prev.clubs.filter(c => c.id !== id),
      users: prev.users.map(u => u.clubId === id ? { ...u, clubId: null, isHeadTrainer: false, clubName: null } : u),
    }));
  }, []);

  const assignTrainerToClub = useCallback(async (clubId, trainerId) => {
    await api.assignTrainerToClub(clubId, trainerId);
    setData(prev => {
      const club = prev.clubs.find(c => c.id === clubId);
      return {
        ...prev,
        users: prev.users.map(u => u.id === trainerId ? { ...u, clubId, clubName: club?.name } : u),
      };
    });
  }, []);

  const removeTrainerFromClub = useCallback(async (clubId, trainerId) => {
    await api.removeTrainerFromClub(clubId, trainerId);
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === trainerId ? { ...u, clubId: null, isHeadTrainer: false, clubName: null } : u),
    }));
  }, []);

  // Branches
  const addBranch = useCallback(async (branch) => {
    const result = await api.addBranch(branch);
    const id = result.id;
    setData(prev => ({ ...prev, branches: [{ ...branch, id }, ...prev.branches] }));
    return id;
  }, []);

  const updateBranch = useCallback(async (id, changes) => {
    await api.updateBranch(id, changes);
    setData(prev => ({
      ...prev,
      branches: prev.branches.map(b => b.id === id ? { ...b, ...changes } : b),
    }));
  }, []);

  const deleteBranch = useCallback(async (id) => {
    await api.deleteBranch(id);
    setData(prev => ({ ...prev, branches: prev.branches.filter(b => b.id !== id) }));
  }, []);

  // Parents
  const addParent = useCallback(async (parent) => {
    const result = await api.addParent(parent);
    const id = result.id;
    setData(prev => ({ ...prev, parents: [...prev.parents, { ...parent, id }] }));
    return id;
  }, []);

  const updateParent = useCallback(async (id, changes) => {
    await api.updateParent(id, changes);
    setData(prev => ({
      ...prev,
      parents: prev.parents.map(p => p.id === id ? { ...p, ...changes } : p),
    }));
  }, []);

  const deleteParent = useCallback(async (id) => {
    await api.deleteParent(id);
    setData(prev => ({ ...prev, parents: prev.parents.filter(p => p.id !== id) }));
  }, []);

  // Student groups
  const updateStudentGroups = useCallback(async (studentId, groupIds) => {
    await api.updateStudentGroups(studentId, groupIds);
    setData(prev => ({
      ...prev,
      studentGroups: [
        ...prev.studentGroups.filter(sg => sg.studentId !== studentId),
        ...groupIds.map(gid => ({ studentId, groupId: gid })),
      ],
      students: prev.students.map(s =>
        s.id === studentId ? { ...s, groupId: groupIds[0] || null } : s
      ),
    }));
  }, []);

  // Tournament registrations
  const registerTournament = useCallback(async (tournamentId, studentId) => {
    await api.registerTournament(tournamentId, studentId);
    setData(prev => ({
      ...prev,
      tournamentRegistrations: [...prev.tournamentRegistrations, { tournamentId, studentId }],
    }));
  }, []);

  const unregisterTournament = useCallback(async (tournamentId, studentId) => {
    await api.unregisterTournament(tournamentId, studentId);
    setData(prev => ({
      ...prev,
      tournamentRegistrations: prev.tournamentRegistrations.filter(
        r => !(r.tournamentId === tournamentId && r.studentId === studentId)
      ),
    }));
  }, []);

  // Author
  const updateAuthor = useCallback(async (authorData) => {
    await api.updateAuthor(authorData);
    setData(prev => ({ ...prev, authorInfo: { ...prev.authorInfo, ...authorData } }));
  }, []);

  // Registrations
  const approveRegistration = useCallback(async (id) => {
    const result = await api.approveRegistration(id);
    setData(prev => ({
      ...prev,
      pendingRegistrations: prev.pendingRegistrations.filter(r => r.id !== id),
    }));
    return result;
  }, []);

  const rejectRegistration = useCallback(async (id) => {
    await api.rejectRegistration(id);
    setData(prev => ({
      ...prev,
      pendingRegistrations: prev.pendingRegistrations.filter(r => r.id !== id),
    }));
  }, []);

  const value = {
    ...data, loading, reload, update,
    addStudent, updateStudent, deleteStudent,
    addGroup, updateGroup, deleteGroup,
    addTransaction, updateTransaction, deleteTransaction,
    addTournament, updateTournament, deleteTournament,
    addNews, deleteNews,
    addTrainer, updateTrainer, deleteTrainer,
    addInternalTournament, updateInternalTournament, deleteInternalTournament,
    saveAttendanceBulk, qrCheckin,
    addMaterial, updateMaterial, deleteMaterial,
    addClub, updateClub, deleteClub, assignTrainerToClub, removeTrainerFromClub,
    addBranch, updateBranch, deleteBranch,
    addParent, updateParent, deleteParent,
    updateStudentGroups,
    registerTournament, unregisterTournament,
    updateAuthor,
    approveRegistration, rejectRegistration,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
