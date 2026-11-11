import { useEffect, useMemo, useState } from 'react';
import { apiRequest, getToken } from './api.js';
import { modules } from './modules.js';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'proxy local → API publicada';

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
}

function formatValue(value, key) {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'status') return Number(value) === 1 ? 'Ativo' : 'Inativo';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number' && /preco|salario|valor|subtotal/i.test(key)) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
  return String(value);
}

function Login({ onLogin, message, setMessage }) {
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      await onLogin({
        email: String(form.get('email')).trim(),
        senha: String(form.get('senha'))
      });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-art" aria-label="Gestão comercial">
        <div className="brand brand-light"><span className="brand-mark">V</span> vértice</div>
        <div className="art-copy">
          <span className="eyebrow">GESTÃO COMERCIAL</span>
          <h1>Clareza para<br />cada decisão.</h1>
          <p>Produtos, estoque e vendas em um só lugar.</p>
        </div>
        <div className="art-grid" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span /><span /><span />
        </div>
        <div className="art-footer">API conectada ao ambiente publicado</div>
      </section>
      <section className="login-panel">
        <div className="login-form-wrap">
          <div className="brand brand-dark"><span className="brand-mark">V</span> vértice</div>
          <span className="eyebrow">BEM-VINDA(O) DE VOLTA</span>
          <h2>Acesse sua conta</h2>
          <p className="muted">Entre com suas credenciais para continuar.</p>
          <form onSubmit={submit} className="form-stack">
            <label>
              Email
              <input name="email" type="email" autoComplete="username" required placeholder="voce@empresa.com" />
            </label>
            <label>
              Senha
              <input name="senha" type="password" autoComplete="current-password" required placeholder="Sua senha" />
            </label>
            {message && <div className="notice notice-error" role="alert">{message}</div>}
            <button className="button button-primary button-wide" type="submit" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar na plataforma'} <span aria-hidden="true">→</span>
            </button>
          </form>
          <div className="login-help">
            O cadastro de usuários é protegido. A primeira conta precisa ser provisionada pelo responsável pelo banco.
          </div>
          <div className="connection-line"><span className="status-dot" /> API: {API_URL}</div>
        </div>
      </section>
    </main>
  );
}

