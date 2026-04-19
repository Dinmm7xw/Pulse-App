export interface Post {
  id: string;
  user: string;
  desc: string;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  location: string;
  city?: string;
  color: string;
  timestamp: any;
  mediaUrl?: string;
  userId?: string;
  isAnonymous?: boolean;
  hashtags?: string[];
  privacy?: 'public' | 'friends' | 'private';
  audioUrl?: string;
  audioName?: string;
}

export interface Shout {
  id: string;
  text: string;
  type: 'love' | 'hype' | 'meet' | 'question';
  lat: number;
  lng: number;
  userId: string;
  isAnonymous: boolean;
  timestamp: any;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: string;
  text: string;
  timestamp: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
}

export interface UserLocation {
  id: string;
  lat: number;
  lng: number;
  displayName: string;
  photoURL: string;
  timestamp: any;
}

export interface FriendRequest {
  id: string;
  from: string;
  fromName: string;
  to: string;
  status: 'pending' | 'accepted';
}

export interface UserProfile {
  bio: string;
  username: string;
  displayName?: string;
  hideLocation?: boolean;
  photoURL?: string;
  isProfileComplete?: boolean;
}
