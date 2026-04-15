import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ChatIndex() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la liste des messages
    router.replace('/(tabs)/messages');
  }, []);

  return null;
}
