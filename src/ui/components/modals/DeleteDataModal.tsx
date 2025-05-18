import React, { useEffect, useState } from 'react';
import ConfirmModal from './ConfirmModal';

interface DeleteDataModalProps {
  open: boolean;
  onClose: () => void;
}

type StoreKey = {
  key: string;
  label: string;
  description?: string;
};

const STORE_KEYS: StoreKey[] = [
  { key: 'workflows', label: 'Workflows', description: 'All your saved workflows and actions.' },
  { key: 'trendingContent', label: 'Trending Content', description: 'Cached trending repositories and news.' },
  { key: 'codemate_terminal_snippets', label: 'Terminal Snippets', description: 'Your saved terminal command snippets.' },
  { key: 'termsAccepted', label: 'Terms Accepted', description: 'Your acceptance of Terms & Conditions.' },
  { key: 'privacyAccepted', label: 'Privacy Accepted', description: 'Your acceptance of Privacy Policy.' },
  { key: 'timeSavedSeconds', label: 'Time Saved', description: 'Your total time saved analytics.' },
];

export default function DeleteDataModal({ open, onClose }: DeleteDataModalProps) {
  const [storeData, setStoreData] = useState<Record<string, any>>({});
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<{ _id: string, name: string } | null>(null);
  const [snippetToDelete, setSnippetToDelete] = useState<{ id: string, command: string } | null>(null);
  const [localSnippets, setLocalSnippets] = useState<any[]>([]);
  const [confirmAllWorkflows, setConfirmAllWorkflows] = useState(false);
  const [confirmAllSnippets, setConfirmAllSnippets] = useState(false);

  useEffect(() => {
    if (!open) return;
    Promise.all(
      STORE_KEYS.map(async ({ key }) => {
        const value = await window.electron.getUserStoreValue!({ key });
        return [key, value];
      })
    ).then(entries => {
      const storeObj = Object.fromEntries(entries);
      // Fallback: if codemate_terminal_snippets is missing, check localStorage
      if (
        (!Array.isArray(storeObj.codemate_terminal_snippets) || storeObj.codemate_terminal_snippets.length === 0)
        && typeof window !== "undefined"
      ) {
        try {
          const raw = localStorage.getItem('codemate_terminal_snippets');
          if (raw) {
            const arr = JSON.parse(raw);
            setLocalSnippets(Array.isArray(arr) ? arr : []);
            storeObj.codemate_terminal_snippets = arr;
          }
        } catch {
          setLocalSnippets([]);
        }
      } else {
        setLocalSnippets([]);
      }
      setStoreData(storeObj);
    });
  }, [open]);

  // --- Workflow Deletion ---
  const handleDeleteWorkflow = (workflow: { _id: string, name: string }) => setWorkflowToDelete(workflow);
  const handleDeleteAllWorkflows = () => setConfirmAllWorkflows(true);

  const doDeleteWorkflow = async () => {
    if (!workflowToDelete) return;
    const workflows = Array.isArray(storeData.workflows) ? storeData.workflows : [];
    const newWorkflows = workflows.filter((w: any) => w._id !== workflowToDelete._id);
    await window.electron.setUserStoreValue!({ key: 'workflows', value: newWorkflows });
    setStoreData(prev => ({ ...prev, workflows: newWorkflows }));
    setWorkflowToDelete(null);
    window.location.href = '/';
  };

  const doDeleteAllWorkflows = async () => {
    await window.electron.setUserStoreValue!({ key: 'workflows', value: [] });
    setStoreData(prev => ({ ...prev, workflows: [] }));
    setConfirmAllWorkflows(false);
    window.location.href = '/';
  };

  // --- Terminal Snippet Deletion ---
  const handleDeleteSnippet = (snippet: { id: string, command: string }) => setSnippetToDelete(snippet);
  const handleDeleteAllSnippets = () => setConfirmAllSnippets(true);

  const doDeleteSnippet = async () => {
    const snippets = Array.isArray(storeData.codemate_terminal_snippets)
      ? storeData.codemate_terminal_snippets
      : localSnippets;
    const newSnippets = snippets.filter((s: any) => s.id !== snippetToDelete?.id);
    await window.electron.setUserStoreValue!({ key: 'codemate_terminal_snippets', value: newSnippets });
    setStoreData(prev => ({ ...prev, codemate_terminal_snippets: newSnippets }));
    setSnippetToDelete(null);
    window.location.href = '/';
  };

  const doDeleteAllSnippets = async () => {
    await window.electron.setUserStoreValue!({ key: 'codemate_terminal_snippets', value: [] });
    setStoreData(prev => ({ ...prev, codemate_terminal_snippets: [] }));
    setConfirmAllSnippets(false);
    window.location.href = '/';
  };

  // --- Other Data Deletion ---
  const handleDelete = (key: string) => setConfirmKey(key);
  const handleDeleteAll = () => setConfirmAll(true);

  const doDelete = async (key: string) => {
    await window.electron.deleteUserStoreKey!({ key });
    setStoreData(prev => ({ ...prev, [key]: undefined }));
    setConfirmKey(null);
    window.location.href = '/';
  };

  const doDeleteAll = async () => {
    for (const { key } of STORE_KEYS) {
      await window.electron.deleteUserStoreKey!({ key });
    }
    setStoreData({});
    setConfirmAll(false);
    onClose();
    window.location.href = '/';
  };

  // --- Render ---
  return open ? (
    <div className="action-modal-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.35)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }} onClick={onClose}>
      <div className="action-modal-content" style={{
        background: 'var(--card-bg)',
        color: 'var(--text-color)',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        padding: 32,
        maxWidth: 580,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Delete Local Data</h2>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: 'var(--secondary-color)',
              cursor: 'pointer'
            }}
            onClick={onClose}
            aria-label="Close"
          >×</button>
        </div>
        <p style={{ fontSize: 13, marginBottom: 16, color: 'gray' }}>
          Manage and delete your locally stored data. This action cannot be undone.
        </p>
        <div style={{
          fontSize: 15,
          lineHeight: 1.7,
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
          maxHeight: 'calc(60vh - 80px)',
          paddingRight: 4
        }} className="analytics-scrollable">
          <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {/* --- Workflows --- */}
            {Array.isArray(storeData.workflows) && (
              <li style={{
                marginBottom: 8,
                padding: '8px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>Workflows</strong>
                    <div style={{ fontSize: 13, color: 'var(--secondary-color)' }}>
                      All your saved workflows and actions.
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--secondary-color)',
                        marginTop: 2,
                        maxHeight: 80,
                        overflowY: 'auto',
                        paddingRight: 2
                      }}
                      className="analytics-scrollable"
                    >
                      {storeData.workflows.length > 0 ? (
                        <ul style={{
                          margin: 0,
                          paddingLeft: 0,
                          maxHeight: 80,
                          overflowY: 'auto',
                          listStyle: 'none'
                        }} className="analytics-scrollable">
                          {storeData.workflows.map((w: any) =>
                            <li key={w._id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              maxWidth: 320,
                              marginBottom: 4,
                              padding: '0 0 0 12px'
                            }}>
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1
                              }}>{w.name}</span>
                              <button
                                style={{
                                  background: 'var(--danger-color, #e53e3e)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '4px 12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  marginLeft: 12,
                                  float: 'right'
                                }}
                                onClick={() => handleDeleteWorkflow({ _id: w._id, name: w.name })}
                              >
                                Delete
                              </button>
                            </li>
                          )}
                        </ul>
                      ) : (
                        <span style={{ color: 'var(--danger-color, #e53e3e)' }}>No workflows</span>
                      )}
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'var(--danger-color, #e53e3e)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 16px',
                      fontWeight: 600,
                      cursor: storeData.workflows.length === 0 ? 'not-allowed' : 'pointer',
                      marginLeft: 16,
                      opacity: storeData.workflows.length === 0 ? 0.5 : 1
                    }}
                    disabled={storeData.workflows.length === 0}
                    onClick={handleDeleteAllWorkflows}
                  >
                    Delete All Workflows
                  </button>
                </div>
              </li>
            )}
            {/* --- Terminal Snippets --- */}
            {(Array.isArray(storeData.codemate_terminal_snippets) || Array.isArray(localSnippets)) && (
              <li key="codemate_terminal_snippets" style={{
                marginBottom: 18,
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>Terminal Snippets</strong>
                    <div style={{ fontSize: 13, color: 'var(--secondary-color)' }}>
                      Your saved terminal command snippets.
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--secondary-color)',
                        marginTop: 2,
                        maxHeight: 80,
                        overflowY: 'auto',
                        paddingRight: 2
                      }}
                      className="analytics-scrollable"
                    >
                      {(Array.isArray(storeData.codemate_terminal_snippets) && storeData.codemate_terminal_snippets.length > 0
                        ? storeData.codemate_terminal_snippets
                        : localSnippets
                      ).length > 0 ? (
                        <ul style={{
                          margin: 0,
                          paddingLeft: 0,
                          maxHeight: 80,
                          overflowY: 'auto',
                          listStyle: 'none'
                        }} className="analytics-scrollable">
                          {(Array.isArray(storeData.codemate_terminal_snippets) && storeData.codemate_terminal_snippets.length > 0
                            ? storeData.codemate_terminal_snippets
                            : localSnippets
                          ).map((s: any, idx: number) =>
                            <li key={s.id || idx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              maxWidth: 320,
                              marginBottom: 4,
                              padding: '0 0 0 12px'
                            }}>
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1
                              }}>{s.command}</span>
                              <button
                                style={{
                                  background: 'var(--danger-color, #e53e3e)',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '4px 12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  marginLeft: 12,
                                  float: 'right'
                                }}
                                onClick={() => handleDeleteSnippet({ id: s.id, command: s.command })}
                              >
                                Delete
                              </button>
                            </li>
                          )}
                        </ul>
                      ) : (
                        <span style={{ color: 'var(--danger-color, #e53e3e)' }}>No snippets</span>
                      )}
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'var(--danger-color, #e53e3e)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 16px',
                      fontWeight: 600,
                      cursor: ((Array.isArray(storeData.codemate_terminal_snippets) && storeData.codemate_terminal_snippets.length === 0)
                        || (Array.isArray(localSnippets) && localSnippets.length === 0)) ? 'not-allowed' : 'pointer',
                      marginLeft: 16,
                      opacity: ((Array.isArray(storeData.codemate_terminal_snippets) && storeData.codemate_terminal_snippets.length === 0)
                        || (Array.isArray(localSnippets) && localSnippets.length === 0)) ? 0.5 : 1
                    }}
                    disabled={
                      (Array.isArray(storeData.codemate_terminal_snippets) && storeData.codemate_terminal_snippets.length === 0)
                      && (Array.isArray(localSnippets) && localSnippets.length === 0)
                    }
                    onClick={handleDeleteAllSnippets}
                  >
                    Delete All Snippets
                  </button>
                </div>
              </li>
            )}
            {/* --- Trending Content --- */}
            <li key="trendingContent" style={{
              marginBottom: 18,
              padding: '12px 0',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Trending data</strong>
                  <div style={{ fontSize: 13, color: 'var(--secondary-color)' }}>Cached trending repositories and news.</div>
                  <div style={{ fontSize: 12, color: 'var(--secondary-color)', marginTop: 2 }}>
                    {storeData.trendingContent
                      ? <span>Cached</span>
                      : <span style={{ color: 'var(--danger-color, #e53e3e)' }}>Deleted</span>}
                  </div>
                </div>
                <button
                  style={{
                    background: 'var(--danger-color, #e53e3e)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginLeft: 16,
                    opacity: storeData.trendingContent ? 1 : 0.5
                  }}
                  disabled={!storeData.trendingContent}
                  onClick={() => handleDelete('trendingContent')}
                >
                  Delete
                </button>
              </div>
            </li>
            {/* --- Other keys --- */}
            {STORE_KEYS.filter(k =>
              k.key !== 'workflows' &&
              k.key !== 'trendingContent' &&
              k.key !== 'codemate_terminal_snippets'
            ).map(({ key, label, description }) => (
              <li key={key} style={{
                marginBottom: 18,
                padding: '12px 0',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{label}</strong>
                    <div style={{ fontSize: 13, color: 'var(--secondary-color)' }}>{description}</div>
                    <div style={{ fontSize: 12, color: 'var(--secondary-color)', marginTop: 2 }}>
                      {typeof storeData[key] !== 'undefined'
                        ? <span>Current: <code>{String(storeData[key])}</code></span>
                        : <span style={{ color: 'var(--danger-color, #e53e3e)' }}>Deleted</span>}
                    </div>
                  </div>
                  <button
                    style={{
                      background: 'var(--danger-color, #e53e3e)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '6px 16px',
                      fontWeight: 600,
                      cursor: typeof storeData[key] === 'undefined' ? 'not-allowed' : 'pointer',
                      marginLeft: 16,
                      opacity: typeof storeData[key] === 'undefined' ? 0.5 : 1
                    }}
                    disabled={typeof storeData[key] === 'undefined'}
                    onClick={() => handleDelete(key)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              style={{
                background: 'var(--danger-color, #e53e3e)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                marginTop: 8
              }}
              onClick={handleDeleteAll}
              disabled={Object.values(storeData).every(v =>
                (Array.isArray(v) && v.length === 0) ||
                v === undefined ||
                v === null
              )}
            >
              Delete All Data
            </button>
          </div>
        </div>
        {/* Confirm modals */}
        <ConfirmModal
          isOpen={!!confirmKey}
          type="delete"
          itemName={STORE_KEYS.find(k => k.key === confirmKey)?.label || ''}
          onCancel={() => setConfirmKey(null)}
          onConfirm={() => { if (confirmKey) doDelete(confirmKey); }}
        />
        <ConfirmModal
          isOpen={confirmAll}
          type="delete"
          itemName="ALL DATA"
          onCancel={() => setConfirmAll(false)}
          onConfirm={doDeleteAll}
        />
        <ConfirmModal
          isOpen={!!workflowToDelete}
          type="delete"
          itemName={workflowToDelete?.name || ''}
          onCancel={() => setWorkflowToDelete(null)}
          onConfirm={doDeleteWorkflow}
        />
        <ConfirmModal
          isOpen={confirmAllWorkflows}
          type="delete"
          itemName="ALL WORKFLOWS"
          onCancel={() => setConfirmAllWorkflows(false)}
          onConfirm={doDeleteAllWorkflows}
        />
        <ConfirmModal
          isOpen={!!snippetToDelete}
          type="delete"
          itemName={snippetToDelete?.command || ''}
          onCancel={() => setSnippetToDelete(null)}
          onConfirm={doDeleteSnippet}
        />
        <ConfirmModal
          isOpen={confirmAllSnippets}
          type="delete"
          itemName="ALL TERMINAL SNIPPETS"
          onCancel={() => setConfirmAllSnippets(false)}
          onConfirm={doDeleteAllSnippets}
        />
      </div>
    </div>
  ) : null;
}
