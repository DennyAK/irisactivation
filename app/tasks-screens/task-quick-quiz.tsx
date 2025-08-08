import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, ActivityIndicator, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function TaskQuickQuizScreen() {
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

  // Fetch all quiz questions for CRUD
  const fetchAllQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const questionsCollection = collection(db, 'quiz_questions');
      const snapshot = await getDocs(questionsCollection);
      const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllQuestions(questions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quiz questions list.');
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
      Alert.alert('Error', 'Failed to save question.');
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
    Alert.alert('Delete Question', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'quiz_questions', id));
          fetchAllQuestions();
        } catch (error) {
          Alert.alert('Error', 'Failed to delete question.');
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
      Alert.alert("Error", "Failed to fetch quizzes.");
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
      createdAt: serverTimestamp()
    }).then((docRef) => {
      // Update the just-created document to set takeQuickQuizId to its own id
      updateDoc(docRef, { takeQuickQuizId: docRef.id }).then(() => {
        setIsAddModalVisible(false);
        resetFormData();
        fetchQuizzes();
      });
    }).catch(error => {
      Alert.alert("Add Failed", error.message);
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
      }).then(() => {
        setIsEditModalVisible(false);
        resetFormData();
        setSelectedQuiz(null);
        fetchQuizzes();
      }).catch(error => {
        Alert.alert("Update Failed", error.message);
      });
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    Alert.alert("Delete Quiz", "Are you sure you want to delete this quiz record?", [
      { text: "Cancel", style: "cancel" },
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
      Alert.alert('Error', 'Failed to load quiz questions.');
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
          createdAt: serverTimestamp()
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
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Quiz: {item.id}</Text>
          <StatusPill label={status} tone={tone as any} />
        </View>
        <Text style={styles.meta}>Assigned BA: <Text style={styles.metaValue}>{item.assignedToBA || '-'}</Text></Text>
        <Text style={styles.meta}>Date: <Text style={styles.metaValue}>{item.quizDate?.toDate ? item.quizDate.toDate().toLocaleDateString() : item.quizDate || '-'}</Text></Text>
        <Text style={styles.meta}>Result: <Text style={styles.metaValue}>{item.quickQuizResult || '-'}</Text></Text>
        <Text style={styles.meta}>Created: <Text style={styles.metaValue}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text></Text>
        <Text style={styles.meta}>Task ID: <Text style={styles.metaValue}>{item.tasksId || '-'}</Text></Text>
        {score < 8 && (
          <PrimaryButton title="Take Quiz" onPress={() => handleTakeQuizNow(item.takeQuickQuizId, item.id)} style={styles.actionBtn} />
        )}
      </View>
    );
  };

  const renderModalFields = () => (
    <>
      <TextInput style={styles.input} value={formData.userId} onChangeText={(text) => setFormData({...formData, userId: text})} placeholder="User ID" />
      <TextInput style={styles.input} value={formData.takeQuickQuizId} onChangeText={(text) => setFormData({...formData, takeQuickQuizId: text})} placeholder="Quiz ID" />
      <TextInput style={styles.input} value={formData.quizDate} onChangeText={(text) => setFormData({...formData, quizDate: text})} placeholder="Quiz Date (YYYY-MM-DD)" />
      <TextInput style={styles.input} value={formData.quickQuizResult} onChangeText={(text) => setFormData({...formData, quickQuizResult: text})} placeholder="Quiz Result" />
    </>
  );

  return (
  <View style={styles.screen}>
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
  <Text style={styles.screenTitle}>Task Quick Quiz</Text>


        {/* Quiz Questions List for Superadmin/Admin */}
        {(userRole === 'superadmin' || userRole === 'admin') && (
          <View style={styles.block}>
            <View style={styles.blockHeaderRow}>
              <Text style={styles.blockTitle}>Quiz Questions</Text>
              <PrimaryButton title="Add" onPress={() => setIsQuestionModalVisible(true)} style={styles.addBtn} />
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
                  <Text style={styles.meta}>Answer: <Text style={styles.metaValue}>{item.answer}</Text></Text>
                  <View style={styles.actionsRow}>
                    <SecondaryButton title="Edit" onPress={() => handleEditQuestion(item)} style={styles.actionBtn} />
                    <SecondaryButton title="Delete" onPress={() => handleDeleteQuestion(item.id)} style={styles.actionBtn} />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Quiz Results List - always visible below questions */}
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Quiz Results</Text>
          {quizzes.length === 0 ? (
            <Text>No quiz records found.</Text>
          ) : (
            quizzes.map(item => (
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
          <View style={styles.modalContent}>
            {quizScore === null ? (
              quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length ? (
                <>
                  <Text style={styles.modalTitle}>Question {currentQuestionIndex + 1} of {quizQuestions.length}</Text>
                  <Text style={{ marginBottom: 16 }}>{quizQuestions[currentQuestionIndex].question}</Text>
                  {Object.entries(quizQuestions[currentQuestionIndex].options).map(([key, value]) => (
                    <PrimaryButton key={key} title={`${key}: ${value}`} onPress={() => handleAnswer(key)} style={styles.actionBtn} />
                  ))}
                </>
              ) : <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.modalTitle}>Quiz Complete!</Text>
                <Text>Your Score: {quizScore}/10</Text>
                <PrimaryButton title="Close" onPress={handleQuizModalClose} />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Question Modal */}
      <Modal visible={isQuestionModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsQuestionModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{questionForm.id ? 'Edit' : 'Add'} Quiz Question</Text>
            <TextInput
              style={styles.input}
              value={questionForm.question}
              onChangeText={text => setQuestionForm({ ...questionForm, question: text })}
              placeholder="Question"
            />
            {['A', 'B', 'C', 'D'].map(opt => (
              <TextInput
                key={opt}
                style={styles.input}
                value={questionForm.options[opt as keyof typeof questionForm.options]}
                onChangeText={text => setQuestionForm({ ...questionForm, options: { ...questionForm.options, [opt as keyof typeof questionForm.options]: text } })}
                placeholder={`Option ${opt}`}
              />
            ))}
            <TextInput
              style={styles.input}
              value={questionForm.answer}
              onChangeText={text => setQuestionForm({ ...questionForm, answer: text })}
              placeholder="Answer (A/B/C/D)"
              maxLength={1}
            />
            <View style={styles.actionsRow}>
              <PrimaryButton title={questionForm.id ? 'Update' : 'Add'} onPress={handleSaveQuestion} style={styles.actionBtn} />
              <SecondaryButton title="Cancel" onPress={() => { setIsQuestionModalVisible(false); setQuestionForm({ question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A', id: null }); }} style={styles.actionBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Add Quiz Record Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Quiz Record</Text>
            {renderModalFields()}
            <View style={styles.actionsRow}>
              <PrimaryButton title="Add" onPress={handleAddQuiz} style={styles.actionBtn} />
              <SecondaryButton title="Cancel" onPress={() => { setIsAddModalVisible(false); resetFormData(); }} style={styles.actionBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Edit Quiz Record Modal */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Quiz Record</Text>
            {renderModalFields()}
            <View style={styles.actionsRow}>
              <PrimaryButton title="Update" onPress={handleUpdateQuiz} style={styles.actionBtn} />
              <SecondaryButton title="Cancel" onPress={() => { setIsEditModalVisible(false); resetFormData(); }} style={styles.actionBtn} />
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