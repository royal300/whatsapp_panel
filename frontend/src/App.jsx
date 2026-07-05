import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Inbox from './pages/Inbox';
import Campaigns from './pages/Campaigns';
import Automation from './pages/Automation';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Agents from './pages/Agents';
import FlowBuilder from './pages/FlowBuilder';
import Layout from './components/Layout';
import Home from './pages/Home';
import SuperAdmin from './pages/SuperAdmin';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user && user.role === 'admin' ? children : <Navigate to="/inbox" />;
};

const SuperAdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user && user.role === 'super_admin' ? children : <Navigate to="/dashboard" />;
};

function App() {
    return (
        <ThemeProvider>
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
                                    <AdminRoute>
                                        <Dashboard />
                                    </AdminRoute>
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
                                    <AdminRoute>
                                        <Templates />
                                    </AdminRoute>
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
                                    <AdminRoute>
                                        <Campaigns />
                                    </AdminRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/automation" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <AdminRoute>
                                        <Automation />
                                    </AdminRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/agents" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <AdminRoute>
                                        <Agents />
                                    </AdminRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/settings" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <AdminRoute>
                                        <Settings />
                                    </AdminRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/analytics" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <AdminRoute>
                                        <Analytics />
                                    </AdminRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/flow-builder" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <AdminRoute>
                                        <FlowBuilder />
                                    </AdminRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/super-admin" 
                        element={
                            <PrivateRoute>
                                <SuperAdminRoute>
                                    <Layout>
                                        <SuperAdmin />
                                    </Layout>
                                </SuperAdminRoute>
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
        </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
