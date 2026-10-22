import { useEffect, useState, type PropsWithChildren } from "react";
import socket from "../services/socket";
import { PublishingContext } from "../services/publishingContext";
import type { PublishedPageEvent } from "../types";

export default function PublishingProvider({ children }: PropsWithChildren) {
  const [publishedEvents, setPublishedEvents] = useState<PublishedPageEvent[]>([]);

  useEffect(() => {
    const handlePublished = (event: PublishedPageEvent) => {
      setPublishedEvents((events) => [...events, event].slice(-50));
    };
    socket.on("page:published", handlePublished);
    socket.connect();
    return () => {
      socket.off("page:published", handlePublished);
      socket.disconnect();
    };
  }, []);

  return <PublishingContext.Provider value={publishedEvents}>{children}</PublishingContext.Provider>;
}
