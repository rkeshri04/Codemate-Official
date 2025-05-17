import React from 'react';
import { FiZap, FiX, FiEye, FiDroplet, FiCode, FiTerminal, FiEdit2, FiTrash2, FiDownload, FiPlus, FiTag, FiPlay, FiGlobe, FiGitBranch, FiKey, FiHash, FiShield, FiLock, FiCopy, FiClock } from 'react-icons/fi';
import { FaDocker, FaKey } from 'react-icons/fa';
import './ToolsCard.css';

// --- Markdown Tool (Markdown only, no text->markdown) ---
const MarkdownTool: React.FC = () => {
  const [input, setInput] = React.useState('');
  const [html, setHtml] = React.useState('');

  React.useEffect(() => {
    // Simple markdown parser (no external deps)
    let out = input
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
      .replace(/\*(.*?)\*/gim, '<i>$1</i>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
      .replace(/^\s*\d+\.\s+(.*)$/gim, '<li>$1</li>')
      .replace(/\n$/gim, '<br/>')
      .replace(/\n/g, '<br/>');
    // Wrap lists in <ul>
    out = out.replace(/(<li>.*?<\/li>)/gims, '<ul>$1</ul>');
    setHtml(out);
  }, [input]);

  return (
    <div>
      <div className="tool-row" style={{ alignItems: 'flex-start' }}>
        <textarea
          className="tool-input"
          rows={16}
          style={{ minHeight: 320, width: '48%' }}
          placeholder="Write or paste Markdown here..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div
          className="tool-markdown-preview"
          style={{
            background: 'var(--input-bg)',
            color: 'var(--input-text)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            padding: 14,
            minWidth: 0,
            minHeight: 320,
            width: '48%',
            marginLeft: 12,
            overflowY: 'auto'
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
};

// --- Color Picker & Converter ---
const ColorPickerTool: React.FC = () => {
  const [color, setColor] = React.useState('#4A90E2');
  function hexToRgb(hex: string) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
  }
  function hexToHsl(hex: string) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    let r = ((num >> 16) & 255) / 255, g = ((num >> 8) & 255) / 255, b = (num & 255) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }
  return (
    <div>
      <div className="tool-row">
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 80, height: 80, border: 'none', background: 'none', cursor: 'pointer' }} />
        <input className="tool-input" value={color} onChange={e => setColor(e.target.value)} style={{ width: 100 }} />
      </div>
      <div style={{ marginTop: 8 }}>
        <div><b>HEX:</b> {color}</div>
        <div><b>RGB:</b> {hexToRgb(color)}</div>
        <div><b>HSL:</b> {hexToHsl(color)}</div>
      </div>
    </div>
  );
};

