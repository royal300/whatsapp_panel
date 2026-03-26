import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Inbox from './pages/Inbox';
import Campaigns from './pages/Campaigns';
import Automation from './pages/Automation';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Layout from './components/Layout';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route 
                        path="/dashboard" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Dashboard />
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/contacts" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Contacts />
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/templates" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Templates />
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/inbox" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Inbox />
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/campaigns" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Campaigns />
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/automation" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Automation />
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/settings" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Settings />
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
