// js/database.js
class DatabaseService {
    static async getUser(uid) {
        const doc = await db.collection('users').doc(uid).get();
        return doc.exists ? doc.data() : null;
    }

    static async updateUser(uid, data) {
        await db.collection('users').doc(uid).update(data);
    }

    static async getPublicUsers() {
        const snapshot = await db.collection('users')
            .where('isPublic', '==', true)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async searchUsersBySkill(skill) {
        const snapshot = await db.collection('users')
            .where('skillsOffered', 'array-contains', skill)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    static async createSwapRequest(fromUserId, toUserId, offeredSkill, requestedSkill) {
        const swapId = db.collection('swaps').doc().id;
        await db.collection('swaps').doc(swapId).set({
            id: swapId,
            fromUserId,
            toUserId,
            offeredSkill,
            requestedSkill,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return swapId;
    }

    static async getSwapRequests(userId) {
        const snapshot = await db.collection('swaps')
            .where('toUserId', '==', userId)
            .where('status', '==', 'pending')
            .get();
        return snapshot.docs.map(doc => doc.data());
    }

    static async respondToSwap(swapId, response) {
        await db.collection('swaps').doc(swapId).update({
            status: response,
            respondedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}