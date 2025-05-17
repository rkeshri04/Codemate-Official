import React from 'react';

interface Props {
  open: boolean;
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export function TermsPrivacyModal({ open, type, onClose }: Props) {
  if (!open || !type) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          color: 'var(--text-color)',
          borderRadius: 12,
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          padding: 32,
          maxWidth: 580,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: 'var(--secondary-color)',
            cursor: 'pointer'
          }}
          onClick={onClose}
          aria-label="Close"
        >×</button>

        <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 22 }}>
          {type === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
        </h2>
        <p style={{ fontSize: 13, marginBottom: 16, color: 'gray' }}>Last Updated: April 2025</p>

        <div style={{ fontSize: 15, lineHeight: 1.7 }}>
          {type === 'terms' ? (
            <>
              <p>
                This software application (the "App") was developed and is distributed by Rishabh Keshri ("Developer") solely for personal, non-commercial use. The App is provided free of charge and contains no advertisements or monetization mechanisms.
              </p>

              <p>By accessing or using the App, you agree to the following terms:</p>
              <ul>
                <li>The App allows users to run predefined or custom system commands, launch applications, open URLs, initiate Docker containers, and access development tools.</li>
                <li>Any command or action executed through the App is at the sole discretion and risk of the user. You acknowledge and accept full responsibility for the consequences of executing commands, especially those that may affect your system's security, stability, or data.</li>
                <li>The App includes optional sign-in via third-party authentication providers (Google, Microsoft, GitHub) and supports traditional email/password login. These are implemented solely for user identification and access management.</li>
                <li>The App includes a local clipboard feature that stores up to 20 recent clipboard entries on the user’s device. This data is not transmitted, shared, or synchronized externally.</li>
              </ul>

              <h4 style={{ marginTop: 16 }}>Limitation of Liability</h4>
              <p>
                To the maximum extent permitted under applicable law in your jurisdiction (including but not limited to the United States, European Union, Canada, India, Australia, and other territories), the Developer shall not be held liable for any direct, indirect, incidental, special, consequential, punitive, or exemplary damages arising from or related to the use or inability to use this App.
              </p>
              <p>
                This includes, but is not limited to, system malfunction, data loss, cyberattack, identity theft, financial loss, personal harm, or death. By using the App, you waive all claims, demands, and causes of action against the Developer in connection with the foregoing.
              </p>

              <p>
                You agree to comply with all local laws, regulations, and restrictions when using the App, including those specific to software usage, data protection, and cybersecurity.
              </p>

              <p>
                This App is provided “as is” without warranty of any kind, either express or implied.
              </p>
            </>
          ) : (
            <>
              <p>
                This Privacy Policy describes how the App handles your data. The Developer is committed to protecting your privacy and ensuring that your data remains under your control.
              </p>

              <ul>
                <li>The App does not collect, store, transmit, or sell any personal data to any third parties under any circumstances.</li>
                <li>All clipboard data, command history, and settings remain stored locally on your device and are never shared or uploaded.</li>
                <li>Sign-in services via Google, Microsoft, GitHub, or email/password are used solely for authentication purposes. The App does not access, collect, or use any additional personal data from those services.</li>
                <li>No telemetry, tracking, cookies, analytics, or behavioral profiling tools are embedded within the App.</li>
              </ul>

              <p>
                If you have any questions or concerns regarding this policy, please refrain from using the App and contact the Developer through the official channel or GitHub repository.
              </p>

              <p>
                This App is designed to operate fully offline and securely, prioritizing user freedom, transparency, and digital autonomy.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
