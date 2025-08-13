import { useState, useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, ActivityIndicator, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import FilterHeader from '../../components/ui/FilterHeader';
import useDebouncedValue from '../../components/hooks/useDebouncedValue';
import EmptyState from '../../components/ui/EmptyState';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function TaskQuickQuizScreen() {
  const params = useLocalSearchParams<{ quizId?: string }>();
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const colors = {
    body: isDark ? '#0b1220' : palette.bg,
    surface: isDark ? '#111827' : palette.surface,
    surfaceAlt: isDark ? '#0f172a' : palette.surfaceAlt,
    border: isDark ? '#1f2937' : palette.border,
    text: isDark ? '#e5e7eb' : palette.text,
    muted: isDark ? '#94a3b8' : palette.textMuted,
    placeholder: isDark ? '#64748b' : '#9ca3af',
  };
  const inputCommonProps = isDark ? { placeholderTextColor: colors.placeholder as any } : {};
  // Handler for 'Take Quiz Now' button
  const handleTakeQuizNow = (quizId: string, docId: string) => {
    setActiveQuizId(quizId);
    setActiveQuizDocId(docId);
    fetchQuizQuestions();
  };
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  // Quiz Questions CRUD states
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [isQuestionModalVisible, setIsQuestionModalVisible] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: { A: '', B: '', C: '', D: '' },
    answer: 'A',
    id: null,
  });
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    takeQuickQuizId: '',
    quizDate: '',
    quickQuizResult: '',
  });
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Quiz modal states
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuizDocId, setActiveQuizDocId] = useState<string | null>(null);
  // Filters (search-only)
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const filteredQuizzes = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(item => {
      const outlet = String(item.outletName || '').toLowerCase();
      const id = String(item.id || '').toLowerCase();
      return outlet.includes(q) || id.includes(q);
    });
  }, [quizzes, debouncedSearch]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          }
        });
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (userRole) {
      fetchAllQuestions();
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole && isFocused) {
      fetchQuizzes();
    }
  }, [userRole, isFocused]);

  // Auto-focus doc when navigated with quizId (AM review or TL/BA action)
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    const shouldOpen = !!params?.quizId && !!userRole && isFocused && !autoOpened;
    if (!shouldOpen) return;
    (async () => {
      try {
        const id = String(params.quizId);
        const snap = await getDoc(doc(db, 'task_quick_quiz', id));
        if (snap.exists()) {
          setSelectedQuiz({ id: snap.id, ...snap.data() });
          setIsEditModalVisible(true); // open edit modal if role allows; for AM, they'll use details modal if present
        }
      } catch {}
      setAutoOpened(true);
    })();
  }, [params?.quizId, userRole, isFocused, autoOpened]);

  // Fetch all quiz questions for CRUD
  const fetchAllQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const questionsCollection = collection(db, 'quiz_questions');
      const snapshot = await getDocs(questionsCollection);
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllQuestions(questions);
    } catch (error) {
      Alert.alert(t('error'), t('failed_to_fetch_reports'));
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Add or update question
  const handleSaveQuestion = async () => {
    try {
      if (questionForm.id) {
        // Update
        const qDoc = doc(db, 'quiz_questions', questionForm.id);
        await updateDoc(qDoc, {
          question: questionForm.question,
          options: questionForm.options,
          answer: questionForm.answer,
        });
      } else {
        // Add
        await addDoc(collection(db, 'quiz_questions'), {
          question: questionForm.question,
          options: questionForm.options,
          answer: questionForm.answer,
        });
      }
      setIsQuestionModalVisible(false);
      setQuestionForm({ question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A', id: null });
      fetchAllQuestions();
    } catch (error) {
      Alert.alert(t('error'), t('update_failed'));
    }
  };

  // Edit question
  const handleEditQuestion = (q: any) => {
    setQuestionForm({
      question: q.question,
      options: { ...q.options },
      answer: q.answer,
      id: q.id,
    });
    setIsQuestionModalVisible(true);
  };

  // Delete question
  const handleDeleteQuestion = async (id: string) => {
    Alert.alert(t('delete'), t('are_you_sure'), [
      { text: t('cancel'), style: 'cancel' },
      { text: 'OK', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'quiz_questions', id));
          fetchAllQuestions();
        } catch (error) {
          Alert.alert(t('error'), t('update_failed'));
        }
      }}
    ]);
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const quizzesCollection = collection(db, 'task_quick_quiz');
      const quizSnapshot = await getDocs(quizzesCollection);
      let quizList = quizSnapshot.docs.map(doc => ({ id: doc.id, assignedToBA: doc.data().assignedToBA, assignedToTL: doc.data().assignedToTL, ...doc.data() }));
      // Filter for BA role: only show records assigned to current user
      if (userRole === 'Iris - BA' && auth.currentUser?.uid) {
        quizList = quizList.filter(q => q?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL role: only show records assigned to current TL
      if (userRole === 'Iris - TL' && auth.currentUser?.uid) {
        quizList = quizList.filter(q => q?.assignedToTL === auth.currentUser?.uid);
      }
      setQuizzes(quizList);
    } catch (error) {
      console.error("Error fetching quizzes: ", error);
      Alert.alert(t('error'), t('failed_to_fetch_reports'));
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      userId: '', takeQuickQuizId: '', quizDate: '', quickQuizResult: '',
    });
  };

  const handleAddQuiz = () => {
    addDoc(collection(db, "task_quick_quiz"), {
      ...formData,
      quizDate: new Date(formData.quizDate),
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || 'unknown'
    }).then((docRef) => {
      // Update the just-created document to set takeQuickQuizId to its own id
      updateDoc(docRef, { takeQuickQuizId: docRef.id, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' }).then(() => {
        setIsAddModalVisible(false);
        resetFormData();
        fetchQuizzes();
      });
    }).catch(error => {
      Alert.alert(t('add_failed'), error.message);
    });
  };

  const handleEditQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    let formattedDate = '';
    if (quiz.quizDate) {
      if (typeof quiz.quizDate.toDate === 'function') {
        formattedDate = quiz.quizDate.toDate().toISOString().split('T')[0];
      } else if (quiz.quizDate instanceof Date) {
        formattedDate = quiz.quizDate.toISOString().split('T')[0];
      } else if (typeof quiz.quizDate === 'string') {
        formattedDate = quiz.quizDate;
      }
    }
    setFormData({
      userId: quiz.userId || '',
      takeQuickQuizId: quiz.takeQuickQuizId || '',
      quizDate: formattedDate,
      quickQuizResult: quiz.quickQuizResult || '',
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateQuiz = () => {
    if (selectedQuiz) {
      const quizDoc = doc(db, "task_quick_quiz", selectedQuiz.id);
      updateDoc(quizDoc, {
        ...formData,
        quizDate: new Date(formData.quizDate),
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'unknown'
      }).then(() => {
        setIsEditModalVisible(false);
        resetFormData();
        setSelectedQuiz(null);
        fetchQuizzes();
      }).catch(error => {
        Alert.alert(t('update_failed'), error.message);
      });
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    Alert.alert(t('delete'), t('are_you_sure'), [
      { text: t('cancel'), style: "cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "task_quick_quiz", quizId)).then(() => {
          fetchQuizzes();
        });
      }}
    ]);
  };

  // --- Take Quiz Feature ---
  const fetchQuizQuestions = async () => {
    setQuizLoading(true);
    try {
      const questionsCollection = collection(db, 'quiz_questions');
      const snapshot = await getDocs(questionsCollection);
      let questions = snapshot.docs.map(doc => doc.data());
      questions = questions.sort(() => Math.random() - 0.5).slice(0, 10);
      setQuizQuestions(questions);
      setCurrentQuestionIndex(0);
      setUserAnswers([]);
      setQuizScore(null);
      setQuizModalVisible(true);
    } catch (error) {
      Alert.alert(t('error'), t('failed_to_fetch_reports'));
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setUserAnswers(prev => [...prev, answer]);
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      const score = quizQuestions.reduce((acc, q, idx) => acc + (userAnswers[idx] === q.answer ? 1 : 0), 0);
      setQuizScore(score);
  const userId = auth.currentUser?.uid || 'anonymous';
      // Determine status
      let status = 'Pending';
      if (score >= 8) {
        status = 'Done';
      }
      // If activeQuizDocId is set, update the result for that quiz record
      if (activeQuizDocId) {
        const quizDoc = doc(db, 'task_quick_quiz', activeQuizDocId);
        updateDoc(quizDoc, {
          userId,
          takeQuickQuizId: activeQuizId || '',
          quizDate: new Date(),
          quickQuizResult: `${score}/10`,
          taskQuickQuizStatus: status,
          updatedAt: serverTimestamp(),
          updatedBy: auth.currentUser?.uid || 'unknown'
        }).then(() => {
          fetchQuizzes();
        });
      } else {
        // fallback: create new record
        addDoc(collection(db, 'task_quick_quiz'), {
          userId,
          takeQuickQuizId: activeQuizId || '',
          quizDate: new Date(),
          quickQuizResult: `${score}/10`,
          taskQuickQuizStatus: status,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'unknown'
        });
      }
    }
  };

  const handleQuizModalClose = () => {
    setQuizModalVisible(false);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setQuizScore(null);
    setActiveQuizId(null);
    setActiveQuizDocId(null);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: spacing(10) }} />;
  }

  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';
  const canUpdate = canManage || userRole === 'Iris - BA' || userRole === 'Iris - TL';

  const renderQuiz = ({ item }: { item: any }) => {
    let score = 0;
    if (typeof item.quickQuizResult === 'string') {
      const match = item.quickQuizResult.match(/(\d+)[^\d]*/);
      if (match) score = parseInt(match[1], 10);
    }
    let status = item.taskQuickQuizStatus;
    if (!status) {
      status = score >= 8 ? 'Done' : 'Pending';
    }
    const tone = status === 'Done' ? 'success' : 'warning';
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1, shadowOpacity: 0 } : {}]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('quiz_label')}: {item.id}</Text>
          <StatusPill label={status} tone={tone as any} />
        </View>
        <Text style={[styles.meta, { color: colors.muted }]}>{t('assigned_ba')}: <Text style={[styles.metaValue, { color: colors.text }]}>{item.assignedToBA || '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{t('date')}: <Text style={[styles.metaValue, { color: colors.text }]}>{item.quizDate?.toDate ? item.quizDate.toDate().toLocaleDateString() : item.quizDate || '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{t('result')}: <Text style={[styles.metaValue, { color: colors.text }]}>{item.quickQuizResult || '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{t('created')}: <Text style={[styles.metaValue, { color: colors.text }]}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>{t('task_id')}: <Text style={[styles.metaValue, { color: colors.text }]}>{item.tasksId || '-'}</Text></Text>
        {score < 8 && (
          <PrimaryButton title={t('take_quiz')} onPress={() => handleTakeQuizNow(item.takeQuickQuizId, item.id)} style={styles.actionBtn} />
        )}
      </View>
    );
  };

  const renderModalFields = () => (
    <>
  <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]} value={formData.userId} onChangeText={(text) => setFormData({...formData, userId: text})} placeholder={t('user_id')} {...inputCommonProps} />
  <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]} value={formData.takeQuickQuizId} onChangeText={(text) => setFormData({...formData, takeQuickQuizId: text})} placeholder={t('quiz_id')} {...inputCommonProps} />
  <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]} value={formData.quizDate} onChangeText={(text) => setFormData({...formData, quizDate: text})} placeholder={t('quiz_date_hint')} {...inputCommonProps} />
  <TextInput style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]} value={formData.quickQuizResult} onChangeText={(text) => setFormData({...formData, quickQuizResult: text})} placeholder={t('quick_quiz_result')} {...inputCommonProps} />
    </>
  );

  return (
  <View style={[styles.screen, { backgroundColor: colors.body }]}>
      <FilterHeader
        title={t('quick_quiz')}
        search={search}
        status={''}
  statusOptions={[{ label: t('all'), value: '' }]} // placeholder, status not used
        placeholder={t('search_outlet_or_id')}
        storageKey="filters:quiz"
        onApply={({ search: s }) => { setSearch(s); }}
        onClear={() => { setSearch(''); }}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchQuizzes();
              setRefreshing(false);
            }}
          />
        }
      >
  {/* Legacy title removed in favor of FilterHeader */}


        {/* Quiz Questions List for Superadmin/Admin */}
        {(userRole === 'superadmin' || userRole === 'admin') && (
          <View style={styles.block}>
            <View style={styles.blockHeaderRow}>
              <Text style={[styles.blockTitle, { color: colors.text }]}>{t('quiz_questions')}</Text>
              <PrimaryButton title={t('add')} onPress={() => setIsQuestionModalVisible(true)} style={styles.addBtn} />
            </View>
            {questionsLoading ? (
              <ActivityIndicator />
            ) : (
              allQuestions.map(item => (
                <View style={styles.card} key={item.id}>
                  <Text style={styles.cardTitle}>{item.question}</Text>
                  {Object.entries(item.options).map(([key, value]) => (
                    <Text key={key} style={styles.meta}>{key}: <Text style={styles.metaValue}>{String(value)}</Text></Text>
                  ))}
                  <Text style={styles.meta}>{t('answer')}: <Text style={styles.metaValue}>{item.answer}</Text></Text>
                  <View style={styles.actionsRow}>
                    <SecondaryButton title={t('edit')} onPress={() => handleEditQuestion(item)} style={styles.actionBtn} />
                    <SecondaryButton title={t('delete')} onPress={() => handleDeleteQuestion(item.id)} style={styles.actionBtn} />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Quiz Results List - always visible below questions */}
        <View style={styles.block}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>{t('quiz_results')}</Text>
          {filteredQuizzes.length === 0 ? (
            <EmptyState onReset={() => setSearch('')} />
          ) : (
            filteredQuizzes.map(item => (
              <View key={item.id}>
                {renderQuiz({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Quiz Modal */}
      <Modal visible={quizModalVisible} transparent={true} animationType="slide" onRequestClose={handleQuizModalClose}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1 } : {}]}>
            {quizScore === null ? (
              quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length ? (
                <>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>{t('question_x_of_y').replace('{x}', String(currentQuestionIndex + 1)).replace('{y}', String(quizQuestions.length))}</Text>
                  <Text style={{ marginBottom: 16, color: colors.text }}>{quizQuestions[currentQuestionIndex].question}</Text>
                  {Object.entries(quizQuestions[currentQuestionIndex].options).map(([key, value]) => (
                    <PrimaryButton key={key} title={`${key}: ${value}`} onPress={() => handleAnswer(key)} style={styles.actionBtn} />
                  ))}
                </>
              ) : <ActivityIndicator />
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('quiz_complete')}</Text>
                <Text style={{ color: colors.text }}>{t('your_score')}: {quizScore}/10</Text>
                <PrimaryButton title={t('close')} onPress={handleQuizModalClose} />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Question Modal */}
      <Modal visible={isQuestionModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsQuestionModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1 } : {}]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{questionForm.id ? t('edit') : t('add')} {t('quiz_question')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              value={questionForm.question}
              onChangeText={text => setQuestionForm({ ...questionForm, question: text })}
              placeholder={t('question')}
              {...inputCommonProps}
            />
            {['A', 'B', 'C', 'D'].map(opt => (
              <TextInput
                key={opt}
                style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
                value={questionForm.options[opt as keyof typeof questionForm.options]}
                onChangeText={text => setQuestionForm({ ...questionForm, options: { ...questionForm.options, [opt as keyof typeof questionForm.options]: text } })}
                placeholder={`${t('option')} ${opt}`}
                {...inputCommonProps}
              />
            ))}
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              value={questionForm.answer}
              onChangeText={text => setQuestionForm({ ...questionForm, answer: text })}
              placeholder={t('answer_abcd')}
              maxLength={1}
              {...inputCommonProps}
            />
            <View style={styles.actionsRow}>
              <PrimaryButton title={questionForm.id ? t('update') : t('add')} onPress={handleSaveQuestion} style={styles.actionBtn} />
              <SecondaryButton title={t('cancel')} onPress={() => { setIsQuestionModalVisible(false); setQuestionForm({ question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A', id: null }); }} style={styles.actionBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Add Quiz Record Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1 } : {}]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('add_quiz_record')}</Text>
            {renderModalFields()}
            <View style={styles.actionsRow}>
              <PrimaryButton title={t('add')} onPress={handleAddQuiz} style={styles.actionBtn} />
              <SecondaryButton title={t('cancel')} onPress={() => { setIsAddModalVisible(false); resetFormData(); }} style={styles.actionBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Edit Quiz Record Modal */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1 } : {}]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('edit_quiz_record')}</Text>
            {renderModalFields()}
            <View style={styles.actionsRow}>
              <PrimaryButton title={t('update')} onPress={handleUpdateQuiz} style={styles.actionBtn} />
              <SecondaryButton title={t('cancel')} onPress={() => { setIsEditModalVisible(false); resetFormData(); }} style={styles.actionBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Legacy references (will be gradually removed if unused)
  container: { flex: 1, padding: spacing(5) },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: spacing(5), textAlign: 'center' },
  itemContainer: { marginBottom: spacing(5), padding: spacing(5), borderColor: palette.border, borderWidth: 1, borderRadius: radius.md },
  itemTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: spacing(2) },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing(4) },
  // New screen layout
  screen: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(5) },
  screenTitle: { ...typography.h1, color: palette.text, marginBottom: spacing(6), textAlign: 'center' },
  block: { marginTop: spacing(8) },
  blockHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(4) },
  blockTitle: { ...typography.h2, color: palette.text, flex: 1 },
  addBtn: { paddingHorizontal: spacing(6) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing(3) },
  meta: { fontSize: 12, color: palette.textMuted, marginBottom: 2 },
  metaValue: { color: palette.text, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(4) },
  actionBtn: { flexGrow: 1, marginRight: spacing(3), marginBottom: spacing(3) },
  // Modal & forms
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing(6) },
  modalContent: { width: '100%', backgroundColor: palette.surface, padding: spacing(6), borderRadius: radius.lg },
  modalTitle: { ...typography.h2, color: palette.text, textAlign: 'center', marginBottom: spacing(5) },
  input: { height: 44, borderColor: palette.border, borderWidth: 1, marginBottom: spacing(4), paddingHorizontal: spacing(3), borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
});