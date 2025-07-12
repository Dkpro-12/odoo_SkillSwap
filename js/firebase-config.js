// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyAVbQ2hqLTeYFfOQmDOzppHAg2feijuE_o",
    authDomain: "odoo-feb6b.firebaseapp.com",
    projectId: "odoo-feb6b",
    storageBucket: "odoo-feb6b.firebasestorage.app",
    messagingSenderId: "196467837756",
    appId: "1:196467837756:web:03ca4a01a47b2a09f66c39"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();




