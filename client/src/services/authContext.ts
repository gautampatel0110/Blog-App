import { createContext, useContext } from "react";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

export const CurrentUserContext = createContext<CurrentUser | null>(null);

export function useCurrentUser(): CurrentUser | null {
  return useContext(CurrentUserContext);
}