// --- JSON Formatter & Visualizer ---
const JsonFormatterTool: React.FC = () => {
  const [input, setInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [tree, setTree] = React.useState<any>(null);
  const [expanded, setExpanded] = React.useState<{ [path: string]: boolean }>({});
  const [editPath, setEditPath] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');
  const [output, setOutput] = React.useState('');
  
  // Parse and update tree
  React.useEffect(() => {
    if (!input.trim()) {
      setTree(null);
      setError(null);
      setOutput('');
      return;
    }
    try {
      const obj = JSON.parse(input);
      setTree(obj);
      setError(null);
      setOutput(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setTree(null);
      setError(e.message);
      setOutput('');
    }
  }, [input]);

  // Helper: get value at path
  function getValueAtPath(obj: any, path: string[]): any {
    return path.reduce((acc, key) => acc && acc[key], obj);
  }
  // Helper: set value at path
  function setValueAtPath(obj: any, path: string[], value: any): any {
    if (path.length === 0) return value;
    const [head, ...rest] = path;
    return {
      ...obj,
      [head]: setValueAtPath(obj[head], rest, value)
    };
  }
  // Helper: render tree
  function renderTree(node: any, path: string[] = []) {
    if (typeof node === 'object' && node !== null) {
      const isArray = Array.isArray(node);
      const keys = isArray ? node.map((_: any, i: number) => i) : Object.keys(node);
      return (
        <ul className="json-tree-ul">
          {keys.map((key, idx) => {
            const childPath = [...path, String(key)];
            const pathStr = childPath.join('.');
            const isExpanded = expanded[pathStr] ?? true;
            const value = node[key];
            const isEditing = editPath === pathStr;
            return (
              <li key={pathStr} className="json-tree-li">
                <span
                  className="json-tree-key"
                  onClick={() => {
                    if (typeof value === 'object' && value !== null) {
                      setExpanded(exp => ({ ...exp, [pathStr]: !isExpanded }));
                    }
                  }}
                  style={{
                    cursor: typeof value === 'object' && value !== null ? 'pointer' : 'default',
                    fontWeight: 500,
                  }}
                >
                  {typeof value === 'object' && value !== null ? (
                    <span style={{ marginRight: 4 }}>
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  ) : null}
                  {isArray ? `[${key}]` : key}:
                </span>
                {isEditing ? (
                  <>
                    <input
                      className="tool-input"
                      style={{ marginLeft: 8, minWidth: 80 }}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                    />
                    <button
                      className="tool-btn-primary"
                      style={{ marginLeft: 4 }}
                      onClick={() => {
                        let newVal: any = editValue;
                        // Try to parse as JSON value
                        try {
                          newVal = JSON.parse(editValue);
                        } catch {}
                        const newTree = setValueAtPath(tree, childPath, newVal);
                        setTree(newTree);
                        setOutput(JSON.stringify(newTree, null, 2));
                        setEditPath(null);
                      }}
                    >Save</button>
                    <button
                      className="tool-btn-secondary"
                      style={{ marginLeft: 2 }}
                      onClick={() => setEditPath(null)}
                    >Cancel</button>
                  </>
                ) : typeof value === 'object' && value !== null ? (
                  isExpanded ? (
                    <span style={{ marginLeft: 6 }}>{renderTree(value, childPath)}</span>
                  ) : <span style={{ color: 'var(--secondary-color)', marginLeft: 6 }}>{Array.isArray(value) ? '[...]' : '{...}'}</span>
                ) : (
                  <>
                    <span className="json-tree-value" style={{ marginLeft: 8, color: '#e67e22' }}>
                      {JSON.stringify(value)}
                    </span>
                    <button
                      className="tool-btn-secondary"
                      style={{ marginLeft: 6, fontSize: 12, padding: '2px 8px' }}
                      onClick={() => {
                        setEditPath(pathStr);
                        setEditValue(typeof value === 'string' ? value : JSON.stringify(value));
                      }}
                    >Edit</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      );
    }
    return <span className="json-tree-value">{JSON.stringify(node)}</span>;
  }

  // Minify
  function minify() {
    if (!tree) return;
    setOutput(JSON.stringify(tree));
  }
  // Beautify
  function beautify() {
    if (!tree) return;
    setOutput(JSON.stringify(tree, null, 2));
  }
  // Copy
  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(output);
  }

  return (
    <div>
      <textarea
        className="tool-input"
        rows={8}
        style={{ width: '100%', minHeight: 120, marginBottom: 8 }}
        placeholder="Paste JSON here"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <div style={{ marginBottom: 8 }}>
        <button className="tool-btn-primary" onClick={beautify} disabled={!tree}>Beautify</button>
        <button className="tool-btn-primary" onClick={minify} style={{ marginLeft: 6 }} disabled={!tree}>Minify</button>
        <button className="tool-btn-secondary" onClick={copy} style={{ marginLeft: 6 }} disabled={!output}>Copy</button>
      </div>
      {error && <div style={{ color: 'var(--danger-color)', marginBottom: 8 }}>{error}</div>}
      {tree && (
        <div className="json-tree-container" style={{
          background: 'var(--input-bg)',
          color: 'var(--input-text)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          padding: 12,
          minHeight: 180,
          maxHeight: 340,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: 15,
        }}>
          {renderTree(tree)}
        </div>
      )}
    </div>
  );
};

// --- Terminal Snippet Launcher ---
type TerminalSnippet = {
  id: string;
  command: string;
  tags: string[];
  description?: string;
};

const SNIPPETS_KEY = 'codemate_terminal_snippets';

function loadSnippets(): TerminalSnippet[] {
  try {
    const raw = localStorage.getItem(SNIPPETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveSnippets(snippets: TerminalSnippet[]) {
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

const TerminalSnippetLauncher: React.FC = () => {
  const [snippets, setSnippets] = React.useState<TerminalSnippet[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<{ command: string; tags: string; description: string }>({ command: '', tags: '', description: '' });
  const [search, setSearch] = React.useState('');
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    setSnippets(loadSnippets());
  }, []);

  const saveAll = (newSnippets: TerminalSnippet[]) => {
    setSnippets(newSnippets);
    saveSnippets(newSnippets);
  };

  const handleAddOrEdit = () => {
    const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (!form.command.trim()) return;
    if (editId) {
      const updated = snippets.map(s =>
        s.id === editId ? { ...s, command: form.command, tags: tagsArr, description: form.description } : s
      );
      saveAll(updated);
    } else {
      const newSnippet: TerminalSnippet = {
        id: Date.now().toString(),
        command: form.command,
        tags: tagsArr,
        description: form.description,
      };
      saveAll([newSnippet, ...snippets]);
    }
    setShowForm(false);
    setEditId(null);
    setForm({ command: '', tags: '', description: '' });
  };

  const handleEdit = (snippet: TerminalSnippet) => {
    setEditId(snippet.id);
    setForm({
      command: snippet.command,
      tags: snippet.tags.join(', '),
      description: snippet.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this snippet?')) return;
    saveAll(snippets.filter(s => s.id !== id));
  };

  const handleExport = () => {
    setExporting(true);
    const exportData = {
      codemateExport: true,
      exportedAt: new Date().toISOString(),
      type: 'terminal-snippets',
      snippets,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-snippets.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExporting(false);
    }, 100);
  };

  const handleRun = async (snippet: TerminalSnippet) => {
    // Use the same logic as [id].tsx for running terminal commands in a new window
    window.electron.executeCommand({
      type: 'terminal',
      command: snippet.command,
      commands: [snippet.command],
      useTerminalWindow: true,
    });
  };

  const filteredSnippets = snippets.filter(s =>
    (!search.trim() ||
      s.command.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
      (s.description || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          className="tool-input"
          style={{ flex: 1 }}
          placeholder="Search snippets or tags..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="tool-btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ command: '', tags: '', description: '' }); }}>
          <FiPlus /> Add
        </button>
        <button className="tool-btn-secondary" onClick={handleExport} disabled={exporting || snippets.length === 0}>
          <FiDownload /> Export
        </button>
      </div>
      {showForm && (
        <div className="snippet-form" style={{ marginBottom: 16, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 8, padding: 12 }}>
          <div className="tool-row" style={{ marginBottom: 8 }}>
            <textarea
              className="tool-input"
              rows={2}
              placeholder="Terminal command"
              value={form.command}
              onChange={e => setForm(f => ({ ...f, command: e.target.value }))}
              style={{ flex: 1 }}
            />
          </div>
          <div className="tool-row" style={{ marginBottom: 8 }}>
            <input
              className="tool-input"
              placeholder="Tags (comma separated, e.g. build, git, deploy)"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              style={{ flex: 1 }}
            />
          </div>
          <div className="tool-row" style={{ marginBottom: 8 }}>
            <input
              className="tool-input"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="tool-btn-primary" onClick={handleAddOrEdit}>
              {editId ? <><FiEdit2 /> Update</> : <><FiPlus /> Add</>}
            </button>
            <button className="tool-btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setForm({ command: '', tags: '', description: '' }); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {filteredSnippets.length === 0 ? (
          <div style={{ color: 'var(--secondary-color)', textAlign: 'center', marginTop: 24 }}>No snippets found.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {filteredSnippets.map(snippet => (
              <li key={snippet.id} className="snippet-card" style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                marginBottom: 10,
                padding: 12,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiTerminal style={{ color: 'var(--primary-color)' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{snippet.command}</span>
                  </div>
                  {snippet.description && <div style={{ color: 'var(--secondary-color)', fontSize: 13, marginTop: 2 }}>{snippet.description}</div>}
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {snippet.tags.map(tag => (
                      <span key={tag} className="snippet-tag" style={{
                        background: 'var(--secondary-color)',
                        color: '#fff',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2,
                      }}>
                        <FiTag size={12} /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="tool-btn-primary" style={{ padding: '4px 10px' }} onClick={() => handleRun(snippet)} title="Run in terminal">
                    <FiPlay />
                  </button>
                  <button className="tool-btn-secondary" style={{ padding: '4px 10px' }} onClick={() => handleEdit(snippet)} title="Edit">
                    <FiEdit2 />
                  </button>
                  <button className="tool-btn-secondary" style={{ padding: '4px 10px' }} onClick={() => handleDelete(snippet.id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// --- Live HTML Preview Tool ---
const LiveHtmlPreviewTool: React.FC = () => {
  const [html, setHtml] = React.useState('');
  const [css, setCss] = React.useState('');
  const [js, setJs] = React.useState('');
  const [fullMode, setFullMode] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Helper: inject <script src="script.js"> if present in HTML and user provided JS
  function injectScriptSrc(htmlDoc: string, jsCode: string): string {
    if (
      /<script\s+src=["']script\.js["']\s*><\/script>/i.test(htmlDoc) &&
      jsCode.trim()
    ) {
      let doc = htmlDoc.replace(/<script\s+src=["']script\.js["']\s*><\/script>/gi, '');
      if (/<\/body>/i.test(doc)) {
        doc = doc.replace(/<\/body>/i, `<script>${jsCode}<\/script></body>`);
      } else {
        doc += `<script>${jsCode}<\/script>`;
      }
      return doc;
    }
    return htmlDoc;
  }

  React.useEffect(() => {
    let doc = '';
    if (
      html.trim().startsWith('<!DOCTYPE html>') ||
      html.trim().startsWith('<html')
    ) {
      // Full HTML mode
      doc = injectScriptSrc(html, js);
      if (iframeRef.current) {
        // Use a stricter sandbox: allow-scripts only (no allow-same-origin)
        iframeRef.current.setAttribute('sandbox', 'allow-scripts');
        iframeRef.current.srcdoc = doc;
      }
      return;
    }

    // Split mode: build doc and inject JS via postMessage
    doc = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>
            window.addEventListener('message', function(event) {
              try {
                if (event.source !== window.parent) return;
                // eslint-disable-next-line no-eval
                eval(event.data);
              } catch (e) {
                document.body.insertAdjacentHTML('beforeend', '<pre style="color:red;">' + e + '</pre>');
              }
            }, false);
          <\/script>
        </body>
      </html>
    `;
    if (iframeRef.current) {
      iframeRef.current.setAttribute('sandbox', 'allow-scripts');
      iframeRef.current.srcdoc = doc;
      setTimeout(() => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(js, '*');
        }
      }, 50);
    }
  }, [html, css, js]);

  React.useEffect(() => {
    if (
      !(
        html.trim().startsWith('<!DOCTYPE html>') ||
        html.trim().startsWith('<html')
      )
    ) {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(js, '*');
      }
    }
  }, [js]);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            className={`tab-btn${!fullMode ? ' active' : ''}`}
            style={{
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              border: '1px solid var(--border-color)',
              borderRight: 'none',
              background: !fullMode ? 'var(--input-bg)' : 'var(--card-bg)',
              color: !fullMode ? 'var(--primary-color)' : 'var(--text-color)',
              padding: '6px 18px',
              fontWeight: !fullMode ? 600 : 400,
              cursor: !fullMode ? 'default' : 'pointer',
            }}
            onClick={() => setFullMode(false)}
            disabled={!fullMode}
          >
            Split HTML/CSS/JS
          </button>
          <button
            className={`tab-btn${fullMode ? ' active' : ''}`}
            style={{
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              border: '1px solid var(--border-color)',
              background: fullMode ? 'var(--input-bg)' : 'var(--card-bg)',
              color: fullMode ? 'var(--primary-color)' : 'var(--text-color)',
              padding: '6px 18px',
              fontWeight: fullMode ? 600 : 400,
              cursor: fullMode ? 'default' : 'pointer',
            }}
            onClick={() => setFullMode(true)}
            disabled={fullMode}
          >
            Full HTML Document
          </button>
        </div>
      </div>
      <div className="tool-row" style={{ gap: 8, marginBottom: 8 }}>
        {fullMode ? (
          <textarea
            className="tool-input"
            rows={12}
            style={{ width: '100%' }}
            placeholder="Paste full HTML document here (with &lt;html&gt; and &lt;script&gt; tags). If you use &lt;script src=&quot;script.js&quot;&gt;, the JS area will be injected as that file."
            value={html}
            onChange={e => setHtml(e.target.value)}
          />
        ) : (
          <>
            <textarea
              className="tool-input"
              rows={4}
              style={{ width: '32%' }}
              placeholder="HTML"
              value={html}
              onChange={e => setHtml(e.target.value)}
            />
            <textarea
              className="tool-input"
              rows={4}
              style={{ width: '32%' }}
              placeholder="CSS"
              value={css}
              onChange={e => setCss(e.target.value)}
            />
            <textarea
              className="tool-input"
              rows={4}
              style={{ width: '32%' }}
              placeholder="JS"
              value={js}
              onChange={e => setJs(e.target.value)}
            />
          </>
        )}
      </div>
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 6, minHeight: 220, marginTop: 8, background: 'var(--input-bg)' }}>
        <iframe
          ref={iframeRef}
          title="Live Preview"
          style={{ width: '100%', minHeight: 220, border: 'none', background: 'white' }}
          // sandbox is set dynamically in effect for security
        />
      </div>
    </div>
  );
};

// --- Code/Text Diff Viewer Tool ---
const DiffViewerTool: React.FC = () => {
  const [left, setLeft] = React.useState('');
  const [right, setRight] = React.useState('');
  const [mode, setMode] = React.useState<'simple' | 'advanced'>('simple');

  // Simple char-by-char diff for each line (for "simple" mode)
  function simpleDiffLines(a: string[], b: string[]) {
    const maxLen = Math.max(a.length, b.length);
    const result: { left: React.ReactNode; right: React.ReactNode }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const leftLine = a[i] ?? '';
      const rightLine = b[i] ?? '';
      if (leftLine === rightLine) {
        result.push({ left: leftLine, right: rightLine });
      } else {
        // Highlight char differences
        result.push({
          left: highlightDiff(leftLine, rightLine, 'left'),
          right: highlightDiff(rightLine, leftLine, 'right'),
        });
      }
    }
    return result;
  }

  // Helper: highlight differences in a line
  function highlightDiff(line: string, other: string, side: 'left' | 'right') {
    const minLen = Math.min(line.length, other.length);
    const nodes: React.ReactNode[] = [];
    let i = 0;
    for (; i < minLen; i++) {
      if (line[i] === other[i]) {
        nodes.push(line[i]);
      } else {
        nodes.push(
          <span
            key={i}
            style={{
              background: side === 'left' ? 'rgba(220,53,69,0.13)' : 'rgba(40,167,69,0.13)',
              color: side === 'left' ? 'var(--danger-color)' : 'var(--accent-color)',
              borderRadius: 2,
              padding: '0 1px',
            }}
          >
            {line[i]}
          </span>
        );
      }
    }
    // Remaining chars (if any)
    if (i < line.length) {
      nodes.push(
        <span
          key="rem"
          style={{
            background: side === 'left' ? 'rgba(220,53,69,0.13)' : 'rgba(40,167,69,0.13)',
            color: side === 'left' ? 'var(--danger-color)' : 'var(--accent-color)',
            borderRadius: 2,
            padding: '0 1px',
          }}
        >
          {line.slice(i)}
        </span>
      );
    }
    return <>{nodes}</>;
  }

  // Advanced line-by-line diff (LCS, as before)
  function computeDiff(a: string[], b: string[]) {
    const n = a.length, m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
        else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    let i = 0, j = 0;
    const result: { left?: string; right?: string; type: 'equal' | 'add' | 'remove' }[] = [];
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        result.push({ left: a[i], right: b[j], type: 'equal' });
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        result.push({ left: a[i], right: '', type: 'remove' });
        i++;
      } else {
        result.push({ left: '', right: b[j], type: 'add' });
        j++;
      }
    }
    while (i < n) {
      result.push({ left: a[i], right: '', type: 'remove' });
      i++;
    }
    while (j < m) {
      result.push({ left: '', right: b[j], type: 'add' });
      j++;
    }
    return result;
  }

  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  const simpleDiff = simpleDiffLines(leftLines, rightLines);
  const advancedDiff = computeDiff(leftLines, rightLines);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            className={`tab-btn${mode === 'simple' ? ' active' : ''}`}
            style={{
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
              border: '1px solid var(--border-color)',
              borderRight: 'none',
              background: mode === 'simple' ? 'var(--input-bg)' : 'var(--card-bg)',
              color: mode === 'simple' ? 'var(--primary-color)' : 'var(--text-color)',
              padding: '6px 18px',
              fontWeight: mode === 'simple' ? 600 : 400,
              cursor: mode === 'simple' ? 'default' : 'pointer',
            }}
            onClick={() => setMode('simple')}
            disabled={mode === 'simple'}
          >
            Simple
          </button>
          <button
            className={`tab-btn${mode === 'advanced' ? ' active' : ''}`}
            style={{
              borderTopRightRadius: 6,
              borderBottomRightRadius: 6,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              border: '1px solid var(--border-color)',
              background: mode === 'advanced' ? 'var(--input-bg)' : 'var(--card-bg)',
              color: mode === 'advanced' ? 'var(--primary-color)' : 'var(--text-color)',
              padding: '6px 18px',
              fontWeight: mode === 'advanced' ? 600 : 400,
              cursor: mode === 'advanced' ? 'default' : 'pointer',
            }}
            onClick={() => setMode('advanced')}
            disabled={mode === 'advanced'}
          >
            Advanced
          </button>
        </div>
      </div>
      <div className="tool-row" style={{ gap: 8, marginBottom: 8 }}>
        <textarea
          className="tool-input"
          rows={12}
          style={{ width: '48%' }}
          placeholder="Left code/text"
          value={left}
          onChange={e => setLeft(e.target.value)}
        />
        <textarea
          className="tool-input"
          rows={12}
          style={{ width: '48%' }}
          placeholder="Right code/text"
          value={right}
          onChange={e => setRight(e.target.value)}
        />
      </div>
      <div className="diff-viewer-table" style={{
        display: 'flex',
        flexDirection: 'row',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        overflow: 'hidden',
        fontFamily: 'monospace',
        fontSize: 15,
        minHeight: 180,
        marginTop: 8,
        background: 'var(--input-bg)'
      }}>
        {mode === 'simple' ? (
          <>
            <div style={{ flex: 1, borderRight: '1px solid var(--border-color)' }}>
              {simpleDiff.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '2px 6px',
                    whiteSpace: 'pre-wrap',
                    minHeight: 18,
                  }}
                >
                  {line.left}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              {simpleDiff.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '2px 6px',
                    whiteSpace: 'pre-wrap',
                    minHeight: 18,
                  }}
                >
                  {line.right}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, borderRight: '1px solid var(--border-color)' }}>
              {advancedDiff.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    background:
                      line.type === 'remove'
                        ? 'rgba(220,53,69,0.13)'
                        : undefined,
                    color: line.type === 'remove' ? 'var(--danger-color)' : undefined,
                    padding: '2px 6px',
                    whiteSpace: 'pre-wrap',
                    minHeight: 18,
                    opacity: line.type === 'add' ? 0.5 : 1,
                  }}
                >
                  {line.left}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              {advancedDiff.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    background:
                      line.type === 'add'
                        ? 'rgba(40,167,69,0.13)'
                        : undefined,
                    color: line.type === 'add' ? 'var(--accent-color)' : undefined,
                    padding: '2px 6px',
                    whiteSpace: 'pre-wrap',
                    minHeight: 18,
                    opacity: line.type === 'remove' ? 0.5 : 1,
                  }}
                >
                  {line.right}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 13 }}>
        {mode === 'simple' ? (
          <span style={{ color: '#ffc107' }}>Differences highlighted in-line</span>
        ) : (
          <>
            <span style={{ color: 'var(--danger-color)' }}>Removed</span>
            <span style={{ color: 'var(--accent-color)' }}>Added</span>
          </>
        )}
      </div>
    </div>
  );
};

// --- Generators Tool ---
const GENERATOR_TABS = [
  { key: 'uuid', label: 'UUID', icon: <FiHash /> },
  { key: 'nanoid', label: 'NanoID', icon: <FiKey /> },
  { key: 'sha', label: 'SHA', icon: <FiShield /> },
  { key: 'hmac', label: 'HMAC', icon: <FiLock /> },
  { key: 'jwt', label: 'JWT', icon: <FiKey /> },
  { key: 'base64', label: 'Base64', icon: <FiCopy /> },
  { key: 'random', label: 'Random', icon: <FiHash /> },
  { key: 'uuidts', label: 'UUID+TS', icon: <FiClock /> },
];

const GeneratorsTool: React.FC = () => {
  const [tab, setTab] = React.useState('uuid');
  // UUID
  const [uuid, setUuid] = React.useState('');
  // NanoID
  const [nanoid, setNanoid] = React.useState('');
  // SHA
  const [shaInput, setShaInput] = React.useState('');
  const [sha256, setSha256] = React.useState('');
  const [sha512, setSha512] = React.useState('');
  // HMAC
  const [hmacInput, setHmacInput] = React.useState('');
  const [hmacKey, setHmacKey] = React.useState('');
  const [hmacSha256, setHmacSha256] = React.useState('');
  // JWT
  const [jwtPayload, setJwtPayload] = React.useState('{}');
  const [jwtSecret, setJwtSecret] = React.useState('');
  const [jwtToken, setJwtToken] = React.useState('');
  // Base64
  const [base64Input, setBase64Input] = React.useState('');
  const [base64Encoded, setBase64Encoded] = React.useState('');
  const [base64Decoded, setBase64Decoded] = React.useState('');
  // Random
  const [randomLen, setRandomLen] = React.useState(32);
  const [randomHex, setRandomHex] = React.useState('');
  // UUID+TS
  const [uuidTs, setUuidTs] = React.useState('');
  // --- Handlers ---
  function genUuid() {
    const v = crypto.randomUUID();
    setUuid(v);
  }
  function genNanoid() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 21; i++) id += chars[Math.floor(Math.random() * chars.length)];
    setNanoid(id);
  }
  function genSha() {
    window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(shaInput)).then(buf => {
      setSha256(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
    });
    window.crypto.subtle.digest('SHA-512', new TextEncoder().encode(shaInput)).then(buf => {
      setSha512(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
    });
  }
  function genHmac() {
    window.crypto.subtle.importKey('raw', new TextEncoder().encode(hmacKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(key => window.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(hmacInput)))
      .then(buf => setHmacSha256(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')));
  }
  function genJwt() {
    try {
      const header = { alg: 'HS256', typ: 'JWT' };
      const payloadObj = JSON.parse(jwtPayload);
      const base64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const headerB64 = base64(header);
      const payloadB64 = base64(payloadObj);
      if (window.crypto?.subtle) {
        window.crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(jwtSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        ).then(key =>
          window.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(headerB64 + '.' + payloadB64))
        ).then(buf => {
          const arr = Array.from(new Uint8Array(buf));
          const b64 = btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          setJwtToken(headerB64 + '.' + payloadB64 + '.' + b64);
        });
      } else {
        setJwtToken(headerB64 + '.' + payloadB64 + '.(no-sign)');
      }
    } catch {
      setJwtToken('');
    }
  }
  function genBase64() {
    setBase64Encoded(btoa(base64Input));
    try {
      setBase64Decoded(atob(base64Input));
    } catch {
      setBase64Decoded('');
    }
  }
  function genRandom() {
    const arr = new Uint8Array(randomLen);
    window.crypto.getRandomValues(arr);
    setRandomHex(Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(''));
  }
  function genUuidTs() {
    setUuidTs(`${crypto.randomUUID()}_${Date.now()}`);
  }
  // --- UI ---
  return (
    <div>
      <div
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          marginBottom: 12,
          paddingBottom: 2,
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100%',
        }}
        className="generator-tabs-scroll"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            minWidth: 'max-content',
            width: 'fit-content',
            maxWidth: '100%',
          }}
        >
          {GENERATOR_TABS.map((t, idx) => (
            <button
              key={t.key}
              className={`tab-btn${tab === t.key ? ' active' : ''}`}
              style={{
                borderRadius: 0,
                border: '1px solid var(--border-color)',
                borderRight: idx === GENERATOR_TABS.length - 1 ? '1px solid var(--border-color)' : 'none',
                background: tab === t.key ? 'var(--input-bg)' : 'var(--card-bg)',
                color: tab === t.key ? 'var(--primary-color)' : 'var(--text-color)',
                fontWeight: tab === t.key ? 600 : 400,
                padding: '6px 14px',
                minWidth: 90,
                transition: 'background 0.15s',
                outline: 'none',
                whiteSpace: 'nowrap',
                maxWidth: 180,
              }}
              onClick={() => setTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 700, width: '100%', margin: '0 auto' }}>
        {tab === 'uuid' && (
          <div>
            <button className="tool-btn-primary" onClick={genUuid}>Generate UUID</button>
            {uuid && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ flex: 1 }}>{uuid}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(uuid)}>Copy</button>
              </div>
            )}
          </div>
        )}
        {tab === 'nanoid' && (
          <div>
            <button className="tool-btn-primary" onClick={genNanoid}>Generate NanoID</button>
            {nanoid && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <code style={{ flex: 1 }}>{nanoid}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(nanoid)}>Copy</button>
              </div>
            )}
          </div>
        )}
        {tab === 'sha' && (
          <div>
            <input className="tool-input" style={{ width: '100%' }} placeholder="Input" value={shaInput} onChange={e => setShaInput(e.target.value)} />
            <button className="tool-btn-primary" onClick={genSha} style={{ marginTop: 6 }}>Hash</button>
            {sha256 && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>SHA-256:</b>
                <code style={{ flex: 1 }}>{sha256}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(sha256)}>Copy</button>
              </div>
            )}
            {sha512 && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>SHA-512:</b>
                <code style={{ flex: 1 }}>{sha512}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(sha512)}>Copy</button>
              </div>
            )}
          </div>
        )}
        {tab === 'hmac' && (
          <div>
            <input className="tool-input" style={{ width: '100%' }} placeholder="Input" value={hmacInput} onChange={e => setHmacInput(e.target.value)} />
            <input className="tool-input" style={{ width: '100%', marginTop: 4 }} placeholder="Key" value={hmacKey} onChange={e => setHmacKey(e.target.value)} />
            <button className="tool-btn-primary" onClick={genHmac} style={{ marginTop: 6 }}>Generate HMAC</button>
            {hmacSha256 && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>HMAC-SHA256:</b>
                <code style={{ flex: 1 }}>{hmacSha256}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(hmacSha256)}>Copy</button>
              </div>
            )}
          </div>
        )}
        {tab === 'jwt' && (
          <div>
            <textarea className="tool-input" rows={3} style={{ width: '100%' }} placeholder="Payload (JSON)" value={jwtPayload} onChange={e => setJwtPayload(e.target.value)} />
            <input className="tool-input" style={{ width: '100%', marginTop: 4 }} placeholder="Secret" value={jwtSecret} onChange={e => setJwtSecret(e.target.value)} />
            <button className="tool-btn-primary" onClick={genJwt} style={{ marginTop: 6 }}>Generate JWT</button>
            {jwtToken && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>JWT:</b>
                <code style={{ flex: 1 }}>{jwtToken}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(jwtToken)}>Copy</button>
              </div>
            )}
          </div>
        )}
        {tab === 'base64' && (
          <div>
            <input className="tool-input" style={{ width: '100%' }} placeholder="Input" value={base64Input} onChange={e => setBase64Input(e.target.value)} />
            <button className="tool-btn-primary" onClick={genBase64} style={{ marginTop: 6 }}>Encode/Decode</button>
            {base64Encoded && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>Base64:</b>
                <code style={{ flex: 1 }}>{base64Encoded}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(base64Encoded)}>Copy</button>
              </div>
            )}
            {base64Decoded && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>Decoded:</b>
                <code style={{ flex: 1 }}>{base64Decoded}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(base64Decoded)}>Copy</button>
              </div>
            )}
          </div>
        )}
        {tab === 'random' && (
          <div>
            <input className="tool-input" type="number" min={1} max={128} style={{ width: 80 }} value={randomLen} onChange={e => setRandomLen(Number(e.target.value))} />
            <button className="tool-btn-primary" onClick={genRandom} style={{ marginLeft: 8 }}>Generate Random Hex</button>
            {randomHex && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>Random:</b>
                <code style={{ flex: 1 }}>{randomHex}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(randomHex)}>Copy</button>
              </div>
            )}
          </div>
        )}
        {tab === 'uuidts' && (
          <div>
            <button className="tool-btn-primary" onClick={genUuidTs}>Generate UUID+Timestamp</button>
            {uuidTs && (
              <div style={{ marginTop: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: 8 }}>
                <b>Token:</b>
                <code style={{ flex: 1 }}>{uuidTs}</code>
                <button className="tool-btn-secondary" onClick={() => navigator.clipboard.writeText(uuidTs)}>Copy</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Dockerfile Generator Tool ---
const DOCKER_LANGS = [
  { label: 'Node.js', value: 'node', base: 'node:18-alpine', defaultCmd: 'npm start', defaultExpose: 3000 },
  { label: 'Python', value: 'python', base: 'python:3.11-slim', defaultCmd: 'python app.py', defaultExpose: 8000 },
  { label: 'Go', value: 'go', base: 'golang:1.21-alpine', defaultCmd: './app', defaultExpose: 8080 },
  { label: 'Java', value: 'java', base: 'openjdk:17-jdk-slim', defaultCmd: 'java -jar app.jar', defaultExpose: 8080 },
  { label: 'Rust', value: 'rust', base: 'rust:1.70-slim', defaultCmd: './app', defaultExpose: 8080 },
  { label: 'PHP', value: 'php', base: 'php:8.2-apache', defaultCmd: '', defaultExpose: 80 },
  { label: 'Ruby', value: 'ruby', base: 'ruby:3.2-alpine', defaultCmd: 'ruby app.rb', defaultExpose: 4567 },
  { label: 'Custom', value: 'custom', base: '', defaultCmd: '', defaultExpose: 80 },
];

const DockerfileGeneratorTool: React.FC = () => {
  const [lang, setLang] = React.useState(DOCKER_LANGS[0].value);
  const [baseImage, setBaseImage] = React.useState(DOCKER_LANGS[0].base);
  const [workdir, setWorkdir] = React.useState('/app');
  const [copyAll, setCopyAll] = React.useState(true);
  const [runCmds, setRunCmds] = React.useState<string[]>([]);
  const [envVars, setEnvVars] = React.useState<{ key: string; value: string }[]>([]);
  const [expose, setExpose] = React.useState(DOCKER_LANGS[0].defaultExpose);
  const [cmd, setCmd] = React.useState(DOCKER_LANGS[0].defaultCmd);
  const [entrypoint, setEntrypoint] = React.useState('');
  const [newEnv, setNewEnv] = React.useState({ key: '', value: '' });
  const [newRun, setNewRun] = React.useState('');
  const [copyFiles, setCopyFiles] = React.useState([{ src: '.', dest: '.' }]);

  React.useEffect(() => {
    const selected = DOCKER_LANGS.find(l => l.value === lang);
    if (selected) {
      setBaseImage(selected.base);
      setCmd(selected.defaultCmd);
      setExpose(selected.defaultExpose);
    }
  }, [lang]);

  const dockerfile = React.useMemo(() => {
    let lines: string[] = [];
    if (baseImage) lines.push(`FROM ${baseImage}`);
    if (workdir) lines.push(`WORKDIR ${workdir}`);
    if (copyAll) {
      lines.push(`COPY . .`);
    } else {
      copyFiles.forEach(f => {
        if (f.src && f.dest) lines.push(`COPY ${f.src} ${f.dest}`);
      });
    }
    envVars.forEach(({ key, value }) => {
      if (key) lines.push(`ENV ${key}=${value}`);
    });
    runCmds.forEach(cmd => {
      if (cmd.trim()) lines.push(`RUN ${cmd}`);
    });
    if (expose) lines.push(`EXPOSE ${expose}`);
    if (entrypoint) lines.push(`ENTRYPOINT [${JSON.stringify(entrypoint)}]`);
    if (cmd) lines.push(`CMD [${cmd.split(' ').map(s => JSON.stringify(s)).join(', ')}]`);
    return lines.join('\n');
  }, [baseImage, workdir, copyAll, copyFiles, envVars, runCmds, expose, cmd, entrypoint]);

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerfile);
  };

  const handleExport = () => {
    const blob = new Blob([dockerfile], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dockerfile';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const addEnvVar = () => {
    if (newEnv.key) {
      setEnvVars([...envVars, { ...newEnv }]);
      setNewEnv({ key: '', value: '' });
    }
  };

  const addRunCmd = () => {
    if (newRun.trim()) {
      setRunCmds([...runCmds, newRun.trim()]);
      setNewRun('');
    }
  };

  const addCopyFile = () => {
    setCopyFiles([...copyFiles, { src: '', dest: '' }]);
  };

  const removeEnvVar = (idx: number) => {
    setEnvVars(envVars.filter((_, i) => i !== idx));
  };

  const removeRunCmd = (idx: number) => {
    setRunCmds(runCmds.filter((_, i) => i !== idx));
  };

  const removeCopyFile = (idx: number) => {
    setCopyFiles(copyFiles.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div className="tool-row" style={{ gap: 12, alignItems: 'center' }}>
          <label>Language:</label>
          <div style={{ position: 'relative', minWidth: 120 }}>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{
                minWidth: 120,
                padding: '7px 32px 7px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: 6,
                background: 'var(--input-bg)',
                color: 'var(--input-text)',
                fontSize: 15,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                outline: 'none',
                cursor: 'pointer',
              }}
              className="styled-select"
            >
              {DOCKER_LANGS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <span style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--primary-color)',
              fontSize: 18,
            }}>▼</span>
          </div>
          <label>Base Image:</label>
          <input
            className="tool-input"
            style={{ minWidth: 180 }}
            value={baseImage}
            onChange={e => setBaseImage(e.target.value)}
          />
        </div>
        <div className="tool-row" style={{ gap: 12, marginTop: 8 }}>
          <label>Workdir:</label>
          <input
            className="tool-input"
            style={{ minWidth: 120 }}
            value={workdir}
            onChange={e => setWorkdir(e.target.value)}
          />
          <label>Expose Port:</label>
          <input
            className="tool-input"
            type="number"
            style={{ width: 80 }}
            value={expose}
            onChange={e => setExpose(Number(e.target.value))}
          />
        </div>
        <div className="tool-row" style={{ gap: 12, marginTop: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={copyAll}
              onChange={e => setCopyAll(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            COPY all files
          </label>
          {!copyAll && (
            <button className="tool-btn-secondary" onClick={addCopyFile}>Add COPY</button>
          )}
        </div>
        {!copyAll && (
          <div style={{ marginTop: 4 }}>
            {copyFiles.map((f, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                <input
                  className="tool-input"
                  style={{ width: 100 }}
                  placeholder="src"
                  value={f.src}
                  onChange={e => setCopyFiles(copyFiles.map((c, i) => i === idx ? { ...c, src: e.target.value } : c))}
                />
                <span>→</span>
                <input
                  className="tool-input"
                  style={{ width: 100 }}
                  placeholder="dest"
                  value={f.dest}
                  onChange={e => setCopyFiles(copyFiles.map((c, i) => i === idx ? { ...c, dest: e.target.value } : c))}
                />
                <button className="tool-btn-secondary" onClick={() => removeCopyFile(idx)} style={{ fontSize: 12 }}>Remove</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <label>Environment Variables:</label>
          <div>
            {envVars.map((env, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                <input
                  className="tool-input"
                  style={{ width: 100 }}
                  placeholder="KEY"
                  value={env.key}
                  onChange={e => setEnvVars(envVars.map((v, i) => i === idx ? { ...v, key: e.target.value } : v))}
                />
                <span>=</span>
                <input
                  className="tool-input"
                  style={{ width: 120 }}
                  placeholder="value"
                  value={env.value}
                  onChange={e => setEnvVars(envVars.map((v, i) => i === idx ? { ...v, value: e.target.value } : v))}
                />
                <button className="tool-btn-secondary" onClick={() => removeEnvVar(idx)} style={{ fontSize: 12 }}>Remove</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
              <input
                className="tool-input"
                style={{ width: 100 }}
                placeholder="KEY"
                value={newEnv.key}
                onChange={e => setNewEnv({ ...newEnv, key: e.target.value })}
              />
              <span>=</span>
              <input
                className="tool-input"
                style={{ width: 120 }}
                placeholder="value"
                value={newEnv.value}
                onChange={e => setNewEnv({ ...newEnv, value: e.target.value })}
              />
              <button className="tool-btn-secondary" onClick={addEnvVar} style={{ fontSize: 12 }}>Add</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>RUN Commands:</label>
          <div>
            {runCmds.map((cmd, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                <input
                  className="tool-input"
                  style={{ width: 220 }}
                  value={cmd}
                  onChange={e => setRunCmds(runCmds.map((c, i) => i === idx ? e.target.value : c))}
                />
                <button className="tool-btn-secondary" onClick={() => removeRunCmd(idx)} style={{ fontSize: 12 }}>Remove</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
              <input
                className="tool-input"
                style={{ width: 220 }}
                placeholder="RUN command"
                value={newRun}
                onChange={e => setNewRun(e.target.value)}
              />
              <button className="tool-btn-secondary" onClick={addRunCmd} style={{ fontSize: 12 }}>Add</button>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
          <div>
            <label>CMD:</label>
            <input
              className="tool-input"
              style={{ width: 220 }}
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              placeholder="e.g. npm start"
            />
          </div>
          <div>
            <label>Entrypoint:</label>
            <input
              className="tool-input"
              style={{ width: 180 }}
              value={entrypoint}
              onChange={e => setEntrypoint(e.target.value)}
              placeholder="(optional)"
            />
          </div>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <label style={{ fontWeight: 600 }}>Dockerfile Preview:</label>
        <pre
          style={{
            background: 'var(--input-bg)',
            color: 'var(--input-text)',
            border: '1px solid var(--border-color)',
            borderRadius: 6,
            padding: 12,
            minHeight: 180,
            fontFamily: 'monospace',
            fontSize: 15,
            marginTop: 4,
            overflowX: 'auto'
          }}
        >{dockerfile}</pre>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
        <button className="tool-btn-secondary" onClick={handleCopy}>Copy</button>
        <button className="tool-btn-primary" onClick={handleExport}>Export</button>
      </div>
      <div style={{ marginTop: 16, color: 'var(--danger-color)', fontSize: 13 }}>
        <b>Disclaimer:</b> Please verify your Docker image for vulnerabilities using Docker Desktop or <a href="https://docs.docker.com/engine/scan/" target="_blank" rel="noopener noreferrer">docker scan</a> before using in production.
      </div>
    </div>
  );
};

// --- Custom Tools Registry ---
const CUSTOM_TOOLS = [
  { name: 'Terminal Snippet Launcher', icon: <FiTerminal />, component: TerminalSnippetLauncher },
  { name: 'Code/Text Diff Viewer', icon: <FiGitBranch />, component: DiffViewerTool },
  { name: 'Live HTML Preview', icon: <FiGlobe />, component: LiveHtmlPreviewTool },
  { name: 'Dockerfile Generator', icon: <FaDocker />, component: DockerfileGeneratorTool },
  { name: 'Generators', icon: <FiHash />, component: GeneratorsTool },
  { name: 'Markdown', icon: <FiEye />, component: MarkdownTool },
  { name: 'Color Picker & Converter', icon: <FiDroplet />, component: ColorPickerTool },
  { name: 'JSON Formatter & Visualizer', icon: <FiCode />, component: JsonFormatterTool },
];

// --- ToolInfoModal: renders the tool's component ---
const ToolInfoModal: React.FC<{
  tool: { name: string; icon: React.ReactNode; component: React.FC };
  onClose: () => void;
}> = ({ tool, onClose }) => (
  <div className="action-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div
      className="action-modal-content"
      style={
        tool.name === 'Markdown'
          ? { minWidth: 700, maxWidth: 900 }
          : tool.name === 'JSON Formatter & Visualizer'
          ? { minWidth: 600, maxWidth: 800 }
          : tool.name === 'Live HTML Preview'
          ? { minWidth: 900, maxWidth: 1200 }
          : tool.name === 'Code/Text Diff Viewer'
          ? { minWidth: 900, maxWidth: 1200 }
          : {}
      }
      onClick={e => e.stopPropagation()}
    >
      <div className="action-modal-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>{tool.icon}</span>
          {tool.name}
        </h3>
        <button className="close-modal-btn" onClick={onClose}><FiX size={20} /></button>
           </div>
      <div className="tool-modal-body">
        <tool.component />
      </div>
      <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="cancel-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const ToolsCard: React.FC = () => {
  const [selectedTool, setSelectedTool] = React.useState<typeof CUSTOM_TOOLS[0] | null>(null);

  return (
    <div className="widget tools-widget">
      <h2>
        <FiZap className="widget-icon" /> Tools
      </h2>
      <div
        className="widget-content"
        style={{
          maxHeight: 340,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        <div className="tools-grid">
          {CUSTOM_TOOLS.map(tool => (
            <button
              key={tool.name}
              className="tool-btn"
              onClick={() => setSelectedTool(tool)}
              title={tool.name}
            >
              <span style={{ fontSize: 28, marginBottom: 8 }}>{tool.icon}</span>
              <span style={{ fontSize: 14, color: 'var(--text-color)' }}>{tool.name}</span>
            </button>
          ))}
        </div>
      </div>
      {selectedTool && (
        <ToolInfoModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  );
};

export default ToolsCard;

/* Add this at the end of the file or in your CSS file (ToolsCard.css):

.generator-tabs-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--primary-color) var(--card-bg);
}
.generator-tabs-scroll::-webkit-scrollbar {
  height: 8px;
  background: var(--card-bg);
  border-radius: 6px;
}
.generator-tabs-scroll::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 6px;
}
.generator-tabs-scroll::-webkit-scrollbar-track {
  background: var(--card-bg);
  border-radius: 6px;
}
*/
