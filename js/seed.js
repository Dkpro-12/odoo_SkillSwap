const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedDatabase() {
  // Add sample user
  await db.collection('users').doc('sampleUser1').set({
    name: 'John Doe',
    email: 'john@example.com',
    skillsOffered: ['Photoshop', 'Excel'],
    skillsWanted: ['Gardening', 'Cooking'],
    isPublic: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Add more seed data as needed
  console.log('Database seeded successfully!');
}

seedDatabase();