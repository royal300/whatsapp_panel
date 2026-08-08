import React, { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_TYPES = {
    trigger:   { label: 'TRIGGER',   color: '#16a34a', bg: '#16a34a', icon: 'bolt',        textColor: 'white' },
    condition: { label: 'CONDITION', color: '#0d9488', bg: '#0d9488', icon: 'device_hub',   textColor: 'white' },
    action:    { label: 'ACTION',    color: '#7c3aed', bg: '#7c3aed', icon: 'send',         textColor: 'white' },
    message:   { label: 'MESSAGE',  color: '#2563eb', bg: '#2563eb', icon: 'chat',         textColor: 'white' },
};

const SIDEBAR_W = 256;  // left sidebar width px
const TOPNAV_H = 64;    // top nav height px
const PANEL_W  = 300;   // right properties panel width px
const STORAGE_KEY = 'royal300_flows_v2';

const makeFlow = (id, name) => ({
    id, name: name || `Flow ${id}`, published: false,
    nodes: [
        { id: 'n1', type: 'trigger',   title: 'Keyword Trigger',  description: 'Customer says "Hello" or "Hi"',         x: 80,  y: 160, keyword: 'hello' },
        { id: 'n2', type: 'condition', title: 'Existing User?',   description: 'Check DB for phone number match',        x: 380, y: 90  },
        { id: 'n3', type: 'action',    title: 'Send Template',    description: 'Sends the selected WhatsApp template',   x: 660, y: 160, templateId: '', quickReplies: ['Not now', 'Pricing'], actionButtons: ['Browse Catalog', 'Talk to Human'] },
    ],
    edges: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }],
});

// ─── Node Card ────────────────────────────────────────────────────────────────
const NodeCard = ({ node, selected, onSelect, onDragStart, onStartConnect, onEndConnect }) => {
    const info = NODE_TYPES[node.type] || NODE_TYPES.action;
    return (
        <div
            style={{ position: 'absolute', left: node.x, top: node.y, width: 220, cursor: 'grab', userSelect: 'none', zIndex: selected ? 10 : 5 }}
            onMouseDown={e => { e.stopPropagation(); onDragStart(e, node.id); onSelect(node.id); }}
            onClick={e => e.stopPropagation()}
        >
            <div style={{
                borderRadius: 16, overflow: 'hidden', background: 'white',
                boxShadow: selected ? `0 0 0 2.5px ${info.color}, 0 12px 40px rgba(0,0,0,0.15)` : '0 4px 20px rgba(0,0,0,0.10)',
                transition: 'box-shadow 0.15s',
            }}>
                {/* Header */}
                <div style={{ background: info.bg, padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'white' }}>{info.label}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'white' }}>{info.icon}</span>
                </div>
                {/* Body */}
                <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>{node.title}</p>
                    <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0', lineHeight: 1.5 }}>{node.description}</p>
                    {/* keyword badge */}
                    {node.type === 'trigger' && node.keyword && (
                        <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                            "{node.keyword}"
                        </span>
                    )}
                </div>
            </div>
            {/* right connector dot */}
            <div 
                style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: info.color, border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.18)', cursor: 'crosshair' }} 
                onMouseDown={e => { e.stopPropagation(); onStartConnect && onStartConnect(node.id, e); }}
            />
            {/* left connector dot */}
            {node.type !== 'trigger' && (
                <div 
                    style={{ position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: '#fff', border: `2px solid ${info.color}`, boxShadow: '0 2px 6px rgba(0,0,0,0.12)', cursor: 'crosshair' }} 
                    onMouseUp={e => { e.stopPropagation(); onEndConnect && onEndConnect(node.id); }}
                />
            )}
        </div>
    );
};

