import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All Status');
    const [filterTag, setFilterTag] = useState('Any Tag');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'import'
    const [selectedContact, setSelectedContact] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form states
    const [formData, setFormData] = useState({ name: '', phone_number: '', profile_picture: '', status: 'subscribed', tags: '' });
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchContacts();
    }, []);

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

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
    };

    const handleOpenModal = (type, contact = null) => {
        setModalType(type);
        if (type === 'edit' && contact) {
            setSelectedContact(contact);
            setFormData({
                name: contact.name,
                phone_number: contact.phone_number,
                profile_picture: contact.profile_picture || '',
                status: contact.status || 'subscribed',
                tags: contact.tags ? contact.tags.map(t => t.name).join(', ') : ''
            });
        } else {
            setSelectedContact(null);
            setFormData({ name: '', phone_number: '', profile_picture: '', status: 'subscribed', tags: '' });
        }
        setIsModalOpen(true);
    };

    const handleSaveContact = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (modalType === 'edit') {
                await api.put(`/contacts/${selectedContact.id}`, formData);
            } else {
                await api.post('/contacts', formData);
            }
            setIsModalOpen(false);
            fetchContacts();
        } catch (err) {
            alert('Failed to save contact. Please check your input.');
        }
        setIsSaving(false);
    };

    const handleDeleteContact = async (id) => {
        if (!window.confirm('Are you sure you want to delete this contact?')) return;
        try {
            await api.delete(`/contacts/${id}`);
            fetchContacts();
        } catch (err) {
            alert('Failed to delete contact.');
        }
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setLoading(true);
        try {
            await api.post('/contacts/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setIsModalOpen(false);
            fetchContacts();
            alert('Contacts imported successfully!');
        } catch (err) {
            alert('Import failed. Please ensure the CSV format is correct.');
        }
        setLoading(false);
    };

    const filteredContacts = contacts.filter(contact => {
        const matchesStatus = filterStatus === 'All Status' || contact.status?.toLowerCase() === filterStatus.toLowerCase();
        const matchesTag = filterTag === 'Any Tag' || (contact.tags && contact.tags.some(t => t.name.toLowerCase() === filterTag.toLowerCase()));
        return matchesStatus && matchesTag;
    });

    const allTags = [...new Set(contacts.flatMap(c => c.tags ? c.tags.map(t => t.name) : []))];

    return (
        <div className="px-10 pb-12">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Contacts</h2>
                    <p className="text-on-surface-variant font-body">Manage your audience and conversational segments with precision.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleOpenModal('import')}
                        className="px-5 py-2.5 rounded-xl font-headline font-bold text-sm bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        Import CSV
                    </button>
                    <button 
                        onClick={() => handleOpenModal('add')}
                        className="px-6 py-2.5 rounded-xl font-headline font-bold text-sm bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Add Contact
                    </button>
                </div>
            </div>

            {/* Filter & Utility Bar */}
            <div className="grid grid-cols-12 gap-6 mb-8">
                <div className="col-span-12 lg:col-span-8 flex flex-wrap gap-4">
                    <div className="bg-surface-container-low px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[160px]">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status:</span>
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-primary cursor-pointer outline-none"
                        >
                            <option>All Status</option>
                            <option>Subscribed</option>
                            <option>Unsubscribed</option>
                        </select>
                    </div>
                    <div className="bg-surface-container-low px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[160px]">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tag:</span>
                        <select 
                            value={filterTag}
                            onChange={(e) => setFilterTag(e.target.value)}
                            className="bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-primary cursor-pointer outline-none"
                        >
                            <option>Any Tag</option>
                            {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                        </select>
                    </div>
                </div>
                <div className="col-span-12 lg:col-span-4 flex justify-end items-center text-on-surface-variant text-sm font-medium">
                    Showing <span className="text-on-surface font-bold mx-1">{filteredContacts.length}</span> contacts
                </div>
            </div>

            {/* Contacts Data Table */}
            <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-[0px_20px_40px_rgba(20,29,36,0.06)]">
                {loading ? (
                    <div className="py-20 text-center text-on-surface-variant font-bold animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Rendering Contacts...
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse text-on-surface">
                        <thead>
                            <tr className="bg-surface-container-low/50">
                                <th className="px-8 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Name</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Phone Number</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Tags</th>
                                <th className="px-6 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline">Status</th>
                                <th className="px-8 py-5 text-[11px] font-black text-on-surface-variant uppercase tracking-[0.15em] font-headline text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-sm">
                            {filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-10 text-center text-on-surface-variant italic font-medium">No contacts found matching your filters</td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact, index) => (
                                    <tr key={contact.id} className="group hover:bg-surface-container-low/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold font-headline ring-2 ring-primary/5">
                                                    {contact.profile_picture ? (
                                                        <img src={contact.profile_picture} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        getInitials(contact.name)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface leading-tight text-base">{contact.name}</p>
                                                    <p className="text-xs text-on-surface-variant">{contact.phone_number}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-medium font-body text-on-surface tracking-wide">{contact.phone_number}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {contact.tags && contact.tags.length > 0 ? contact.tags.map(tag => (
                                                    <span key={tag.id} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-secondary-container/30 text-secondary uppercase tracking-wider border border-secondary/10">
                                                        {tag.name}
                                                    </span>
                                                )) : (
                                                    <span className="text-xs text-on-surface-variant opacity-40">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`flex items-center gap-2 text-[11px] font-black px-3 py-1.5 rounded-full w-fit border ${
                                                contact.status === 'subscribed' 
                                                ? 'text-primary bg-primary/5 border-primary/20' 
                                                : 'text-error bg-error/5 border-error/20'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${contact.status === 'subscribed' ? 'bg-primary animate-pulse' : 'bg-error'}`}></div>
                                                {contact.status ? contact.status.toUpperCase() : 'UNKNOWN'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenModal('edit', contact)}
                                                    className="p-2.5 text-on-surface-variant hover:text-primary transition-all hover:bg-primary/10 rounded-xl"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteContact(contact.id)}
                                                    className="p-2.5 text-on-surface-variant hover:text-error transition-all hover:bg-error/10 rounded-xl"
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

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-surface-container-highest/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-outline-variant/10">
                        {modalType === 'import' ? (
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-black font-headline text-on-surface">Import Contacts</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-10 border-2 border-dashed border-outline-variant rounded-[24px] text-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer group"
                                         onClick={() => fileInputRef.current.click()}>
                                        <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleImportCSV} />
                                        <span className="material-symbols-outlined text-5xl text-primary/40 group-hover:text-primary transition-colors mb-4">cloud_upload</span>
                                        <p className="text-on-surface font-bold">Drop your CSV here</p>
                                        <p className="text-xs text-on-surface-variant mt-1">or click to browse from files</p>
                                    </div>
                                    <div className="bg-surface-container-low p-5 rounded-2xl">
                                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">CSV Template Structure</p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 rounded bg-white text-[10px] font-black border border-outline-variant/30">NAME</span>
                                            <span className="px-2 py-1 rounded bg-white text-[10px] font-black border border-outline-variant/30">PHONE</span>
                                            <span className="px-2 py-1 rounded bg-white text-[10px] font-black border border-outline-variant/30">TAGS</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => window.open('/campaign_template.csv')}
                                        className="w-full py-4 rounded-2xl bg-on-surface text-white font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
                                    >
                                        Download Example CSV
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveContact} className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-black font-headline text-on-surface">{modalType === 'edit' ? 'Edit Contact' : 'Add New Contact'}</h3>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined">close</span></button>
                                </div>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest ml-1">Full Name</label>
                                        <input 
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-5 py-3.5 bg-surface-container-low rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-on-surface" 
                                            placeholder="John Doe" required 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest ml-1">Profile Picture URL</label>
                                        <input 
                                            value={formData.profile_picture} 
                                            onChange={(e) => setFormData({...formData, profile_picture: e.target.value})}
                                            className="w-full px-5 py-3.5 bg-surface-container-low rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-on-surface" 
                                            placeholder="https://example.com/avatar.jpg" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest ml-1">WhatsApp Number</label>
                                        <input 
                                            value={formData.phone_number} 
                                            onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                            className="w-full px-5 py-3.5 bg-surface-container-low rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-on-surface" 
                                            placeholder="+91 99999 00000" required 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest ml-1">Status</label>
                                            <select 
                                                value={formData.status}
                                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                                                className="w-full px-5 py-3.5 bg-surface-container-low rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-on-surface cursor-pointer ring-0"
                                            >
                                                <option value="subscribed">Subscribed</option>
                                                <option value="unsubscribed">Unsubscribed</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-on-surface-variant uppercase tracking-widest ml-1">Tags (Comma Separated)</label>
                                        <input 
                                            value={formData.tags}
                                            onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                            className="w-full px-5 py-3.5 bg-surface-container-low rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none text-on-surface" 
                                            placeholder="VIP, Lead, March 2024" 
                                        />
                                    </div>
                                </div>
                                <button 
                                    disabled={isSaving}
                                    className="w-full mt-8 py-4 rounded-2xl bg-primary text-white font-black text-sm tracking-widest shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'SAVING...' : (modalType === 'edit' ? 'UPDATE CONTACT' : 'SAVE CONTACT')}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="p-6 bg-white rounded-3xl shadow-[0px_20px_40px_rgba(20,29,36,0.06)] flex items-center gap-5 border border-outline-variant/5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">group_add</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">New Total</p>
                        <h4 className="text-2xl font-extrabold font-headline text-on-surface">{contacts.length}</h4>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-[0px_20px_40px_rgba(20,29,36,0.06)] flex items-center gap-5 border border-outline-variant/5">
                    <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Subscribers</p>
                        <h4 className="text-2xl font-extrabold font-headline text-on-surface">{contacts.filter(c => c.status === 'subscribed').length}</h4>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-[0px_20px_40px_rgba(20,29,36,0.06)] flex items-center gap-5 border border-outline-variant/5">
                    <div className="w-14 h-14 rounded-2xl bg-error-container/20 flex items-center justify-center text-error">
                        <span className="material-symbols-outlined text-3xl">block</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Unsubscribed</p>
                        <h4 className="text-2xl font-extrabold font-headline text-on-surface">{contacts.filter(c => c.status === 'unsubscribed').length}</h4>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
