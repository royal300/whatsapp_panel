import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [newContact, setNewContact] = useState({ phone_numbers: [{ name: '', number: '', email: '', label: 'Mobile' }] });
    const fileInputRef = useRef(null);
    const [editingContact, setEditingContact] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/contacts');
            setContacts(res.data);
        } catch (err) {
            console.error('Failed to fetch contacts', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleAddContact = async (e) => {
        e.preventDefault();
        try {
            const validEntries = newContact.phone_numbers.filter(n => n.number.trim() !== '');
            if (validEntries.length === 0) throw new Error('At least one phone number is required');

            const payload = {
                contacts: validEntries.map(entry => ({
                    name: entry.name || 'Unknown',
                    email: entry.email || null,
                    phone_number: entry.number,
                    label: entry.label
                }))
            };

            await api.post('/contacts/bulk', payload);
            setIsAddModalOpen(false);
            setNewContact({ phone_numbers: [{ name: '', number: '', email: '', label: 'Mobile' }] });
            fetchContacts();
        } catch (err) {
            alert('Failed to add contact: ' + (err.response?.data?.message || err.message));
        }
    };

    const addNumberField = () => {
        // Auto-fill the new row's name with the first row's name if possible
        const firstRow = newContact.phone_numbers[0] || {};
        setNewContact({ 
            ...newContact, 
            phone_numbers: [...newContact.phone_numbers, { 
                name: firstRow.name || '', 
                number: '', 
                email: firstRow.email || '', 
                label: 'Mobile' 
            }] 
        });
    };

    const updateNumberField = (index, field, value) => {
        const updated = [...newContact.phone_numbers];
        updated[index] = { ...updated[index], [field]: value };
        setNewContact({ ...newContact, phone_numbers: updated });
    };

    const removeNumberField = (index) => {
        if (newContact.phone_numbers.length === 1) return;
        const updated = newContact.phone_numbers.filter((_, i) => i !== index);
        setNewContact({ ...newContact, phone_numbers: updated });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split('\n').map(row => row.split(','));
                const headers = rows[0].map(h => h.trim().toLowerCase());
                
                const nameIdx = headers.findIndex(h => h.includes('name'));
                const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('number'));
                const emailIdx = headers.findIndex(h => h.includes('email'));

                if (nameIdx === -1 || phoneIdx === -1) {
                    throw new Error('CSV must contain at least "Name" and "Phone Number" columns.');
                }

                const importedContacts = rows.slice(1)
                    .filter(row => row.length >= 2 && row[phoneIdx])
                    .map(row => ({
                        name: row[nameIdx]?.trim(),
                        phone_number: row[phoneIdx]?.trim().replace(/['"]/g, ''), // Ensure it stays as string
                        email: emailIdx !== -1 ? row[emailIdx]?.trim() : null
                    }));

                if (importedContacts.length === 0) {
                    throw new Error('No valid contacts found in CSV.');
                }

                await api.post('/contacts/bulk', { contacts: importedContacts });
                fetchContacts();
                alert(`Successfully imported ${importedContacts.length} contacts!`);
            } catch (err) {
                alert('Import failed: ' + err.message);
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to delete ALL contacts? This cannot be undone.')) return;
        try {
            await api.delete('/contacts/all');
            fetchContacts();
        } catch (err) {
            alert('Failed to clear contacts');
        }
    };

    const handleExport = () => {
        if (contacts.length === 0) {
            alert('No contacts to export.');
            return;
        }
        const headers = ['Name', 'Phone Number', 'Email', 'Label', 'Status', 'Tags'];
        const rows = contacts.map(c => [
            c.name || '',
            c.phone_number || '',
            c.email || '',
            c.label || '',
            c.status || '',
            c.tags || ''
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'contacts_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditContactSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/contacts/${editingContact.id}`, {
                name: editingContact.name,
                phone_number: editingContact.phone_number,
                email: editingContact.email,
                label: editingContact.label,
                status: editingContact.status
            });
            setIsEditModalOpen(false);
            setEditingContact(null);
            fetchContacts();
        } catch (err) {
            alert('Failed to update contact: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteContact = async (id) => {
        if (!window.confirm('Are you sure you want to delete this contact?')) return;
        try {
            await api.delete(`/contacts/${id}`);
            fetchContacts();
        } catch (err) {
            alert('Failed to delete contact: ' + (err.response?.data?.message || err.message));
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="px-10 pb-12">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Contacts</h2>
                    <p className="text-on-surface-variant font-body">Manage your audience and conversational segments with precision.</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".csv"
                    />
                    <button 
                        onClick={handleClearAll}
                        className="px-4 py-2.5 rounded-xl font-headline font-bold text-xs bg-error/10 text-error hover:bg-error/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">delete_sweep</span>
                        Clear All
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="px-5 py-2.5 rounded-xl font-headline font-bold text-sm bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">{isImporting ? 'sync' : 'upload_file'}</span>
                        {isImporting ? 'Importing...' : 'Import CSV'}
                    </button>
                    <button 
                        onClick={handleExport}
                        className="px-5 py-2.5 rounded-xl font-headline font-bold text-sm bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export Excel
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-2.5 rounded-xl font-headline font-bold text-sm bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Add Contact
                    </button>
                </div>
            </div>

            {/* Table UI */}
            <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_20px_40px_rgba(20,29,36,0.06)]">
                {loading ? (
                    <div className="py-20 text-center text-on-surface-variant font-bold animate-pulse">Loading Contacts...</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Name</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Phone Number</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Tags</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none">Status</th>
                                <th className="px-8 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline border-none text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-0 text-sm">
                            {contacts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-10 text-center text-on-surface-variant italic">No contacts found in your workspace</td>
                                </tr>
                            ) : (
                                contacts.map((contact, index) => (
                                    <tr key={contact.id} className={`group hover:bg-surface-container-low/30 transition-colors ${index % 2 !== 0 ? 'bg-surface-container-low/10' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-headline">
                                                    {getInitials(contact.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface leading-tight">{contact.name}</p>
                                                    <p className="text-xs text-on-surface-variant">{contact.email || 'No email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-medium font-body text-on-surface-variant">{contact.phone_number}</span>
                                                {contact.label && (
                                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-primary/70">{contact.label}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-2">
                                                {contact.tags ? contact.tags.split(',').map(tag => (
                                                    <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface-container-highest text-on-surface-variant uppercase tracking-wider">{tag.trim()}</span>
                                                )) : (
                                                    <span className="text-xs text-on-surface-variant opacity-40">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`flex items-center gap-2 text-[11px] font-bold px-3 py-1 rounded-full w-fit ${
                                                contact.status === 'subscribed' 
                                                ? 'text-primary bg-primary-container/10' 
                                                : 'text-error bg-error-container/10'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${contact.status === 'subscribed' ? 'bg-primary-container' : 'bg-error'}`}></div>
                                                {contact.status ? contact.status.charAt(0).toUpperCase() + contact.status.slice(1) : 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => {
                                                        setEditingContact(contact);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteContact(contact.id)}
                                                    className="p-2 text-on-surface-variant hover:text-error transition-colors hover:bg-error/5 rounded-lg"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Contact Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-surface-container-lowest w-full max-w-6xl rounded-[40px] overflow-hidden shadow-2xl"
                            >
                                    <div className="p-10">
                                        <div className="flex justify-between items-center mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-2xl">person_add</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black font-headline text-on-surface">New Contact Group</h3>
                                                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Add one or more primary numbers</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-surface-container-high transition-all flex items-center justify-center text-on-surface-variant">
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                        <form onSubmit={handleAddContact} className="space-y-8">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-12 gap-4 px-4 mb-2">
                                                    <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Full Name</div>
                                                    <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Phone Number</div>
                                                    <div className="col-span-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Email Address</div>
                                                    <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Label</div>
                                                    <div className="col-span-1"></div>
                                                </div>

                                                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                                    {newContact.phone_numbers.map((entry, idx) => (
                                                        <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-surface-container-low/50 p-3 rounded-2xl border border-outline-variant/5 hover:border-primary/20 transition-all group animate-in slide-in-from-top-2">
                                                            <div className="col-span-3">
                                                                <input 
                                                                    required
                                                                    type="text" 
                                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    placeholder="e.g. John Doe"
                                                                    value={entry.name}
                                                                    onChange={(e) => updateNumberField(idx, 'name', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input 
                                                                    required
                                                                    type="text" 
                                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    placeholder="+123..."
                                                                    value={entry.number}
                                                                    onChange={(e) => updateNumberField(idx, 'number', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-span-3">
                                                                <input 
                                                                    type="email" 
                                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    placeholder="Optional email"
                                                                    value={entry.email}
                                                                    onChange={(e) => updateNumberField(idx, 'email', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <input 
                                                                    type="text" 
                                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    placeholder="Mobile/Work"
                                                                    value={entry.label}
                                                                    onChange={(e) => updateNumberField(idx, 'label', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="col-span-1 flex justify-center">
                                                                {newContact.phone_numbers.length > 1 && (
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => removeNumberField(idx)}
                                                                        className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transform group-hover:scale-110"
                                                                    >
                                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button 
                                                    type="button"
                                                    onClick={addNumberField}
                                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-surface-container-low text-primary text-xs font-black uppercase tracking-widest hover:bg-primary/5 transition-all border border-primary/10 mt-2"
                                                >
                                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                                    Add Another Entry
                                                </button>
                                            </div>
                                            
                                            <div className="pt-8 border-t border-outline-variant/10 flex justify-between items-center">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-sm text-primary">info</span>
                                                    {newContact.phone_numbers.length} total entries will be added
                                                </div>
                                                <button 
                                                    type="submit"
                                                    className="px-12 py-4 rounded-2xl bg-primary text-white font-headline font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                >
                                                    Save Group
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Edit Contact Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingContact && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setEditingContact(null);
                            }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-surface-container-lowest w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl"
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                                <span className="material-symbols-outlined text-2xl">edit</span>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black font-headline text-on-surface">Edit Contact</h3>
                                                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Update contact details</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setIsEditModalOpen(false);
                                                setEditingContact(null);
                                            }} 
                                            className="w-10 h-10 rounded-full hover:bg-surface-container-high transition-all flex items-center justify-center text-on-surface-variant"
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>
                                    <form onSubmit={handleEditContactSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Full Name</label>
                                                <input 
                                                    required
                                                    type="text" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={editingContact.name}
                                                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Phone Number</label>
                                                <input 
                                                    required
                                                    type="text" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={editingContact.phone_number}
                                                    onChange={(e) => setEditingContact({ ...editingContact, phone_number: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={editingContact.email || ''}
                                                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Label</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={editingContact.label || ''}
                                                    onChange={(e) => setEditingContact({ ...editingContact, label: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Status</label>
                                                <select 
                                                    className="w-full bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                                    value={editingContact.status || 'subscribed'}
                                                    onChange={(e) => setEditingContact({ ...editingContact, status: e.target.value })}
                                                >
                                                    <option value="subscribed">Subscribed</option>
                                                    <option value="unsubscribed">Unsubscribed</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setIsEditModalOpen(false);
                                                    setEditingContact(null);
                                                }}
                                                className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface-variant text-sm font-bold transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit"
                                                className="px-8 py-3 rounded-xl bg-primary text-white font-headline font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Contacts;