function FieldInput({ field, value, options, disabled, editing }) {
  const referenceOptions = field.options && !Array.isArray(field.options);
  const common = {
    name: field.name,
    id: `field-${field.name}`,
    required: Boolean(field.required || (!editing && field.requiredOnCreate)),
    disabled
  };

  if (field.type === 'select' || referenceOptions) {
    const selectOptions = referenceOptions ? options || [] : field.options || [];
    return (
      <select {...common} defaultValue={value ?? field.defaultValue ?? ''}>
        {field.nullable && <option value="">Não informado</option>}
        {selectOptions.map(option => (
          <option value={option.value ?? option[field.options?.id]} key={option.value ?? option[field.options?.id]}>
            {option.label ?? `${option.prefix || ''}${option[field.options?.label]}`}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return <textarea {...common} rows="3" placeholder={field.placeholder || ''} defaultValue={value ?? ''} maxLength={field.maxLength} />;
  }

  return (
    <input
      {...common}
      type={field.type || 'text'}
      min={field.min}
      max={field.max}
      step={field.step}
      maxLength={field.maxLength}
      minLength={field.minLength}
      placeholder={field.placeholder || ''}
      defaultValue={value ?? field.defaultValue ?? ''}
    />
  );
}

function RecordForm({ module, record, token, onCancel, onSave, busy, error, setError }) {
  const [choices, setChoices] = useState({});
  const [choicesLoading, setChoicesLoading] = useState(false);
  const editing = Boolean(record);

  useEffect(() => {
    let active = true;
    const referenceFields = module.fields.filter(field => field.options && !Array.isArray(field.options));
    if (!referenceFields.length) return undefined;
    setChoicesLoading(true);
    Promise.all(referenceFields.map(async field => {
      const { endpoint, key } = field.options;
      const response = await apiRequest(endpoint, { token });
      return [field.name, response[key]];
    })).then(entries => {
      if (active) setChoices(Object.fromEntries(entries));
    }).catch(loadError => {
      if (active) setError(`Falha ao carregar opções do formulário: ${getErrorMessage(loadError)}`);
    }).finally(() => {
      if (active) setChoicesLoading(false);
    });
    return () => { active = false; };
  }, [module, token, setError]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const payload = {};

    for (const field of module.fields) {
      let value = formData.get(field.name);
      if (field.type === 'password' && !value) continue;
      if (value === '' || value === null) {
        if (field.nullable) payload[field.name] = null;
        continue;
      }
      if (field.type === 'number') value = Number(value);
      if (field.valueType === 'number' ||
          (field.type === 'select' && field.options && !Array.isArray(field.options))) {
        value = Number(value);
      }
      payload[field.name] = value;
    }

    try {
      await onSave(payload);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    }
  }

  return (
    <form className="record-form" onSubmit={submit}>
      <div className="field-grid">
        {module.fields.map(field => (
          <label className={field.type === 'textarea' ? 'field-wide' : ''} key={field.name} htmlFor={`field-${field.name}`}>
            {field.label}
            <FieldInput
              field={field}
              value={record?.[field.name]}
              options={choices[field.name]}
              disabled={choicesLoading}
              editing={editing}
            />
          </label>
        ))}
      </div>
      {choicesLoading && <p className="muted small">Carregando opções…</p>}
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <div className="dialog-actions">
        <button type="button" className="button button-quiet" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="submit" className="button button-primary" disabled={busy || choicesLoading}>
          {busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}

function Dialog({ title, children, onClose, wide = false }) {
  return (
    <div className="dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`dialog ${wide ? 'dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-heading">
          <div><span className="eyebrow">GESTÃO COMERCIAL</span><h2>{title}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Dashboard({ onNavigate, token }) {
  const [health, setHealth] = useState('checking');
  useEffect(() => {
    let active = true;
    apiRequest('/teste', { token }).then(() => {
      if (active) setHealth('online');
    }).catch(() => {
      if (active) setHealth('offline');
    });
    return () => { active = false; };
  }, [token]);

  const shortcuts = [
    modules.find(item => item.key === 'produtos'),
    modules.find(item => item.key === 'estoque'),
    modules.find(item => item.key === 'pedidos'),
    modules.find(item => item.key === 'clientes')
  ];

  return (
    <div className="dashboard">
      <div className="welcome-panel">
        <div>
          <span className="eyebrow">PAINEL DE CONTROLE</span>
          <h2>Bem-vinda(o) à sua operação.</h2>
          <p>Acesse os módulos para consultar ou atualizar seus dados comerciais.</p>
        </div>
        <div className={`api-status ${health}`}>
          <span className="status-dot" />
          {health === 'checking' ? 'Verificando API…' : health === 'online' ? 'API online' : 'API indisponível'}
        </div>
      </div>
      <div className="section-title"><div><h3>Acesso rápido</h3><p>Seus módulos mais utilizados</p></div></div>
      <div className="shortcut-grid">
        {shortcuts.map((item, index) => (
          <button className="shortcut-card" key={item.key} onClick={() => onNavigate(item.key)}>
            <span className={`shortcut-icon accent-${index}`}>{item.icon}</span>
            <span className="shortcut-title">{item.label}</span>
            <span className="shortcut-description">{item.description}</span>
            <span className="shortcut-arrow">Abrir módulo <span aria-hidden="true">→</span></span>
          </button>
        ))}
      </div>
      <div className="info-panel">
        <span className="info-icon">i</span>
        <p>As operações de cadastro, alteração e exclusão exigem uma sessão autenticada. O token permanece apenas nesta sessão do navegador.</p>
      </div>
    </div>
  );
}

function ModuleView({ module, token, notify }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

  async function reload() {
    setLoading(true);
    try {
      const response = await apiRequest(module.endpoint, { token });
      setRecords(response[module.listKey] || []);
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setQuery('');
    setDialog(null);
    reload();
  }, [module, token]);

  const visibleRecords = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return records;
    return records.filter(record =>
      Object.values(record).some(value => String(value ?? '').toLocaleLowerCase('pt-BR').includes(normalized))
    );
  }, [records, query]);

  function openForm(mode, record = null) {
    setDialogError('');
    setDialog({ mode, record });
  }

  async function saveRecord(payload) {
    setBusy(true);
    try {
      const editing = dialog.mode === 'edit';
      const path = editing ? `${module.endpoint}/${dialog.record[module.idKey]}` : module.endpoint;
      const response = await apiRequest(path, {
        token,
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });
      setDialog(null);
      notify(response.mensagem || 'Operação realizada com sucesso.', 'success');
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord(record) {
    if (!window.confirm(`Deseja excluir ou desativar este registro de ${module.label.toLocaleLowerCase('pt-BR')}?`)) return;
    try {
      const response = await apiRequest(`${module.endpoint}/${record[module.idKey]}`, {
        token,
        method: 'DELETE'
      });
      notify(response.mensagem || 'Registro removido com sucesso.', 'success');
      await reload();
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    }
  }

  async function viewDetails(record) {
    setDialogError('');
    try {
      const response = await apiRequest(`${module.endpoint}/${record[module.idKey]}`, { token });
      setDialog({ mode: 'details', record: response[module.detailKey] || record });
    } catch (error) {
      notify(getErrorMessage(error), 'error');
    }
  }

  return (
    <section className="module-view">
      <div className="module-heading">
        <div>
          <span className="eyebrow">MÓDULOS / {module.label.toLocaleUpperCase('pt-BR')}</span>
          <h2>{module.label}</h2>
          <p>{module.description}</p>
        </div>
        <div className="heading-actions">
          <button className="button button-quiet" onClick={reload} disabled={loading}><span aria-hidden="true">↻</span> Atualizar</button>
          {module.operations.includes('create') && (
            <button className="button button-primary" onClick={() => openForm('create')}><span aria-hidden="true">＋</span> Novo cadastro</button>
          )}
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div><strong>{loading ? '—' : visibleRecords.length}</strong><span> registros</span></div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar nesta lista…" aria-label="Buscar nesta lista" />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr>
              {module.columns.map(([, label]) => <th key={label}>{label}</th>)}
              <th className="actions-heading">Ações</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td className="empty-state" colSpan={module.columns.length + 1}>Carregando dados…</td></tr>
              ) : visibleRecords.length === 0 ? (
                <tr><td className="empty-state" colSpan={module.columns.length + 1}>
                  {records.length ? 'Nenhum resultado para esta busca.' : 'Ainda não há registros neste módulo.'}
                </td></tr>
              ) : visibleRecords.map(record => (
                <tr key={record[module.idKey]}>
                  {module.columns.map(([key]) => <td key={key} title={formatValue(record[key], key)}>{formatValue(record[key], key)}</td>)}
                  <td className="row-actions">
                    <button className="text-button" onClick={() => viewDetails(record)}>Detalhes</button>
                    {module.operations.includes('edit') && <button className="text-button" onClick={() => openForm('edit', record)}>Editar</button>}
                    {module.operations.includes('delete') && <button className="text-button danger-text" onClick={() => deleteRecord(record)}>Excluir</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {dialog?.mode === 'details' && (
        <Dialog title={`Detalhes • ${module.label}`} onClose={() => setDialog(null)} wide>
          <pre className="details-json">{JSON.stringify(dialog.record, null, 2)}</pre>
        </Dialog>
      )}
      {(dialog?.mode === 'create' || dialog?.mode === 'edit') && (
        <Dialog title={dialog.mode === 'edit' ? `Editar ${module.label.toLocaleLowerCase('pt-BR')}` : `Novo cadastro • ${module.label}`} onClose={() => setDialog(null)}>
          <RecordForm
            module={module}
            record={dialog.record}
            token={token}
            onCancel={() => setDialog(null)}
            onSave={saveRecord}
            busy={busy}
            error={dialogError}
            setError={setDialogError}
          />
        </Dialog>
      )}
    </section>
  );
}

export default function App() {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('gestao-user') || 'null');
    } catch {
      return null;
    }
  });
  const [activeKey, setActiveKey] = useState(null);
  const [loginMessage, setLoginMessage] = useState('');
  const [toast, setToast] = useState(null);
  const activeModule = modules.find(module => module.key === activeKey);

  useEffect(() => {
    const expireSession = () => {
      sessionStorage.removeItem('gestao-token');
      sessionStorage.removeItem('gestao-user');
      setToken(null);
      setUser(null);
      setActiveKey(null);
      setLoginMessage('Sua sessão expirou. Entre novamente.');
    };
    window.addEventListener('api:unauthorized', expireSession);
    return () => window.removeEventListener('api:unauthorized', expireSession);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function login(credentials) {
    const response = await apiRequest('/usuario/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    sessionStorage.setItem('gestao-token', response.token);
    sessionStorage.setItem('gestao-user', JSON.stringify(response.usuario));
    setToken(response.token);
    setUser(response.usuario);
    setLoginMessage('');
    setActiveKey(null);
  }

  function logout() {
    sessionStorage.removeItem('gestao-token');
    sessionStorage.removeItem('gestao-user');
    setToken(null);
    setUser(null);
    setActiveKey(null);
    setToast(null);
  }

  if (!token) {
    return <Login onLogin={login} message={loginMessage} setMessage={setLoginMessage} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand brand-sidebar" onClick={() => setActiveKey(null)} aria-label="Ir ao painel">
          <span className="brand-mark">V</span><span>vértice</span>
        </button>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <button className={`nav-item ${!activeKey ? 'active' : ''}`} onClick={() => setActiveKey(null)}>
          <span className="nav-icon">⌂</span> Painel inicial
        </button>
        <div className="nav-section">OPERAÇÃO</div>
        {modules.slice(0, 8).map(module => (
          <button key={module.key} className={`nav-item ${activeKey === module.key ? 'active' : ''}`} onClick={() => setActiveKey(module.key)}>
            <span className="nav-icon">{module.icon}</span>{module.label}
          </button>
        ))}
        <div className="nav-section">VENDAS E AUDITORIA</div>
        {modules.slice(8, 13).map(module => (
          <button key={module.key} className={`nav-item ${activeKey === module.key ? 'active' : ''}`} onClick={() => setActiveKey(module.key)}>
            <span className="nav-icon">{module.icon}</span>{module.label}
          </button>
        ))}
        <div className="nav-section">ACESSO</div>
        {modules.slice(13).map(module => (
          <button key={module.key} className={`nav-item ${activeKey === module.key ? 'active' : ''}`} onClick={() => setActiveKey(module.key)}>
            <span className="nav-icon">{module.icon}</span>{module.label}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="profile">
            <span className="avatar">{(user?.nome || 'U').slice(0, 1).toLocaleUpperCase('pt-BR')}</span>
            <span className="profile-copy"><strong>{user?.nome || 'Usuário'}</strong><small>{user?.email || 'Sessão autenticada'}</small></span>
          </div>
          <button className="nav-item logout-button" onClick={logout}><span className="nav-icon">↪</span> Sair da conta</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <span className="breadcrumb">Gestão comercial <span>/</span> {activeModule?.label || 'Visão geral'}</span>
          <a href="https://backend-1-puom.onrender.com/teste" target="_blank" rel="noreferrer" className="api-link">API publicada <span aria-hidden="true">↗</span></a>
        </header>
        <div className="page-content">
          {activeModule
            ? <ModuleView module={activeModule} token={token} notify={(message, type) => setToast({ message, type })} />
            : <Dashboard token={token} onNavigate={setActiveKey} />}
        </div>
      </main>
      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.message}</div>}
    </div>
  );
}
