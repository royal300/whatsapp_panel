import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/user');
                    const { user, tenant } = response.data;
                    if (tenant) user.tenant = tenant;
                    setUser(user);
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
        const { access_token, user, tenant } = response.data;
        localStorage.setItem('token', access_token);
        if (tenant) user.tenant = tenant;
        setUser(user);
        return response.data;
    };

    const register = async (data) => {
        const response = await api.post('/register', data);
        // We do NOT log the user in yet. We just return the response which says requires_otp: true
        return response.data;
    };

    const verifyOtp = async (email, otp) => {
        const response = await api.post('/verify-otp', { email, otp });
        const { access_token, user, tenant } = response.data;
        localStorage.setItem('token', access_token);
        if (tenant) user.tenant = tenant;
        setUser(user);
        return response.data;
    };

    const logout = async () => {
        await api.post('/logout');
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, verifyOtp, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
