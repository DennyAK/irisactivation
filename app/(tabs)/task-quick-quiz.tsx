import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
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
    return <ActivityIndicator />;
  }

  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';
  const canUpdate = canManage || userRole === 'Iris - BA' || userRole === 'Iris - TL';

  const renderQuiz = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>Quiz ID: {item.id}</Text>
      <Text>Assigned to BA: {item.assignedToBA || '-'}</Text>
      <Text>Date: {item.quizDate?.toDate ? item.quizDate.toDate().toLocaleDateString() : item.quizDate}</Text>
      <Text>Result: {item.quickQuizResult}</Text>
      {/* Task Quick Quiz Status logic */}
      <Text>Task Quick Quiz Status: {item.taskQuickQuizStatus || (() => {
        let status = 'Pending';
        let score = 0;
        if (typeof item.quickQuizResult === 'string') {
          const match = item.quickQuizResult.match(/(\d+)[^\d]*/);
          if (match) {
            score = parseInt(match[1], 10);
          }
        }
        if (score >= 8) {
          status = 'Done';
        }
        return status;
      })()}</Text>
      <Text>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
      <Text>Created By: {item.createdBy || '-'}</Text>
      <Text>Task ID: {item.tasksId || '-'}</Text>
      <View style={styles.buttonContainer}>
        {/* Hide Take Quiz Now if status is Done */}
        {(() => {
          let score = 0;
          if (typeof item.quickQuizResult === 'string') {
            const match = item.quickQuizResult.match(/(\d+)[^\d]*/);
            if (match) {
              score = parseInt(match[1], 10);
            }
          }
          if (score < 8) {
            return <Button title="Take Quiz Now" onPress={() => handleTakeQuizNow(item.takeQuickQuizId, item.id)} />;
          }
          return null;
        })()}
      </View>
    </View>
  );

  const renderModalFields = () => (
    <>
      <TextInput style={styles.input} value={formData.userId} onChangeText={(text) => setFormData({...formData, userId: text})} placeholder="User ID" />
      <TextInput style={styles.input} value={formData.takeQuickQuizId} onChangeText={(text) => setFormData({...formData, takeQuickQuizId: text})} placeholder="Quiz ID" />
      <TextInput style={styles.input} value={formData.quizDate} onChangeText={(text) => setFormData({...formData, quizDate: text})} placeholder="Quiz Date (YYYY-MM-DD)" />
      <TextInput style={styles.input} value={formData.quickQuizResult} onChangeText={(text) => setFormData({...formData, quickQuizResult: text})} placeholder="Quiz Result" />
    </>
  );

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>Task Quick Quiz</Text>


        {/* Quiz Questions List for Superadmin/Admin */}
        {(userRole === 'superadmin' || userRole === 'admin') && (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.title}>Quiz Questions (CRUD)</Text>
            <Button title="Add New Question" onPress={() => setIsQuestionModalVisible(true)} />
            {questionsLoading ? (
              <ActivityIndicator />
            ) : (
              allQuestions.map(item => (
                <View style={styles.itemContainer} key={item.id}>
                  <Text style={styles.itemTitle}>{item.question}</Text>
                  {Object.entries(item.options).map(([key, value]) => (
                    <Text key={key}>{key}: {String(value)}</Text>
                  ))}
                  <Text>Answer: {item.answer}</Text>
                  <View style={styles.buttonContainer}>
                    <Button title="Edit" onPress={() => handleEditQuestion(item)} />
                    <Button title="Delete" onPress={() => handleDeleteQuestion(item.id)} />
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Quiz Results List - always visible below questions */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.title}>Quiz Results</Text>
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
                  <Text style={styles.title}>Question {currentQuestionIndex + 1} of {quizQuestions.length}</Text>
                  <Text style={{ marginBottom: 16 }}>{quizQuestions[currentQuestionIndex].question}</Text>
                  {Object.entries(quizQuestions[currentQuestionIndex].options).map(([key, value]) => (
                    <Button key={key} title={`${key}: ${value}`} onPress={() => handleAnswer(key)} />
                  ))}
                </>
              ) : <ActivityIndicator />
            ) : (
              <>
                <Text style={styles.title}>Quiz Complete!</Text>
                <Text>Your Score: {quizScore}/10</Text>
                <Button title="Close" onPress={handleQuizModalClose} />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add/Edit Question Modal */}
      <Modal visible={isQuestionModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsQuestionModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>{questionForm.id ? 'Edit' : 'Add'} Quiz Question</Text>
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
            <View style={styles.buttonContainer}>
              <Button title={questionForm.id ? 'Update' : 'Add'} onPress={handleSaveQuestion} />
              <Button title="Cancel" onPress={() => { setIsQuestionModalVisible(false); setQuestionForm({ question: '', options: { A: '', B: '', C: '', D: '' }, answer: 'A', id: null }); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Add Quiz Record Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Add Quiz Record</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Add" onPress={handleAddQuiz} />
              <Button title="Cancel" onPress={() => { setIsAddModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Edit Quiz Record Modal */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Quiz Record</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={handleUpdateQuiz} />
              <Button title="Cancel" onPress={() => { setIsEditModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }
});