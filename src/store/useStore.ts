import { useState, useCallback, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  Timestamp,
  updateDoc as firestoreUpdateDoc,
  limit
} from 'firebase/firestore';
import type { 
    Post, 
    Shout, 
    Comment, 
    Message, 
    UserLocation, 
    UserProfile,
    Chat
} from '../types';

export const usePulseStore = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followersIds, setFollowersIds] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ bio: '', username: '', followersCount: 0, followingCount: 0 });
  const [chats, setChats] = useState<Chat[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Sync profile data from Firestore
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubProfile = onSnapshot(doc(db, "userProfiles", user.uid), (docObj) => {
          if (docObj.exists()) {
            setUserProfile(docObj.data() as UserProfile);
          }
          setProfileLoaded(true);
        });
        return () => unsubProfile();
      } else {
        setUserProfile({ bio: '', username: '' });
        setProfileLoaded(false);
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time posts listener - only if authenticated
  useEffect(() => {
    let unsubscribe: () => void;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const postsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
          setPosts(postsData);
        }, (error) => {
          console.error("🔥 Store: Posts listener error", error);
        });
      } else {
        setPosts([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-time Shouts (8h filter) - only if authenticated
  useEffect(() => {
    let unsubscribe: () => void;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
        const q = query(
            collection(db, "shouts"), 
            where("timestamp", ">=", Timestamp.fromDate(eightHoursAgo))
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const shoutsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Shout[];
          setShouts(shoutsData);
        });
      } else {
        setShouts([]);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Real-time chats listener
  useEffect(() => {
    let unsubChats: () => void;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(
          collection(db, "chats"),
          where("participants", "array-contains", user.uid),
          orderBy("lastTime", "desc")
        );
        unsubChats = onSnapshot(q, (snapshot) => {
          const chatsData = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          })) as Chat[];
          setChats(chatsData);
        });
      }
    });
    return () => {
      unsubAuth();
      if (unsubChats) unsubChats();
    };
  }, []);

  // Sync followers/following
  useEffect(() => {
    let unsubFollowing: () => void;
    let unsubFollowers: () => void;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;
        const qFollowing = query(collection(db, `users/${userId}/following`));
        unsubFollowing = onSnapshot(qFollowing, 
          (snapshot) => setFollowingIds(snapshot.docs.map(doc => doc.id) || []),
          (err) => {
            console.error("Following listener error:", err);
            setFollowingIds([]);
          }
        );

        const qFollowers = query(collection(db, `users/${userId}/followers`));
        unsubFollowers = onSnapshot(qFollowers, 
          (snapshot) => setFollowersIds(snapshot.docs.map(doc => doc.id) || []),
          (err) => {
            console.error("Followers listener error:", err);
            setFollowersIds([]);
          }
        );
      }
    });

    return () => {
      unsubAuth();
      if (unsubFollowing) unsubFollowing();
      if (unsubFollowers) unsubFollowers();
    };
  }, []);



  const addPost = useCallback(async (newPost: Omit<Post, 'id' | 'timestamp'>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user");
      
      console.log("🔥 Store: Adding new post...", newPost);

      // Firestore does not accept undefined values — strip them out
      const cleanPost: Record<string, any> = {};
      Object.entries({ ...newPost }).forEach(([k, v]) => {
        if (v !== undefined) cleanPost[k] = v;
      });
      
      const docRef = await addDoc(collection(db, "posts"), {
        ...cleanPost,
        userId: user.uid,
        userUsername: userProfile.username || '',
        userAvatar: userProfile.photoURL || user.photoURL || '',
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        timestamp: serverTimestamp()
      });
      
      console.log("🔥 Store: Post added successfully with ID:", docRef.id);
      return true;
    } catch (error) {
      console.error("Error adding post: ", error);
      return false;
    }
  }, [userProfile]);

  const addShout = useCallback(async (newShout: Omit<Shout, 'id' | 'timestamp' | 'userId'>) => {
    if (!auth.currentUser) return;
    try {
        await addDoc(collection(db, "shouts"), {
            ...newShout,
            userId: auth.currentUser.uid,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding shout:", error);
    }
  }, []);

  const addComment = useCallback(async (postId: string, text: string) => {
    if (!auth.currentUser) return;
    try {
        const { increment, updateDoc } = await import('firebase/firestore');
        await addDoc(collection(db, "comments"), {
            postId,
            userId: auth.currentUser.uid,
            user: userProfile.displayName || userProfile.username || 'User',
            userUsername: userProfile.username || '',
            userAvatar: userProfile.photoURL || '',
            text,
            timestamp: serverTimestamp()
        });
        
        // Increment count on post
        await updateDoc(doc(db, "posts", postId), {
            commentsCount: increment(1)
        });
    } catch (error) {
        console.error("Error adding comment:", error);
    }
  }, [userProfile]);

  const likePost = useCallback(async (postId: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const postRef = doc(db, "posts", postId);
    
    try {
        const { getDoc, updateDoc, arrayUnion, arrayRemove, increment } = await import('firebase/firestore');
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;
        
        const postData = postSnap.data();
        const likedBy = postData.likedBy || [];
        
        if (likedBy.includes(userId)) {
            await updateDoc(postRef, {
                likedBy: arrayRemove(userId),
                likesCount: increment(-1)
            });
        } else {
            await updateDoc(postRef, {
                likedBy: arrayUnion(userId),
                likesCount: increment(1)
            });
        }
    } catch (error) {
        console.error("Error liking post:", error);
    }
  }, []);

  const repostPost = useCallback(async (postId: string) => {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;
    const postRef = doc(db, "posts", postId);

    try {
        const { getDoc, updateDoc, increment, arrayUnion } = await import('firebase/firestore');
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;
        const postData = postSnap.data();

        // 1. Increment repost count on original
        await updateDoc(postRef, {
            repostCount: increment(1),
            repostedBy: arrayUnion(userId)
        });

        // 2. Create a NEW post that is the repost
        await addDoc(collection(db, "posts"), {
            ...postData,
            id: undefined, // Let Firestore generate new ID
            userId: userId,
            user: userProfile.displayName || userProfile.username || 'User',
            userUsername: userProfile.username || '',
            userAvatar: userProfile.photoURL || '',
            isRepost: true,
            originalPostId: postId,
            originalUser: postData.user,
            timestamp: serverTimestamp(),
            likesCount: 0,
            likedBy: [],
            commentsCount: 0,
            repostCount: 0,
            repostedBy: []
        });
        
        console.log("🔥 Store: Post reposted successfully!");
        return true;
    } catch (error) {
        console.error("Error reposting:", error);
        return false;
    }
  }, [userProfile]);

  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (!auth.currentUser) return;
    try {
        await addDoc(collection(db, `chats/${chatId}/messages`), {
            senderId: auth.currentUser.uid,
            senderName: userProfile.displayName || auth.currentUser.displayName || 'User',
            senderUsername: userProfile.username || '',
            senderAvatar: userProfile.photoURL || auth.currentUser.photoURL || '',
            text,
            type: 'text',
            timestamp: serverTimestamp()
        });
        
        await setDoc(doc(db, "chats", chatId), {
            lastMsg: text,
            lastTime: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error("Error sending message:", error);
    }
  }, [userProfile.displayName]);

  const listenToMessages = useCallback((chatId: string, callback: (msgs: Message[]) => void) => {
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
        callback(msgs);
    });
  }, []);

  const listenToComments = useCallback((postId: string, callback: (comments: Comment[]) => void) => {
    const q = query(collection(db, "comments"), where("postId", "==", postId), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Comment[];
        callback(commentsData);
    });
  }, []);

  // Create a direct chat with another user
  const createDirectChat = useCallback(async (targetUserId: string, targetName: string, targetAvatar: string) => {
    if (!auth.currentUser) return null;
    const myId = auth.currentUser.uid;
    const myName = userProfile.displayName || userProfile.username || auth.currentUser.displayName || 'User';
    const myAvatar = userProfile.photoURL || auth.currentUser.photoURL || '';

    // Check if chat already exists
    const existingQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", myId),
      where("type", "==", "direct")
    );
    const existingSnap = await getDocs(existingQuery);
    const existing = existingSnap.docs.find(d => {
      const data = d.data();
      return data.participants.includes(targetUserId);
    });

    if (existing) return { id: existing.id, ...existing.data() } as Chat;

    // Create new chat
    const chatRef = await addDoc(collection(db, "chats"), {
      participants: [myId, targetUserId],
      participantNames: { [myId]: myName, [targetUserId]: targetName },
      participantAvatars: { [myId]: myAvatar, [targetUserId]: targetAvatar },
      type: 'direct',
      lastMsg: '',
      lastTime: serverTimestamp()
    });

    return { id: chatRef.id, participants: [myId, targetUserId], type: 'direct' } as Chat;
  }, [userProfile]);

  // Search users by username
  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    try {
      const q = query(
        collection(db, "userProfiles"),
        where("username", ">=", searchQuery.toLowerCase()),
        where("username", "<=", searchQuery.toLowerCase() + '\uf8ff'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .filter(d => d.id !== auth.currentUser?.uid)
        .map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  }, []);

  const syncLocation = useCallback(async (lat: number, lng: number) => {
    if (!auth.currentUser) return;
    if (userProfile.hideLocation) return;
    try {
      const user = auth.currentUser;
      await setDoc(doc(db, "locations", user.uid), {
        lat,
        lng,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        timestamp: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error syncing location:", error);
    }
  }, [userProfile.hideLocation]);

  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, "userProfiles", auth.currentUser.uid), data, { merge: true });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    try {
        await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
        console.error("Error deleting post:", error);
    }
  }, []);

  const updateLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation([latitude, longitude]);
        syncLocation(latitude, longitude);
      });
    }
  }, [syncLocation]);

  const followUser = useCallback(async (targetUid: string) => {
    if (!auth.currentUser) return;
    const myId = auth.currentUser.uid;
    try {
      const { increment } = await import('firebase/firestore');
      // 1. Add to my following
      await setDoc(doc(db, `users/${myId}/following`, targetUid), { timestamp: serverTimestamp() });
      // 2. Add to their followers
      await setDoc(doc(db, `users/${targetUid}/followers`, myId), { timestamp: serverTimestamp() });
      // 3. Update counts
      await firestoreUpdateDoc(doc(db, "userProfiles", myId), { followingCount: increment(1) });
      await firestoreUpdateDoc(doc(db, "userProfiles", targetUid), { followersCount: increment(1) });
    } catch (error) {
      console.error("Error following user:", error);
    }
  }, []);

  const unfollowUser = useCallback(async (targetUid: string) => {
    if (!auth.currentUser) return;
    const myId = auth.currentUser.uid;
    try {
      const { increment } = await import('firebase/firestore');
      await deleteDoc(doc(db, `users/${myId}/following`, targetUid));
      await deleteDoc(doc(db, `users/${targetUid}/followers`, myId));
      await firestoreUpdateDoc(doc(db, "userProfiles", myId), { followingCount: increment(-1) });
      await firestoreUpdateDoc(doc(db, "userProfiles", targetUid), { followersCount: increment(-1) });
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  }, []);

  const fetchUserProfile = useCallback(async (uid: string) => {
    const d = await getDocs(query(collection(db, "userProfiles"), where("__name__", "==", uid)));
    if (!d.empty) return { id: d.docs[0].id, ...d.docs[0].data() } as UserProfile & { id: string };
    return null;
  }, []);

  const fetchUserPosts = useCallback(async (uid: string) => {
    try {
      const q = query(collection(db, "posts"), where("userId", "==", uid), where("isAnonymous", "==", false), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      return (snap.docs || []).map(d => ({ id: d.id, ...d.data() })) as Post[];
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  return { 
    posts, 
    shouts,
    chats,
    addPost, 
    addShout,
    addComment,
    listenToComments,
    likePost,
    sendMessage,
    listenToMessages,
    createDirectChat,
    searchUsers,
    userLocation, 
    updateLocation, 
    followingIds,
    followersIds,
    followUser,
    unfollowUser,
    fetchUserProfile,
    fetchUserPosts,
    userProfile,
    updateUserProfile,
    deletePost,
    profileLoaded,
    repostPost: async (postId: string) => {
        if (!auth.currentUser) return;
        const userId = auth.currentUser.uid;
        const userName = userProfile.displayName || userProfile.username || 'User';
        const postRef = doc(db, "posts", postId);
        
        try {
            const { updateDoc, arrayUnion, increment } = await import('firebase/firestore');
            await updateDoc(postRef, {
                repostedBy: arrayUnion(userId),
                repostedByNames: arrayUnion(userName),
                repostCount: increment(1)
            });
            alert("Пульс репостнут!");
        } catch (error) {
            console.error("Error reposting:", error);
        }
    }
  };
};
