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

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

const PermissionRoute = ({ children, feature }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (user.role === 'admin') return children;
    if (user.permissions?.includes(feature)) return children;
    return <Navigate to="/inbox" />;
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
                                    <PermissionRoute feature="dashboard">
                                        <Dashboard />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/contacts" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <PermissionRoute feature="contacts">
                                        <Contacts />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/templates" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <PermissionRoute feature="templates">
                                        <Templates />
                                    </PermissionRoute>
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
                                    <PermissionRoute feature="campaigns">
                                        <Campaigns />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/automation" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <PermissionRoute feature="automation">
                                        <Automation />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/agents" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <PermissionRoute feature="agents">
                                        <Agents />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/settings" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <PermissionRoute feature="settings">
                                        <Settings />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/analytics" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <PermissionRoute feature="analytics">
                                        <Analytics />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route 
                        path="/flow-builder" 
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <PermissionRoute feature="flow_builder">
                                        <FlowBuilder />
                                    </PermissionRoute>
                                </Layout>
                            </PrivateRoute>
                        } 
                    />
                    <Route path="/" element={<Home />} />
                </Routes>
            </Router>
        </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
