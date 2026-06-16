import React, { useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import client from '../api/client';

interface GovernanceTagRule {
  id: number;
  name: string;
  matchType: 'exact' | 'contains';
  fieldName: string;
  pattern: string;
  targetTagKey: string;
  targetTagValue: string;
  priority: number;
  enabled: boolean;
  updatedAt: string;
}

interface RulesResponse {
  items: GovernanceTagRule[];
}

interface RulesManagementProps {
  currentOrg: string;
  isAdmin: boolean;
}

interface RuleFormState {
  name: string;
  matchType: 'exact' | 'contains';
  fieldName: string;
  pattern: string;
  targetTagKey: string;
  targetTagValue: string;
  priority: string;
}

const EMPTY_FORM: RuleFormState = {
  name: '',
  matchType: 'exact',
  fieldName: 'service',
  pattern: '',
  targetTagKey: '',
  targetTagValue: '',
  priority: '100',
};

export function RulesManagement({ currentOrg, isAdmin }: RulesManagementProps) {
  const [rules, setRules] = useState<GovernanceTagRule[]>([]);
  const [form, setForm] = useState<RuleFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrg) return;
    loadRules();
  }, [currentOrg]);

  function loadRules() {
    setLoading(true);
    setError(null);
    client
      .get<RulesResponse>('/governance-tag-rules')
      .then((res) => setRules(res.data.items))
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load rules'))
      .finally(() => setLoading(false));
  }

  function updateForm<K extends keyof RuleFormState>(key: K, value: RuleFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  function startEdit(rule: GovernanceTagRule) {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      matchType: rule.matchType,
      fieldName: toApiFieldAlias(rule.fieldName),
      pattern: rule.pattern,
      targetTagKey: rule.targetTagKey,
      targetTagValue: rule.targetTagValue,
      priority: String(rule.priority),
    });
  }

  async function saveRule(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      matchType: form.matchType,
      fieldName: form.fieldName,
      pattern: form.pattern,
      targetTagKey: form.targetTagKey,
      targetTagValue: form.targetTagValue,
      priority: Number(form.priority),
    };

    try {
      if (editingId) {
        await client.patch(`/governance-tag-rules/${editingId}`, payload);
      } else {
        await client.post('/governance-tag-rules', payload);
      }
      resetForm();
      loadRules();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save rule'));
    } finally {
      setSaving(false);
    }
  }

  async function disableRule(rule: GovernanceTagRule) {
    setSaving(true);
    setError(null);
    try {
      await client.post(`/governance-tag-rules/${rule.id}/disable`);
      loadRules();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to disable rule'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={styles.surface}>
      <div style={styles.titleBar}>
        <div>
          <h1 style={styles.title}>Governance Rules</h1>
          <div style={styles.orgLine}>{currentOrg || 'No customer org selected'}</div>
        </div>
        <span style={isAdmin ? styles.adminBadge : styles.viewerBadge}>
          {isAdmin ? 'Admin' : 'Read only'}
        </span>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {isAdmin && (
        <form onSubmit={saveRule} style={styles.form}>
          <input
            style={styles.inputWide}
            placeholder="Name"
            value={form.name}
            onChange={(event) => updateForm('name', event.target.value)}
            required
          />
          <select
            style={styles.input}
            value={form.matchType}
            onChange={(event) => updateForm('matchType', event.target.value as 'exact' | 'contains')}
          >
            <option value="exact">exact</option>
            <option value="contains">contains</option>
          </select>
          <select
            style={styles.input}
            value={form.fieldName}
            onChange={(event) => updateForm('fieldName', event.target.value)}
          >
            <option value="service">service</option>
            <option value="region">region</option>
            <option value="cloudProvider">cloudProvider</option>
            <option value="accountId">accountId</option>
            <option value="nativeTags">nativeTags</option>
          </select>
          <input
            style={styles.input}
            placeholder="Pattern"
            value={form.pattern}
            onChange={(event) => updateForm('pattern', event.target.value)}
            required
          />
          <input
            style={styles.input}
            placeholder="Tag key"
            value={form.targetTagKey}
            onChange={(event) => updateForm('targetTagKey', event.target.value)}
            required
          />
          <input
            style={styles.input}
            placeholder="Tag value"
            value={form.targetTagValue}
            onChange={(event) => updateForm('targetTagValue', event.target.value)}
            required
          />
          <input
            style={styles.priorityInput}
            type="number"
            placeholder="Priority"
            value={form.priority}
            onChange={(event) => updateForm('priority', event.target.value)}
            required
          />
          <button type="submit" style={styles.primaryButton} disabled={saving}>
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" style={styles.secondaryButton} onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>
      )}

      {loading && <div style={styles.state}>Loading rules...</div>}

      {!loading && rules.length === 0 && <div style={styles.state}>No governance rules found.</div>}

      {!loading && rules.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thLeft}>Rule</th>
                <th style={styles.thLeft}>Match</th>
                <th style={styles.thLeft}>Target Tag</th>
                <th style={styles.thRight}>Priority</th>
                <th style={styles.thLeft}>Status</th>
                {isAdmin && <th style={styles.thRight}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td style={styles.tdLeft}>
                    <div style={styles.ruleName}>{rule.name}</div>
                    <div style={styles.ruleMeta}>#{rule.id}</div>
                  </td>
                  <td style={styles.tdLeft}>
                    <div>{rule.fieldName}</div>
                    <div style={styles.ruleMeta}>
                      {rule.matchType} {rule.pattern}
                    </div>
                  </td>
                  <td style={styles.tdLeft}>
                    {rule.targetTagKey}:{rule.targetTagValue}
                  </td>
                  <td style={styles.tdRight}>{rule.priority}</td>
                  <td style={styles.tdLeft}>{rule.enabled ? 'Enabled' : 'Disabled'}</td>
                  {isAdmin && (
                    <td style={styles.tdRight}>
                      <button style={styles.linkButton} onClick={() => startEdit(rule)}>
                        Edit
                      </button>
                      <button
                        style={styles.linkButton}
                        onClick={() => disableRule(rule)}
                        disabled={!rule.enabled || saving}
                      >
                        Disable
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function toApiFieldAlias(fieldName: string) {
  if (fieldName === 'cloud_provider') return 'cloudProvider';
  if (fieldName === 'account_id') return 'accountId';
  if (fieldName === 'native_tags') return 'nativeTags';
  return fieldName;
}

function getErrorMessage(err: unknown, fallback: string) {
  const apiError = err as AxiosError<{ error?: { message?: string } }>;
  if (typeof apiError.response?.data?.error?.message === 'string') {
    return apiError.response.data.error.message;
  }
  return fallback;
}

const styles: Record<string, React.CSSProperties> = {
  surface: {
    maxWidth: 1100,
    margin: '0 auto',
    background: '#fff',
    border: '1px solid #d9dee7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  titleBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '20px 24px',
    borderBottom: '1px solid #e7ebf0',
  },
  title: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.2,
    fontWeight: 700,
    color: '#172033',
  },
  orgLine: {
    marginTop: 6,
    fontSize: 13,
    color: '#5e6b7c',
    overflowWrap: 'anywhere',
  },
  adminBadge: {
    border: '1px solid #8ab6ff',
    borderRadius: 4,
    padding: '4px 8px',
    color: '#174ea6',
    background: '#eef5ff',
    fontSize: 12,
    fontWeight: 700,
  },
  viewerBadge: {
    border: '1px solid #c4cad4',
    borderRadius: 4,
    padding: '4px 8px',
    color: '#526071',
    background: '#f7f8fa',
    fontSize: 12,
    fontWeight: 700,
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 1.5fr) repeat(5, minmax(120px, 1fr)) 90px auto auto',
    gap: 8,
    padding: 16,
    borderBottom: '1px solid #e7ebf0',
    alignItems: 'center',
    overflowX: 'auto',
  },
  input: {
    minWidth: 120,
    border: '1px solid #b9c1ce',
    borderRadius: 4,
    padding: '7px 9px',
    fontSize: 13,
  },
  inputWide: {
    minWidth: 180,
    border: '1px solid #b9c1ce',
    borderRadius: 4,
    padding: '7px 9px',
    fontSize: 13,
  },
  priorityInput: {
    width: 86,
    border: '1px solid #b9c1ce',
    borderRadius: 4,
    padding: '7px 9px',
    fontSize: 13,
  },
  primaryButton: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
  },
  secondaryButton: {
    background: '#fff',
    color: '#526071',
    border: '1px solid #c4cad4',
    borderRadius: 4,
    padding: '7px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
  thLeft: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#657185',
    borderBottom: '1px solid #e7ebf0',
  },
  thRight: {
    padding: '12px 16px',
    textAlign: 'right',
    fontSize: 12,
    textTransform: 'uppercase',
    color: '#657185',
    borderBottom: '1px solid #e7ebf0',
  },
  tdLeft: {
    padding: '14px 16px',
    borderBottom: '1px solid #edf0f4',
    color: '#1e293b',
    overflowWrap: 'anywhere',
    verticalAlign: 'top',
  },
  tdRight: {
    padding: '14px 16px',
    borderBottom: '1px solid #edf0f4',
    textAlign: 'right',
    color: '#1e293b',
    fontVariantNumeric: 'tabular-nums',
    verticalAlign: 'top',
  },
  ruleName: { fontWeight: 700 },
  ruleMeta: { marginTop: 4, fontSize: 12, color: '#657185' },
  linkButton: {
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    fontSize: 13,
    cursor: 'pointer',
    marginLeft: 8,
    padding: 0,
  },
  state: { padding: 32, color: '#526071' },
  error: {
    margin: 16,
    padding: 14,
    border: '1px solid #f1b8b8',
    borderRadius: 6,
    background: '#fff5f5',
    color: '#9f1d1d',
  },
};
