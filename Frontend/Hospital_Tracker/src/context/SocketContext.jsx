import { createContext } from "react";
import { io } from "socket.io-client";

function resolveSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.DEV) {
    return undefined;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/i, "");
  if (apiBase) {
    return apiBase;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return undefined;
}

export const socket = io(resolveSocketUrl(), {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }) => {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
