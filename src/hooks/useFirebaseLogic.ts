import { useState, useEffect, useCallback } from 'react';
import { 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  increment,
  doc,
  updateDoc,
  collection,
  addDoc,
  query,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { firestoreService, handleFirestoreError, OperationType } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for Study History logic.
 */
export function useStudyHistory() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = firestoreService.subscribe(
      'studySessions',
      [where('uid', '==', profile.uid), orderBy('createdAt', 'desc'), limit(50)],
      (data) => {
        setSessions(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  return { sessions, loading };
}

/**
 * Custom hook for User Economy & Stats logic.
 */
export function useUserStats() {
  const { profile } = useAuth();

  const addCoins = useCallback(async (amount: number) => {
    if (!profile?.uid) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        coins: increment(amount)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  }, [profile?.uid]);

  const addXP = useCallback(async (amount: number) => {
    if (!profile?.uid) return;
    try {
      const userRef = doc(db, 'users', profile.uid);
      const newXP = (profile.xp || 0) + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;
      
      await updateDoc(userRef, {
        xp: increment(amount),
        level: newLevel
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${profile.uid}`);
    }
  }, [profile?.uid, profile?.xp]);

  return { addCoins, addXP };
}

/**
 * Custom hook for Quiz Results logic.
 */
export function useQuizResults() {
  const { profile } = useAuth();
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!profile?.uid) return;

    const unsubscribe = firestoreService.subscribe(
      'quizResults',
      [where('uid', '==', profile.uid), orderBy('timestamp', 'desc'), limit(20)],
      (data) => setResults(data)
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  const saveResult = async (resultData: any) => {
    if (!profile?.uid) return;
    try {
      await addDoc(collection(db, 'quizResults'), {
        ...resultData,
        uid: profile.uid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quizResults');
    }
  };

  return { results, saveResult };
}

/**
 * Custom hook for Teacher Dashboard: All Quiz Results.
 */
export function useAllQuizResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestoreService.subscribe(
      'quizResults',
      [orderBy('timestamp', 'desc'), limit(100)],
      (data) => {
        setResults(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { results, loading };
}

/**
 * Custom hook for Question Bank logic.
 */
export function useQuestions() {
  const { profile } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'questions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addQuestion = async (questionData: any) => {
    if (!profile?.uid) return;
    try {
      return await firestoreService.addDocument('questions', {
        ...questionData,
        teacherId: profile.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'questions');
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      return await firestoreService.deleteDocument('questions', id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `questions/${id}`);
    }
  };

  return { questions, loading, addQuestion, deleteQuestion };
}

/**
 * Custom hook for fetching filtered questions for a quiz.
 */
export function useFilteredQuestions(className: string, subject: string) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!className || !subject) return;

    const q = query(
      collection(db, 'questions'),
      where('class', '==', className),
      where('subject', '==', subject),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'questions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [className, subject]);

  return { questions, loading };
}
