import Cookies from 'js-cookie';
import * as React from 'react';
import { token_cookie_name } from '../helpers';
import { Decrypt } from '../helpers/encryption.helpers';

interface UserContextInterface {
  profile: any | null;
  setProfile: React.Dispatch<React.SetStateAction<any | null>>;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
}

export const UserContext = React.createContext<UserContextInterface>(
  {} as UserContextInterface
);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchProfile = React.useCallback(async () => {
    const encryptedToken = Cookies.get(token_cookie_name);
    if (!encryptedToken) {
      setError('No authentication token found');
      setProfile(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = Decrypt(encryptedToken);
      if (!token || token.trim() === '') {
        throw new Error('Invalid token');
      }

      const response = await fetch(`${apiUrl}/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove(token_cookie_name);
          throw new Error('Authentication failed');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data && data.data && data.data.profile) {
        setProfile(data.data.profile);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const value = React.useMemo(() => ({ 
    profile, 
    setProfile, 
    loading, 
    error, 
    fetchProfile 
  }), [profile, loading, error, fetchProfile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  return React.useContext(UserContext);
}
