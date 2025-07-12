// js/auth.js
class AuthService {
    static async login(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    }

    static async register(email, password, name) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                skillsOffered: [],
                skillsWanted: [],
                isPublic: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    }

    static async logout() {
        try {
            await auth.signOut();
        } catch (error) {
            throw error;
        }
    }

    static getCurrentUser() {
        return auth.currentUser;
    }

    static onAuthStateChanged(callback) {
        auth.onAuthStateChanged(callback);
    }
}