// ─── Edge Arrows ──────────────────────────────────────────────────────────────
const EdgeArrows = ({ nodes, edges, connecting, zoom, onGrabEdge }) => {
    const pt = (id, side) => {
        const n = nodes.find(n => n.id === id);
        if (!n) return { x: 0, y: 0 };
        return side === 'right' ? { x: n.x + 226, y: n.y + 55 } : { x: n.x - 6, y: n.y + 55 };
    };
    return (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
                <marker id="arrowTip" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#16a34a" />
                </marker>
                <marker id="arrowTipRed" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
            </defs>
            {edges.map((edge, i) => {
                const f = pt(edge.from, 'right');
                const t = pt(edge.to, 'left');
                const cx = (f.x + t.x) / 2;
                return (
                    <g key={i}>
                        <path
                            d={`M ${f.x} ${f.y} C ${cx} ${f.y}, ${cx} ${t.y}, ${t.x} ${t.y}`}
                            fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="6 4"
                            markerEnd="url(#arrowTip)" opacity="0.7"
                        />
                        <path
                            d={`M ${f.x} ${f.y} C ${cx} ${f.y}, ${cx} ${t.y}, ${t.x} ${t.y}`}
                            fill="none" stroke="transparent" strokeWidth="20"
                            style={{ pointerEvents: 'auto', cursor: 'grab' }}
                            onMouseDown={(e) => { e.stopPropagation(); onGrabEdge(i, edge.from, e); }}
                            onMouseEnter={(e) => { e.target.previousSibling.style.stroke = '#22c55e'; e.target.previousSibling.style.strokeWidth = '3'; e.target.previousSibling.setAttribute('marker-end', 'url(#arrowTipRed)'); }}
                            onMouseLeave={(e) => { e.target.previousSibling.style.stroke = '#16a34a'; e.target.previousSibling.style.strokeWidth = '2'; e.target.previousSibling.setAttribute('marker-end', 'url(#arrowTip)'); }}
                        />
                    </g>
                );
            })}
            {connecting && (() => {
                const f = pt(connecting.from, 'right');
                const t = { x: (connecting.curX - SIDEBAR_W) / (zoom / 100), y: (connecting.curY - TOPNAV_H) / (zoom / 100) };
                const cx = (f.x + t.x) / 2;
                return (
                    <path
                        d={`M ${f.x} ${f.y} C ${cx} ${f.y}, ${cx} ${t.y}, ${t.x} ${t.y}`}
                        fill="none" stroke="#16a34a" strokeWidth="2" strokeDasharray="6 4"
                        opacity="0.5" pointerEvents="none"
                    />
                );
            })()}
        </svg>
    );
};

