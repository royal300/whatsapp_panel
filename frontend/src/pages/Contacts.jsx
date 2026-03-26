import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await api.get('/contacts');
                setContacts(res.data);
            } catch (err) {
                console.error('Failed to fetch contacts', err);
            }
            setLoading(false);
        };
        fetchContacts();
    }, []);

    const getInitials = (firstName, lastName) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
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
                    <button className="px-5 py-2.5 rounded-xl font-headline font-bold text-sm bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-all active:scale-95 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">upload_file</span>
                        Import CSV
                    </button>
                    <button className="px-6 py-2.5 rounded-xl font-headline font-bold text-sm bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2">
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
                        <select className="bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-primary cursor-pointer outline-none">
                            <option>All Status</option>
                            <option>Subscribed</option>
                            <option>Unsubscribed</option>
                        </select>
                    </div>
                    <div className="bg-surface-container-low px-4 py-2.5 rounded-xl flex items-center gap-3 min-w-[160px]">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tag:</span>
                        <select className="bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-primary cursor-pointer outline-none">
                            <option>Any Tag</option>
                            <option>VIP Clients</option>
                            <option>New Leads</option>
                        </select>
                    </div>
                    <button className="flex items-center gap-2 text-on-surface-variant font-bold text-sm px-2 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-xl">filter_list</span>
                        Advanced Filters
                    </button>
                </div>
                <div className="col-span-12 lg:col-span-4 flex justify-end items-center text-on-surface-variant text-sm font-medium">
                    Showing <span className="text-on-surface font-bold mx-1">{contacts.length}</span> contacts
                </div>
            </div>

            {/* Contacts Data Table */}
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
                                                    {getInitials(contact.first_name, contact.last_name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-on-surface leading-tight">{contact.first_name} {contact.last_name}</p>
                                                    <p className="text-xs text-on-surface-variant">{contact.email || 'No email'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-medium font-body text-on-surface-variant">{contact.phone_number}</span>
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
                                                <button className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/5 rounded-lg">
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button className="p-2 text-on-surface-variant hover:text-error transition-colors hover:bg-error/5 rounded-lg">
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
                {/* Pagination (Static for now) */}
                <div className="px-8 py-6 bg-surface-container-low/50 flex justify-between items-center border-t border-outline-variant/10">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Page 1 of 1</p>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-30" disabled>
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="flex items-center gap-1">
                            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold bg-primary text-white shadow-md">1</button>
                        </div>
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-all disabled:opacity-30" disabled>
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="p-6 bg-white rounded-3xl shadow-[0px_20px_40px_rgba(20,29,36,0.06)] flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">group_add</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">New Total</p>
                        <h4 className="text-2xl font-extrabold font-headline text-on-surface">{contacts.length}</h4>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-[0px_20px_40px_rgba(20,29,36,0.06)] flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-container/30 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Active Subscribers</p>
                        <h4 className="text-2xl font-extrabold font-headline text-on-surface">{contacts.filter(c => c.status === 'subscribed').length}</h4>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-3xl shadow-[0px_20px_40px_rgba(20,29,36,0.06)] flex items-center gap-5">
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
