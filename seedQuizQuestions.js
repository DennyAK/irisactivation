const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const questions = [
  {
    "question": "Guinness adalah merek minuman yang berasal dari negara mana?",
    "answer": "B",
    "options": {
      "A": "Amerika Serikat",
      "B": "Irlandia",
      "C": "Inggris",
      "D": "Jerman"
    }
  },
  {
    "question": "Warna khas minuman Guinness adalah…",
    "answer": "C",
    "options": {
      "A": "Emas",
      "B": "Merah",
      "C": "Hitam",
      "D": "Biru"
    }
  },
  {
    "question": "Logo Guinness menampilkan gambar…",
    "answer": "C",
    "options": {
      "A": "Naga",
      "B": "Singa",
      "C": "Harpa",
      "D": "Burung"
    }
  },
  {
    "question": "Di Indonesia, Guinness dikenal sebagai bir dengan rasa…",
    "answer": "B",
    "options": {
      "A": "Manis buah",
      "B": "Pahit lembut",
      "C": "Pedas",
      "D": "Asin"
    }
  },
  {
    "question": "Tahun berapa Guinness pertama kali diproduksi secara global?",
    "answer": "A",
    "options": {
      "A": "1759",
      "B": "1800",
      "C": "1859",
      "D": "1900"
    }
  },
  {
    "question": "Apa nama resmi Guinness yang dijual di Indonesia?",
    "answer": "B",
    "options": {
      "A": "Guinness Extra Cold",
      "B": "Guinness Foreign Extra Stout",
      "C": "Guinness Black Label",
      "D": "Guinness Premium"
    }
  },
  {
    "question": "Guinness pertama kali hadir di Indonesia pada…",
    "answer": "C",
    "options": {
      "A": "1920-an",
      "B": "1940-an",
      "C": "1970-an",
      "D": "2000-an"
    }
  },
  {
    "question": "Pabrik Guinness di Indonesia dikelola oleh…",
    "answer": "B",
    "options": {
      "A": "PT Indofood",
      "B": "PT Multi Bintang Indonesia",
      "C": "PT Sinar Mas",
      "D": "PT Wings"
    }
  },
  {
    "question": "Kadar alkohol Guinness Foreign Extra Stout di Indonesia sekitar…",
    "answer": "C",
    "options": {
      "A": "2%",
      "B": "3%",
      "C": "4,9%",
      "D": "7%"
    }
  },
  {
    "question": "Ukuran botol Guinness yang paling umum di Indonesia adalah…",
    "answer": "B",
    "options": {
      "A": "250 ml",
      "B": "320 ml",
      "C": "500 ml",
      "D": "750 ml"
    }
  },
  {
    "question": "Guinness sering dipromosikan dengan tagline “Made of…”",
    "answer": "B",
    "options": {
      "A": "Water",
      "B": "More",
      "C": "Love",
      "D": "Beer"
    }
  },
  {
    "question": "Guinness di Indonesia biasanya dikonsumsi…",
    "answer": "B",
    "options": {
      "A": "Pagi hari",
      "B": "Saat bersantai di malam hari",
      "C": "Saat sarapan",
      "D": "Saat olahraga"
    }
  },
  {
    "question": "Minuman Guinness terkenal dengan busa yang…",
    "answer": "C",
    "options": {
      "A": "Berwarna biru",
      "B": "Berwarna coklat muda",
      "C": "Tebal dan creamy",
      "D": "Tidak ada busa"
    }
  },
  {
    "question": "Apa bahan utama pembuatan Guinness?",
    "answer": "B",
    "options": {
      "A": "Singkong",
      "B": "Malted barley",
      "C": "Kentang",
      "D": "Jagung"
    }
  },
  {
    "question": "Guinness Foreign Extra Stout memiliki rasa khas karena proses…",
    "answer": "C",
    "options": {
      "A": "Pendinginan es",
      "B": "Fermentasi singkat",
      "C": "Pemanggangan malt",
      "D": "Pencampuran buah"
    }
  },
  {
    "question": "Di Indonesia, Guinness biasanya dijual dalam kemasan…",
    "answer": "B",
    "options": {
      "A": "Hanya kaleng",
      "B": "Botol kaca dan kaleng",
      "C": "Plastik",
      "D": "Karton"
    }
  },
  {
    "question": "Guinness terkenal sebagai bir dengan asal dari kota…",
    "answer": "B",
    "options": {
      "A": "London",
      "B": "Dublin",
      "C": "Paris",
      "D": "New York"
    }
  },
  {
    "question": "Minuman Guinness identik dengan perayaan…",
    "answer": "B",
    "options": {
      "A": "Tahun Baru Imlek",
      "B": "St. Patrick’s Day",
      "C": "Halloween",
      "D": "Paskah"
    }
  },
  {
    "question": "Guinness pertama kali diproduksi oleh…",
    "answer": "B",
    "options": {
      "A": "John Guinness",
      "B": "Arthur Guinness",
      "C": "William Guinness",
      "D": "Patrick Guinness"
    }
  },
  {
    "question": "Di Indonesia, Guinness sering dipasarkan untuk kalangan…",
    "answer": "C",
    "options": {
      "A": "Anak-anak",
      "B": "Semua umur",
      "C": "21 tahun ke atas",
      "D": "Remaja"
    }
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