// ─── Properties Panel ─────────────────────────────────────────────────────────
const PropertiesPanel = ({ node, templates, onUpdate, onClose }) => {
    const [newBtn, setNewBtn] = useState('');
    const [newReply, setNewReply] = useState('');

    // Reset local state on node change
    useEffect(() => { setNewBtn(''); setNewReply(''); }, [node?.id]);

    if (!node) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: '0 28px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#16a34a', opacity: 0.5 }}>account_tree</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#bbb', lineHeight: 1.6 }}>Click any node on the canvas to edit its properties</p>
        </div>
    );

    const info = NODE_TYPES[node.type] || NODE_TYPES.action;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'white' }}>{info.icon}</span>
                    </div>
                    <div>
                        <p style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#aaa', margin: 0 }}>Action Properties</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#222', margin: '1px 0 0' }}>{info.label} Node</p>
                    </div>
                </div>
                <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: '#f5f5f5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#888' }}>close</span>
                </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Label */}
                <div>
                    <label style={LABEL_STYLE}>Node Label</label>
                    <input style={INPUT_STYLE} value={node.title} onChange={e => onUpdate({ title: e.target.value })} />
                </div>
                {/* Description */}
                <div>
                    <label style={LABEL_STYLE}>Description</label>
                    <input style={INPUT_STYLE} value={node.description} onChange={e => onUpdate({ description: e.target.value })} />
                </div>

                {/* Trigger: keyword */}
                {node.type === 'trigger' && (
                    <div>
                        <label style={LABEL_STYLE}>Trigger Keyword</label>
                        <input style={INPUT_STYLE} placeholder='e.g. hello' value={node.keyword || ''} onChange={e => onUpdate({ keyword: e.target.value })} />
                        <p style={{ fontSize: 10, color: '#ccc', marginTop: 5 }}>Case-insensitive. Fires when message matches exactly.</p>
                    </div>
                )}

                {/* Action: template + buttons + quick replies */}
                {node.type === 'action' && (<>
                    <div>
                        <label style={LABEL_STYLE}>Select Template</label>
                        <select style={{ ...INPUT_STYLE, appearance: 'none', background: 'white' }}
                            value={node.templateId || ''} onChange={e => onUpdate({ templateId: e.target.value })}>
                            <option value="">-- Select a template --</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.status})</option>)}
                        </select>
                    </div>
                    {node.templateId && (() => {
                        const t = templates.find(t => String(t.id) === String(node.templateId));
                        const body = t?.content?.find(c => c.type === 'BODY')?.text;
                        return body ? (
                            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#555', fontStyle: 'italic', lineHeight: 1.7, border: '1px solid #e5e7eb' }}>
                                {body}
                            </div>
                        ) : null;
                    })()}

                    {/* Action Buttons */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <label style={LABEL_STYLE}>Action Buttons</label>
                            <button onClick={() => { if (newBtn.trim()) { onUpdate({ actionButtons: [...(node.actionButtons || []), newBtn.trim()] }); setNewBtn(''); } }}
                                style={{ fontSize: 10, fontWeight: 900, color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span> Add
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(node.actionButtons || []).map((btn, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', background: '#fafafa' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#ccc' }}>link</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#444', flex: 1 }}>{btn}</span>
                                    <button onClick={() => onUpdate({ actionButtons: node.actionButtons.filter((_, j) => j !== i) })}
                                        style={{ width: 20, height: 20, borderRadius: '50%', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#ef4444' }}>close</span>
                                    </button>
                                </div>
                            ))}
                            <input style={{ ...INPUT_STYLE, border: '1px dashed #d1d5db', fontSize: 12, padding: '8px 12px' }}
                                placeholder="Button label..." value={newBtn} onChange={e => setNewBtn(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newBtn.trim()) { onUpdate({ actionButtons: [...(node.actionButtons || []), newBtn.trim()] }); setNewBtn(''); } }} />
                        </div>
                    </div>

                    {/* Quick Replies */}
                    <div>
                        <label style={{ ...LABEL_STYLE, display: 'block', marginBottom: 8 }}>Quick Replies</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {(node.quickReplies || []).map((qr, i) => (
                                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                                    {qr}
                                    <button onClick={() => onUpdate({ quickReplies: node.quickReplies.filter((_, j) => j !== i) })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#86efac', display: 'flex', lineHeight: 1 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                                    </button>
                                </span>
                            ))}
                            <input style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, border: '1px dashed #d1d5db', color: '#999', outline: 'none', width: 75, minWidth: 0 }}
                                placeholder="Add..." value={newReply} onChange={e => setNewReply(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && newReply.trim()) { onUpdate({ quickReplies: [...(node.quickReplies || []), newReply.trim()] }); setNewReply(''); } }} />
                        </div>
                    </div>
                </>)}

                {/* Message node */}
                {node.type === 'message' && (
                    <div>
                        <label style={LABEL_STYLE}>Message Text</label>
                        <textarea 
                            style={{ ...INPUT_STYLE, minHeight: 100, resize: 'vertical', lineHeight: 1.5 }} 
                            placeholder="Type the custom message to send..." 
                            value={node.messageText || ''} 
                            onChange={e => onUpdate({ messageText: e.target.value })} 
                        />
                        <p style={{ fontSize: 10, color: '#ccc', marginTop: 5 }}>Sends a standard text message (no template approval required if within 24h window).</p>
                    </div>
                )}

                {/* Condition node extras */}
                {node.type === 'condition' && (
                    <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px', border: '1px solid #bbf7d0' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', margin: '0 0 4px' }}>Condition Logic</p>
                        <p style={{ fontSize: 11, color: '#555', margin: 0, lineHeight: 1.6 }}>Checks if the customer's phone number already exists in your contacts database. Branches accordingly.</p>
                    </div>
                )}
            </div>

            {/* Save footer */}
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                <button onClick={onClose}
                    style={{ width: '100%', padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                    Save Changes
                </button>
            </div>
        </div>
    );
};

const LABEL_STYLE = { fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#aaa', display: 'block', marginBottom: 6 };
const INPUT_STYLE = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 600, color: '#222', outline: 'none', boxSizing: 'border-box' };

