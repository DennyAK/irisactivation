const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const questions = [
  {
    question: "What is the capital of Indonesia?",
    options: { A: "Jakarta", B: "Bali", C: "Surabaya", D: "Medan" },
    answer: "A"
  },
  {
    question: "What color is the sky on a clear day?",
    options: { A: "Blue", B: "Green", C: "Red", D: "Yellow" },
    answer: "A"
  },
  {
    question: "How many days are in a week?",
    options: { A: "5", B: "6", C: "7", D: "8" },
    answer: "C"
  },
  {
    question: "What is 2 + 2?",
    options: { A: "3", B: "4", C: "5", D: "6" },
    answer: "B"
  },
  {
    question: "Which animal barks?",
    options: { A: "Cat", B: "Dog", C: "Cow", D: "Bird" },
    answer: "B"
  },
  {
    question: "What is the largest planet in our solar system?",
    options: { A: "Earth", B: "Mars", C: "Jupiter", D: "Venus" },
    answer: "C"
  },
  {
    question: "What do bees make?",
    options: { A: "Milk", B: "Honey", C: "Bread", D: "Cheese" },
    answer: "B"
  },
  {
    question: "What is the boiling point of water (°C)?",
    options: { A: "50", B: "75", C: "100", D: "150" },
    answer: "C"
  },
  {
    question: "What is the main ingredient in bread?",
    options: { A: "Rice", B: "Wheat", C: "Corn", D: "Potato" },
    answer: "B"
  },
  {
    question: "Which is a fruit?",
    options: { A: "Carrot", B: "Potato", C: "Apple", D: "Onion" },
    answer: "C"
  },
  {
    question: "What is the currency of Indonesia?",
    options: { A: "Dollar", B: "Rupiah", C: "Yen", D: "Ringgit" },
    answer: "B"
  },
  {
    question: "What is the tallest animal?",
    options: { A: "Elephant", B: "Giraffe", C: "Lion", D: "Tiger" },
    answer: "B"
  },
  {
    question: "What is the freezing point of water (°C)?",
    options: { A: "0", B: "10", C: "32", D: "100" },
    answer: "A"
  },
  {
    question: "Which is a vegetable?",
    options: { A: "Banana", B: "Mango", C: "Spinach", D: "Orange" },
    answer: "C"
  },
  {
    question: "What is the largest ocean?",
    options: { A: "Atlantic", B: "Indian", C: "Pacific", D: "Arctic" },
    answer: "C"
  },
  {
    question: "What is the smallest continent?",
    options: { A: "Asia", B: "Africa", C: "Australia", D: "Europe" },
    answer: "C"
  },
  {
    question: "What is the main language spoken in Indonesia?",
    options: { A: "English", B: "Indonesian", C: "Chinese", D: "French" },
    answer: "B"
  },
  {
    question: "What is the color of grass?",
    options: { A: "Blue", B: "Green", C: "Red", D: "Yellow" },
    answer: "B"
  },
  {
    question: "What is the fastest land animal?",
    options: { A: "Elephant", B: "Cheetah", C: "Lion", D: "Horse" },
    answer: "B"
  },
  {
    question: "What is the largest mammal?",
    options: { A: "Elephant", B: "Whale", C: "Lion", D: "Tiger" },
    answer: "B"
  }
];

async function seed() {
  const batch = db.batch();
  questions.forEach(q => {
    const ref = db.collection('quiz_questions').doc();
    batch.set(ref, q);
  });
  await batch.commit();
  console.log('Seeded 20 quiz questions!');
}

seed();