import React, { useState, useEffect } from 'react';
import { OrgSwitcher } from './components/OrgSwitcher';
import { AllocationOverview } from './pages/AllocationOverview';
import { RulesManagement } from './pages/RulesManagement';

/**
 * App shell — pre-configured with:
 *   - Token setup UI (paste your JWT from sample-data/sample-tokens.md)
 *   - OrgSwitcher component (pre-built, calls GET /api/v1/organizations)
 *   - Allocation and governance rules views
 */

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [tokenSaved, setTokenSaved] = useState(!!localStorage.getItem('token'));
  const [currentOrg, setCurrentOrg] = useState(localStorage.getItem('customerOrgId') || '');
  const [activePage, setActivePage] = useState<'allocation' | 'rules'>('allocation');
  const isAdmin = getTokenRoles(token).includes('admin');

  function saveToken() {
    const trimmed = token.trim();
    if (!trimmed) return;
    localStorage.setItem('token', trimmed);
    setTokenSaved(true);
    window.location.reload();
  }

  function clearSession() {
    localStorage.clear();
    setToken('');
    setTokenSaved(false);
    setCurrentOrg('');
  }

  if (!tokenSaved) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Umbrella FinOps Challenge</h1>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Paste a JWT from <code>sample-data/sample-tokens.md</code> to get started.
          </p>
          <textarea
            style={styles.tokenInput}
            placeholder="Paste JWT token here..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
          />
          <button onClick={saveToken} style={styles.button}>
            Set Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Umbrella FinOps</span>
        <OrgSwitcher onOrgChange={(orgId) => setCurrentOrg(orgId)} />
        <button onClick={clearSession} style={styles.buttonSmall}>
          Clear session
        </button>
      </header>

      <nav style={styles.nav}>
        <button
          style={activePage === 'allocation' ? styles.navItemActive : styles.navItem}
          onClick={() => setActivePage('allocation')}
        >
          Allocation
        </button>
        <button
          style={activePage === 'rules' ? styles.navItemActive : styles.navItem}
          onClick={() => setActivePage('rules')}
        >
          Governance Rules
        </button>
      </nav>

      <main style={styles.main}>
        {activePage === 'allocation' ? (
          <AllocationOverview currentOrg={currentOrg} />
        ) : (
          <RulesManagement currentOrg={currentOrg} isAdmin={isAdmin} />
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', padding: 24,
  },
  loginCard: {
    background: '#fff', borderRadius: 8, padding: 32, maxWidth: 480, width: '100%',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  tokenInput: {
    width: '100%', fontFamily: 'monospace', fontSize: 12, padding: 8,
    border: '1px solid #ccc', borderRadius: 4, resize: 'vertical', marginBottom: 12,
  },
  button: {
    background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4,
    padding: '8px 20px', fontSize: 14, cursor: 'pointer',
  },
  buttonSmall: {
    background: 'transparent', color: '#666', border: '1px solid #ccc',
    borderRadius: 4, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
  },
  appContainer: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  header: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px',
    background: '#fff', borderBottom: '1px solid #e5e7eb',
  },
  nav: {
    padding: '8px 24px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb',
    display: 'flex', gap: 16,
  },
  navItem: {
    background: 'transparent',
    border: 'none',
    padding: '4px 0',
    fontSize: 13,
    fontWeight: 700,
    color: '#526071',
    cursor: 'pointer',
  },
  navItemActive: {
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid #2563eb',
    padding: '4px 0',
    fontSize: 13,
    fontWeight: 700,
    color: '#172033',
    cursor: 'pointer',
  },
  main: { flex: 1, padding: 24 },
};

function getTokenRoles(token: string): string[] {
  try {
    const payload = token.split('.')[1];
    if (!payload) return [];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const normalizedPayload = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(normalizedPayload));
    return Array.isArray(decoded.roles) ? decoded.roles : [];
  } catch (err) {
    return [];
  }
}
