// import React from 'react';
// import { FiX } from 'react-icons/fi';
// import './ToolInfoModal.css';

// const ToolInfoModal: React.FC<{
//   tool: { name: string; description: string; icon: React.ReactNode };
//   onClose: () => void;
// }> = ({ tool, onClose }) => (
//   <div className="action-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
//     <div className="action-modal-content" onClick={e => e.stopPropagation()}>
//       <div className="action-modal-header">
//         <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//           <span style={{ fontSize: 24 }}>{tool.icon}</span>
//           {tool.name}
//         </h3>
//         <button className="close-modal-btn" onClick={onClose}><FiX size={20} /></button>
//       </div>
//       <div className="tool-modal-body">
//         <p>{tool.description}</p>
//       </div>
//       <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
//         <button className="cancel-btn" onClick={onClose}>Close</button>
//       </div>
//     </div>
//   </div>
// );

// export default ToolInfoModal;
