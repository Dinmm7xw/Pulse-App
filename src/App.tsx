import { useEffect, useState } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AnimatePresence } from 'framer-motion';
import { AppLayout } from './components/AppLayout';
import { MapView } from './features/map/MapView';
import { ChatView } from './features/chat/ChatView';
import { ProfileView } from './features/profile/ProfileView';
import { CreatePostModal } from './features/feed/CreatePostModal';
import { usePulseStore } from './store/useStore';
import { LoginView } from './features/auth/LoginView';
import { CompleteProfileView } from './features/auth/CompleteProfileView';
import { SettingsView } from './features/profile/SettingsView';
import { ExploreView } from './features/explore/ExploreView';
import { OtherProfileView } from './features/profile/OtherProfileView';
import { PrivacyCenter } from './features/profile/PrivacyCenter';
import { getCityName } from './lib/geo';
import { Loader2 } from 'lucide-react';

function App() {
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [isPrivacyCenterOpen, setIsPrivacyCenterOpen] = useState(false);
  const [, setRefreshProfileKey] = useState(0);
  const { addPost, userLocation, userProfile, updateLocation } = usePulseStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Extra guard: If user has a username, they ARE complete even if flag is missing
  const isProfileSetupFinished = userProfile?.isProfileComplete || (userProfile?.username && userProfile.username.length > 2);

  if (isAuthChecking) {
      return (
          <div style={{ height: '100vh', background: 'var(--bg-color)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Loader2 className="spin" size={40} color="var(--primary-color)" />
          </div>
      );
  }

  if (!user) {
    return <LoginView onLogin={() => {}} />;
  }

  // Onboarding logic: check if profile is complete
  if (user && !isProfileSetupFinished) {
      return <CompleteProfileView onComplete={() => setRefreshProfileKey(prev => prev + 1)} initialEmail={user.email} />;
  }

  const handlePublish = async (postData: {
    text: string;
    isAnonymous: boolean;
    mediaUrl?: string;
    hashtags?: string[];
    privacy?: string;
    audioUrl?: string;
    audioName?: string;
  }) => {
    let city = 'Алматы';
    if (userLocation) {
        city = await getCityName(userLocation[0], userLocation[1]);
    }

    const authorName = postData.isAnonymous ? '' : (userProfile.displayName || userProfile.username || user.displayName || user.email?.split('@')[0] || 'User');

    const success = await addPost({
      user: authorName,
      desc: postData.text,
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      location: city,
      city: city,
      color: 'linear-gradient(135deg, #7000FF, #00D1FF)',
      mediaUrl: postData.mediaUrl,
      isAnonymous: postData.isAnonymous,
      hashtags: postData.hashtags,
      privacy: postData.privacy as any,
      audioUrl: postData.audioUrl,
      audioName: postData.audioName
    });

    if (success) {
        alert("Публикация успешно размещена! 🎉");
        setIsAddModalOpen(false);
        setActiveTab('explore');
    } else {
        alert("Ошибка при публикации. Пожалуйста, попробуйте еще раз.");
    }
  };

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddClick={() => {
          updateLocation();
          setIsAddModalOpen(true);
        }}
      >
        {activeTab === 'map' && <MapView />}
        {activeTab === 'explore' && <ExploreView 
          onViewProfile={(uid) => {
            if (uid === auth.currentUser?.uid) {
              setActiveTab('profile');
            } else {
              setViewingUserId(uid);
            }
          }} 
          onViewMap={() => setActiveTab('map')}
        />}
        {activeTab === 'chats' && <ChatView />}
        {activeTab === 'profile' && <ProfileView onOpenSettings={() => setIsSettingsOpen(true)} />}
      </AppLayout>

      <AnimatePresence>
        {viewingUserId && (
          <OtherProfileView 
            uid={viewingUserId} 
            onClose={() => setViewingUserId(null)} 
          />
        )}
      </AnimatePresence>

      <SettingsView 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onOpenPrivacy={() => setIsPrivacyCenterOpen(true)}
      />

      <AnimatePresence>
        {isPrivacyCenterOpen && (
          <PrivacyCenter onClose={() => setIsPrivacyCenterOpen(false)} />
        )}
      </AnimatePresence>

      <CreatePostModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPublish={handlePublish}
      />

    </>
  );
}

export default App;
