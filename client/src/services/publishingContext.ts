import { createContext, useContext } from "react";
import type { PublishedPageEvent } from "../types";

export const PublishingContext = createContext<PublishedPageEvent[]>([]);

export function usePublishedPageEvents(): PublishedPageEvent[] {
  return useContext(PublishingContext);
}
