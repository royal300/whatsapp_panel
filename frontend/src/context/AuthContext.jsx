import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [billing, setBilling] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/user');
                    setUser(response.data.user);
                    // Also store billing if available
                    if (response.data.billing) {
                        setBilling(response.data.billing);
                    }
                } catch (err) {
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/login', { email, password });
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        setUser(user);
        
        // Fetch full user data including billing
        try {
            const userRes = await api.get('/user');
            setBilling(userRes.data.billing);
        } catch (e) {}

        return response.data;
    };

    const register = async (data) => {
        const response = await api.post('/register', data);
        const { access_token, user } = response.data;
        localStorage.setItem('token', access_token);
        setUser(user);

        // Fetch full user data including billing
        try {
            const userRes = await api.get('/user');
            setBilling(userRes.data.billing);
        } catch (e) {}

        return response.data;
    };

    const logout = async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
        setUser(null);
        setBilling(null);
    };

    return (
        <AuthContext.Provider value={{ user, billing, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
