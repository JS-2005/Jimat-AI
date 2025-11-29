"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Mock User interface to match what the app expects
export interface User {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInAsGuest: () => Promise<void>;
    logout: () => Promise<void>;
    updateUserProfile: (name: string, photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInAsGuest: async () => { },
    logout: async () => { },
    updateUserProfile: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem("guest_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("guest_user");
            }
        }
        setLoading(false);
    }, []);

    const signInAsGuest = async () => {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const randomId = Math.floor(Math.random() * 10000);
        const newUser: User = {
            uid: `guest-${randomId}`,
            displayName: `Guest #${randomId}`,
            email: null,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}`
        };

        setUser(newUser);
        localStorage.setItem("guest_user", JSON.stringify(newUser));
        setLoading(false);
    };

    const logout = async () => {
        setUser(null);
        localStorage.removeItem("guest_user");
    };

    const updateUserProfile = async (name: string, photoURL: string) => {
        if (!user) return;
        const updatedUser = { ...user, displayName: name, photoURL: photoURL };
        setUser(updatedUser);
        localStorage.setItem("guest_user", JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInAsGuest, logout, updateUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
