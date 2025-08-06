import * as React from 'react';

interface UserContextInterface {
  profile: object | null;
  setProfile: React.Dispatch<React.SetStateAction<object[] | null>>;
}

export const UserContext = React.createContext<UserContextInterface>(
  {} as UserContextInterface
);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<object | null>(null);

  const value = React.useMemo(() => ({ profile, setProfile }), [profile]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  return React.useContext(UserContext);
}
