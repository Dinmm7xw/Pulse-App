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
    FriendRequest, 
    UserProfile,
    Chat
} from '../types';

export const usePulseStore = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [friendsLocations, setFriendsLocations] = useState<UserLocation[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [confirmedFriendIds, setConfirmedFriendIds] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ bio: '', username: '' });
  const [chats, setChats] = useState<Chat[]>([]);

  // Sync profile data from Firestore
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubProfile = onSnapshot(doc(db, "userProfiles", user.uid), (docObj) => {
          if (docObj.exists()) {
            setUserProfile(docObj.data() as UserProfile);
          }
        });
        return () => unsubProfile();
      } else {
        setUserProfile({ bio: '', username: '' });
      }
    });
    return () => unsubAuth();
  }, []);

  // Real-time posts listener
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Shouts (8h filter)
  useEffect(() => {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    const q = query(
        collection(db, "shouts"), 
        where("timestamp", ">=", Timestamp.fromDate(eightHoursAgo))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shoutsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shout[];
      setShouts(shoutsData);
    });

    return () => unsubscribe();
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

  // Sync friendship statuses
  useEffect(() => {
    let unsubRequests: () => void;
    let unsubFriends: () => void;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userId = user.uid;

        const qRequests = query(collection(db, "friendRequests"), where("to", "==", userId), where("status", "==", "pending"));
        unsubRequests = onSnapshot(qRequests, (snapshot) => {
          setFriendRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FriendRequest[]);
        });

        const qFriends = query(collection(db, "friendRequests"), where("status", "==", "accepted"));
        unsubFriends = onSnapshot(qFriends, (snapshot) => {
          const ids = snapshot.docs.reduce((acc: string[], doc) => {
            const data = doc.data();
            if (data.from === userId) acc.push(data.to);
            if (data.to === userId) acc.push(data.from);
            return acc;
          }, []);
          setConfirmedFriendIds(ids);
        });
      }
    });

    return () => {
      unsubAuth();
      if (unsubRequests) unsubRequests();
      if (unsubFriends) unsubFriends();
    };
  }, []);

  // Real-time locations listener
  useEffect(() => {
    const q = query(collection(db, "locations"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locationsData = snapshot.docs
        .filter(doc => confirmedFriendIds.includes(doc.id))
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserLocation[];
      setFriendsLocations(locationsData);
    });

    return () => unsubscribe();
  }, [confirmedFriendIds]);

  const addPost = useCallback(async (newPost: Omit<Post, 'id' | 'timestamp'>) => {
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "posts"), {
        ...newPost,
        userId: user?.uid,
        userAvatar: userProfile.photoURL || user?.photoURL || '',
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error adding post: ", error);
    }
  }, [userProfile.photoURL]);

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
        await addDoc(collection(db, "comments"), {
            postId,
            userId: auth.currentUser.uid,
            user: auth.currentUser.displayName || 'User',
            text,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error adding comment:", error);
    }
  }, []);

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

  const sendMessage = useCallback(async (chatId: string, text: string) => {
    if (!auth.currentUser) return;
    try {
        await addDoc(collection(db, `chats/${chatId}/messages`), {
            senderId: auth.currentUser.uid,
            senderName: userProfile.displayName || auth.currentUser.displayName || 'User',
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
        displayName: user.displayName || user.email?.split('@')[0],
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

  const sendFriendRequest = useCallback(async (targetId: string, targetName: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, "friendRequests"), {
        from: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Пользователь Pulse',
        to: targetId,
        targetName,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  }, []);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      await firestoreUpdateDoc(doc(db, "friendRequests", requestId), {
        status: 'accepted'
      });
    } catch (error) {
      console.error("Error accepting request:", error);
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
    friendsLocations, 
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest, 
    userProfile,
    updateUserProfile,
    deletePost
  };
};
