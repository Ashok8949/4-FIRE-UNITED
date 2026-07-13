const firebaseConfig = {
  apiKey: "AIzaSyBS7S43uJdMtXCL1j4CKanXK6W_Fpq9MQg",
  authDomain: "fire-united.firebaseapp.com",
  projectId: "fire-united",
  storageBucket: "fire-united.firebasestorage.app",
  messagingSenderId: "643603449722",
  appId: "1:643603449722:web:8a8952c317a3cecffe78c3",
  measurementId: "G-JC6K4S3R9C"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
db.enablePersistence({
    synchronizeTabs: true
}).catch((err) => {

    console.warn("Firestore Cache:", err.code);

});
const auth = firebase.auth();