// ─── Main FlowBuilder ──────────────────────────────────────────────────────────
const FlowBuilder = () => {
    const [flows, setFlows] = useState(() => {
        try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : [makeFlow(1, 'Welcome Flow')]; }
        catch { return [makeFlow(1, 'Welcome Flow')]; }
    });
    const [activeFlowId, setActiveFlowId] = useState(() => {
        try { const s = localStorage.getItem(STORAGE_KEY); if (s) return JSON.parse(s)[0]?.id || 1; } catch {}
        return 1;
    });
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [zoom, setZoom] = useState(100);
    const [dragging, setDragging] = useState(null);
    const [connecting, setConnecting] = useState(null);
    const [showFlowList, setShowFlowList] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [testingFlow, setTestingFlow] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => { api.get('/templates').then(r => setTemplates(r.data || [])).catch(() => {}); }, []);

    const save = (updated) => { setFlows(updated); localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); };
    const patch = (fn) => save(flows.map(f => f.id === activeFlowId ? fn(f) : f));

    const activeFlow = flows.find(f => f.id === activeFlowId) || flows[0];

    // ── edge connections ──────────────────────────────────────────────────────
    const onStartConnect = useCallback((nodeId, e) => {
        setConnecting({ from: nodeId, sx: e.clientX, sy: e.clientY, curX: e.clientX, curY: e.clientY });
    }, []);

    const onEndConnect = useCallback((nodeId) => {
        if (connecting && connecting.from !== nodeId) {
            patch(f => {
                if (f.edges.some(e => e.from === connecting.from && e.to === nodeId)) return f;
                return { ...f, edges: [...f.edges, { from: connecting.from, to: nodeId }] };
            });
        }
        setConnecting(null);
    }, [connecting]);

    const onGrabEdge = useCallback((index, fromNodeId, e) => {
        patch(f => ({ ...f, edges: f.edges.filter((_, i) => i !== index) }));
        setConnecting({ from: fromNodeId, sx: e.clientX, sy: e.clientY, curX: e.clientX, curY: e.clientY });
    }, []);

    // ── drag ──────────────────────────────────────────────────────────────────
    const onDragStart = useCallback((e, nodeId) => {
        const n = activeFlow.nodes.find(n => n.id === nodeId);
        setDragging({ nodeId, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y });
    }, [activeFlow]);

    const onMouseMove = useCallback((e) => {
        if (dragging) {
            const sc = zoom / 100;
            const dx = (e.clientX - dragging.sx) / sc;
            const dy = (e.clientY - dragging.sy) / sc;
            patch(f => ({ ...f, nodes: f.nodes.map(n => n.id === dragging.nodeId ? { ...n, x: Math.max(10, dragging.ox + dx), y: Math.max(10, dragging.oy + dy) } : n) }));
        } else if (connecting) {
            setConnecting(prev => ({ ...prev, curX: e.clientX, curY: e.clientY }));
        }
    }, [dragging, connecting, zoom, activeFlow]);

    const onMouseUp = useCallback(() => {
        setDragging(null);
        if (connecting) setConnecting(null);
    }, [connecting]);

    // ── node ops ──────────────────────────────────────────────────────────────
    const addNode = (type) => {
        const id = `n${Date.now()}`;
        const node = { id, type, title: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`, description: 'Configure in properties panel',
            x: 220 + Math.random() * 200, y: 120 + Math.random() * 160,
            ...(type === 'action' ? { templateId: '', actionButtons: [], quickReplies: [] } : {}),
            ...(type === 'message' ? { messageText: '' } : {}),
            ...(type === 'trigger' ? { keyword: '' } : {}) };
        patch(f => ({ ...f, nodes: [...f.nodes, node] }));
        setSelectedNodeId(id);
    };

    const deleteNode = () => {
        if (!selectedNodeId) return;
        patch(f => ({ ...f, nodes: f.nodes.filter(n => n.id !== selectedNodeId), edges: f.edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId) }));
        setSelectedNodeId(null);
    };

    const updateNode = (updates) => patch(f => ({ ...f, nodes: f.nodes.map(n => n.id === selectedNodeId ? { ...n, ...updates } : n) }));

    // ── test flow ─────────────────────────────────────────────────────────────
    const runTest = () => {
        const flow = activeFlow;
        const issues = [];
        flow.nodes.forEach(n => {
            if (n.type === 'trigger' && !n.keyword) issues.push(`Node "${n.title}": keyword is empty`);
            if (n.type === 'action' && !n.templateId) issues.push(`Node "${n.title}": no template selected`);
            if (n.type === 'message' && !n.messageText?.trim()) issues.push(`Node "${n.title}": message text is empty`);
        });
        // check all non-trigger nodes have incoming edge
        flow.nodes.filter(n => n.type !== 'trigger').forEach(n => {
            if (!flow.edges.find(e => e.to === n.id)) issues.push(`Node "${n.title}": has no incoming connection`);
        });
        setTestResult({ ok: issues.length === 0, issues });
        setTestingFlow(true);
        setTimeout(() => setTestingFlow(false), 4000);
    };

    // ── flow management ───────────────────────────────────────────────────────
    const createFlow = () => {
        const id = Date.now();
        const f = makeFlow(id, `Flow ${flows.length + 1}`);
        save([...flows, f]);
        setActiveFlowId(id);
        setSelectedNodeId(null);
        setShowFlowList(false);
    };

    const deleteFlow = (id) => {
        if (flows.length === 1) { alert('Cannot delete the only flow.'); return; }
        const updated = flows.filter(f => f.id !== id);
        save(updated);
        if (activeFlowId === id) setActiveFlowId(updated[0].id);
        setShowFlowList(false);
    };

    const selectedNode = activeFlow?.nodes?.find(n => n.id === selectedNodeId) || null;

    // ── The component renders OUTSIDE the Layout padding by using negative margin trick
    return (
        <div style={{
            position: 'fixed',
            top: TOPNAV_H,
            left: SIDEBAR_W,
            right: 0,
            bottom: 0,
            display: 'flex',
            zIndex: 20,
            fontFamily: 'inherit',
        }}>
            {/* ── Canvas ── */}
            <div
                style={{ flex: 1, position: 'relative', overflow: 'hidden',
                    backgroundImage: 'radial-gradient(circle, rgba(0,109,47,0.14) 1.2px, transparent 1.2px)',
                    backgroundSize: '28px 28px', backgroundColor: '#eef2ee',
                    cursor: dragging ? 'grabbing' : 'default' }}
                onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                onClick={e => {
                    // Only deselect when clicking the empty canvas background.
                    // Clicks on nodes stop propagation themselves, so this
                    // only fires for genuine canvas-background clicks.
                    if (e.target === e.currentTarget) {
                        setSelectedNodeId(null);
                        setShowFlowList(false);
                    }
                }}
            >
                {/* ── Top toolbar ── */}
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'white', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #ebebeb', padding: '7px 14px' }}>
                    <button onClick={() => setZoom(z => Math.max(40, z - 10))} style={TOOL_BTN}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#666' }}>zoom_out</span>
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 900, color: '#999', width: 40, textAlign: 'center' }}>{zoom}%</span>
                    <button onClick={() => setZoom(z => Math.min(160, z + 10))} style={TOOL_BTN}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#666' }}>zoom_in</span>
                    </button>
                    <div style={{ width: 1, height: 20, background: '#ebebeb', margin: '0 2px' }} />
                    <button onClick={runTest}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_arrow</span>
                        Test Flow
                    </button>
                    <button onClick={async () => {
                        const flow = activeFlow;
                        if (!flow) return;
                        
                        // Parse nodes to get rule data
                        const triggerNode = flow.nodes.find(n => n.type === 'trigger');
                        const actionNode = flow.nodes.find(n => n.type === 'action');
                        
                        if (!triggerNode || !triggerNode.keyword) {
                            alert("Trigger node must have a keyword configured to publish.");
                            return;
                        }
                        if (!actionNode || !actionNode.templateId) {
                            alert("Action node must have a WhatsApp template selected to publish.");
                            return;
                        }

                        const payload = {
                            name: flow.name,
                            trigger_keyword: triggerNode.keyword,
                            trigger_type: 'keyword',
                            action_type: 'send_message',
                            template_id: actionNode.templateId,
                            is_active: true
                        };

                        try {
                            // Find if this flow exists in the DB
                            const existingRules = await api.get('/automation-rules');
                            const match = existingRules.data.find(r => r.name === flow.name);
                            
                            if (flow.published) {
                                // Unpublish
                                if (match) await api.delete(`/automation-rules/${match.id}`);
                                patch(f => ({ ...f, published: false }));
                                alert("Flow unpublished and turned off.");
                            } else {
                                // Publish
                                if (match) {
                                    await api.put(`/automation-rules/${match.id}`, payload);
                                } else {
                                    await api.post('/automation-rules', payload);
                                }
                                patch(f => ({ ...f, published: true }));
                                alert("Flow published successfully! It is now active on the backend.");
                            }
                        } catch (error) {
                            console.error("Failed to publish flow", error);
                            alert("Error publishing flow to backend. See console.");
                        }
                    }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 900, color: 'white', background: activeFlow?.published ? '#15803d' : '#16a34a', border: 'none', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{activeFlow?.published ? 'check_circle' : 'publish'}</span>
                        {activeFlow?.published ? 'Published ✓' : 'Publish'}
                    </button>
                </div>

                {/* ── Flow selector ── */}
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 14, left: 14, zIndex: 25 }}>
                    <button onClick={() => setShowFlowList(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.10)', border: '1px solid #ebebeb', padding: '9px 14px', fontSize: 13, fontWeight: 700, color: '#333', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#16a34a' }}>account_tree</span>
                        {activeFlow?.name || 'Flows'}
                        <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#aaa' }}>expand_more</span>
                        {activeFlow?.published && <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 999, background: '#dcfce7', color: '#16a34a', letterSpacing: '0.08em' }}>Live</span>}
                    </button>
                    {showFlowList && (
                        <div style={{ position: 'absolute', top: 52, left: 0, background: 'white', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.14)', border: '1px solid #ebebeb', padding: 8, minWidth: 230, zIndex: 35 }}>
                            {flows.map(f => (
                                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: f.id === activeFlowId ? '#f0fdf4' : 'transparent' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: f.id === activeFlowId ? '#16a34a' : '#ddd' }}>account_tree</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: f.id === activeFlowId ? '#16a34a' : '#444', flex: 1, cursor: 'pointer' }}
                                        onClick={() => { setActiveFlowId(f.id); setSelectedNodeId(null); setShowFlowList(false); }}>{f.name}</span>
                                    {f.published && <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 999, background: '#dcfce7', color: '#16a34a' }}>Live</span>}
                                    <button onClick={() => deleteFlow(f.id)} style={{ width: 20, height: 20, borderRadius: '50%', background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#ef4444' }}>close</span>
                                    </button>
                                </div>
                            ))}
                            <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 4, paddingTop: 4 }}>
                                <button onClick={createFlow} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span> New Flow
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Bottom add-node toolbar ── */}
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 25,
                    display: 'flex', alignItems: 'center', gap: 6, background: 'white', borderRadius: 20,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #ebebeb', padding: '8px 14px' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#bbb', marginRight: 4 }}>Add Node</span>
                    {Object.entries(NODE_TYPES).map(([type, info]) => (
                        <button key={type} onClick={() => addNode(type)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: 'white', background: info.bg, border: 'none', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{info.icon}</span>
                            {info.label}
                        </button>
                    ))}
                    {selectedNodeId && <>
                        <div style={{ width: 1, height: 18, background: '#ebebeb', margin: '0 4px' }} />
                        <button onClick={deleteNode}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#ef4444', background: '#fee2e2', border: 'none', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>delete</span> Delete
                        </button>
                    </>}
                </div>

                {/* ── Canvas node area ── */}
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', position: 'absolute', inset: 0,
                    width: `${(100 / zoom) * 100}%`, height: `${(100 / zoom) * 100}%` }}>
                    <EdgeArrows nodes={activeFlow?.nodes || []} edges={activeFlow?.edges || []} connecting={connecting} zoom={zoom} onGrabEdge={onGrabEdge} />
                    {(activeFlow?.nodes || []).map(node => (
                        <NodeCard key={node.id} node={node} selected={selectedNodeId === node.id}
                            onSelect={setSelectedNodeId} onDragStart={onDragStart} onStartConnect={onStartConnect} onEndConnect={onEndConnect} />
                    ))}
                    {(!activeFlow?.nodes?.length) && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <div style={{ textAlign: 'center', color: '#ccc' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 70, opacity: 0.25 }}>account_tree</span>
                                <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>Use "Add Node" below to start building</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Test result toast ── */}
                {testingFlow && testResult && (
                    <div style={{ position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)', zIndex: 35,
                        background: testResult.ok ? '#16a34a' : '#dc2626', color: 'white',
                        padding: '14px 24px', borderRadius: 16,
                        boxShadow: `0 8px 32px ${testResult.ok ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)'}`,
                        display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, fontWeight: 600, maxWidth: 420 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{testResult.ok ? 'check_circle' : 'warning'}</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: 900 }}>{testResult.ok ? 'Flow is valid — All nodes connected & configured!' : `${testResult.issues.length} issue${testResult.issues.length > 1 ? 's' : ''} found:`}</p>
                            {!testResult.ok && testResult.issues.map((issue, i) => (
                                <p key={i} style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.9 }}>• {issue}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Properties Panel ── */}
            <div style={{ width: PANEL_W, flexShrink: 0, background: 'white', borderLeft: '1px solid #ebebeb',
                boxShadow: '-6px 0 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 30 }}>
                <PropertiesPanel node={selectedNode} templates={templates} onUpdate={updateNode} onClose={() => setSelectedNodeId(null)} />
            </div>
        </div>
    );
};

const TOOL_BTN = { width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f7f7f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default FlowBuilder;
