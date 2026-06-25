export interface User {
    id: number;
    username: string;
    email: string;
    verified: boolean;
    createdAt: string;
}

export type ApiResponse<T> =
    | {
        success: true;
        message: string;
        data: T;
    }
    | {
        success: false;
        message: string;
    };

export type RegisterResponse = ApiResponse<{
    user: User;
    token: string;
}>;

export type LoginResponse = ApiResponse<{
    user: User;
}>;

export type MeResponse = ApiResponse<{
    user: User;
}>;

export type TokenResponse = ApiResponse<{
    token: string;
}>;


export interface Conversation {
    conversationId: number;
    lastMessage: string;
    lastMessageTime: string,
    otherUser: OtherUser,
    updatedAt: string;
}

export type State = {
    convos: Map<number, Conversation>;
    messages: Map<number, ChatMessage[]>;
    activeConvo: number | null;
};

export interface KeyRecord {
    id: string;
    userId: number;
    deviceId: string;
    privateKey: string;
    createdAt: number;
}

export type WSMessage =
    | { type: "auth"; token: string }
    | { type: "receive_message"; message: any }
    | { type: string;[key: string]: any };

export type Listener = (data: any) => void;
export type AuthContextType = {
    user: User | null;
    token: string | null;
    passphrase: string | null;
    loading: boolean;
    login: (emailOrName: string, password: string) => Promise<User>;
    register: (username: string, email: string, password: string) => Promise<RegisterResponse>;
    logout: () => void;
};

export type Mode = "login" | "register";

export interface FormState {
    username: string;
    email: string;
    password: string;
}

export type EditField = "avatar" | "displayName" | "username" | "bio" | null;
export type TabId = "profile" | "privacy" | "chat" | "appearance" | "account";

export interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
    displayName: string;
    setDisplayName: (value: string) => void;
    username: string;
    setUsername: (value: string) => void;
    bio: string;
    setBio: (value: string) => void;
    avatar?: string;
    setAvatar?: (value: string) => void;
    readReceipts: boolean;
    setReadReceipts: (value: boolean) => void;
    onlineStatus: boolean;
    setOnlineStatus: (value: boolean) => void;
    lastSeen: boolean;
    setLastSeen: (value: boolean) => void;
    showTimestamps: boolean;
    setShowTimestamps: (value: boolean) => void;
    darkMode: boolean;
    setDarkMode: (value: boolean) => void;
}

export interface OtherUser {
    id: number;
    username: string
}

export interface ChatMessage {
    id: string;
    senderId: number;
    receiverId?: number;
    conversationId: number;
    plaintext?: string | null;
    text?: string;
    ciphertext?: string;
    createdAt: string;
    readAt?: string | null;
}

export interface SocketEventData {
    type: string;
    data?: any;
    message?: any;
    conversationId?: number;
}


export type Settings = {
    displayName: string;
    bio: string;
    avatar: string;

    privacy: {
        readReceipts: boolean;
        onlineStatus: boolean;
        lastSeen: boolean;
    };

    chat: {
        showTimestamps: boolean;
    };

    appearance: {
        darkMode: boolean;
    };
};

export type SettingsResponse = ApiResponse<{settings: Settings}>