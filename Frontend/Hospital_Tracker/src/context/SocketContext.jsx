import { createContext } from "react";
import { io } from "socket.io-client";

/** Dev: same origin + Vite proxy to backend. Prod: set VITE_SOCKET_URL if API is on another host */
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? undefined : import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/i, "") || undefined);

export const socket = io(socketUrl, {
  withCredentials: true,
});

export const SocketContext = createContext(socket);

export const SocketProvider = ({ children }) => {
    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
