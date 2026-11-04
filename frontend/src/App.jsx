import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Boxes, BriefcaseBusiness,
  ChartNoAxesCombined, ChevronDown, CircleAlert, ContactRound, Eye, EyeOff, FileText,
  LayoutDashboard, ListOrdered, LogOut, Menu, Package, Plus, RefreshCw, Search,
  ScrollText, ShoppingBag, Tag, Truck, Users, X
} from 'lucide-react';
import { apiRequest } from './api.js';
import { modules } from './modules.js';

const iconMap = {
  activity: Activity,
  'arrow-down-to-line': ArrowDownToLine,
  'arrow-up-from-line': ArrowUpFromLine,
  boxes: Boxes,
  briefcase: BriefcaseBusiness,
  'chart-no-axes-combined': ChartNoAxesCombined,
  contact: ContactRound,
  package: Package,
  'list-ordered': ListOrdered,
  'shopping-bag': ShoppingBag,
  'scroll-text': ScrollText,
  tag: Tag,
  truck: Truck,
  users: Users
};

function readSavedSession() {
  try {
    const user = sessionStorage.getItem('loja-user');
    const token = sessionStorage.getItem('loja-token');
    return user && token ? { user: JSON.parse(user), token } : null;
  } catch {
    sessionStorage.removeItem('loja-user');
    sessionStorage.removeItem('loja-token');
    return null;
  }
}

function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function formatValue(value, key = '') {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'status') return Number(value) === 1 ? 'Ativo' : 'Inativo';
  if (key === 'preco' || key === 'salario' || key === 'subtotal' || key === 'valor_unitario') {
    const number = Number(value);
    return Number.isFinite(number)
      ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : String(value);
  }
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function inputValue(value, field) {
  if (value === null || value === undefined) return '';
  if (field.type === 'date' && typeof value === 'string') return value.slice(0, 10);
  if (field.inputType === 'datetime-local' && typeof value === 'string') {
    return value.replace(' ', 'T').slice(0, 16);
  }
  return String(value);
}

function buildPayload(formData, fields) {
  const payload = {};
  for (const field of fields) {
    const value = formData.get(field.name);
    if (value === '') {
      if (field.nullable) payload[field.name] = null;
      continue;
    }
    if (field.type === 'number' || (field.type === 'select' && field.name === 'status')) {
      payload[field.name] = Number(value);
    } else if (field.inputType === 'datetime-local') {
      payload[field.name] = value.replace('T', ' ');
    } else {
      payload[field.name] = value;
    }
  }
  return payload;
}

function Field({ field, value }) {
  const common = {
    id: `field-${field.name}`,
    name: field.name,
    required: Boolean(field.required),
    defaultValue: value,
    min: field.min,
    step: field.step,
    minLength: field.minLength,
    autoComplete: field.inputType === 'password' ? 'new-password' : undefined
  };
  return (
    <label className={field.multiline ? 'form-field form-field-wide' : 'form-field'} htmlFor={common.id}>
      <span>{field.label}{field.required && <i aria-hidden="true"> *</i>}</span>
      {field.multiline
        ? <textarea {...common} rows="3" />
        : field.type === 'select'
          ? (
            <select {...common}>
              <option value="">Selecione</option>
              {field.options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )
          : <input {...common} type={field.inputType || field.type} />}
    </label>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    apiRequest('/teste')
      .then(() => { if (active) setApiStatus('online'); })
      .catch(() => { if (active) setApiStatus('offline'); });
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await apiRequest('/usuario/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha: password })
      });
      onLogin(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark"><Package size={23} strokeWidth={2.2} /></div>
        <p className="eyebrow">GESTÃO DE LOJA</p>
        <h1>Bem-vindo de volta</h1>
        <p className="muted">Entre com sua conta para acessar o painel.</p>
        {error && <div className="alert alert-error" role="alert"><CircleAlert size={18} />{error}</div>}
        <form className="login-form" onSubmit={submit}>
          <label className="form-field" htmlFor="login-email">
            <span>E-mail</span>
            <input id="login-email" type="email" autoComplete="username" required value={email}
              onChange={event => setEmail(event.target.value)} />
          </label>
          <label className="form-field" htmlFor="login-password">
            <span>Senha</span>
            <span className="password-input">
              <input id="login-password" type={passwordVisible ? 'text' : 'password'}
                autoComplete="current-password" required value={password}
                onChange={event => {
                  setPassword(event.target.value);
                  setError('');
                }} />
              <button type="button" className="password-toggle"
                aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible(visible => !visible)}>
                {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          <button className="button button-primary button-full" disabled={loading}>
            {loading ? <><RefreshCw className="spin" size={16} /> Entrando...</> : 'Entrar'}
          </button>
        </form>
        <div className="login-footnote">
          <span>Use os dados de um usuário ativo da loja.</span>
          <span className={`login-api-status ${apiStatus}`}>
            <i className={`status-dot ${apiStatus}`} />
            {apiStatus === 'online' ? 'API conectada' : apiStatus === 'offline' ? 'API indisponível' : 'Verificando conexão'}
          </span>
        </div>
      </section>
    </main>
  );
}

function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}><X size={19} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function RecordForm({ module, record, onClose, onSaved }) {
  const editing = Boolean(record);
  const fields = editing ? module.editFields : module.createFields;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = buildPayload(new FormData(event.currentTarget), fields);
      const method = editing ? 'PATCH' : 'POST';
      const path = editing
        ? `${module.endpoint}/${record[module.idField]}`
        : module.endpoint;
      await apiRequest(path, { method, body: JSON.stringify(payload) });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={`${editing ? 'Editar' : 'Novo'} ${module.singular}`} onClose={onClose}>
      <form className="record-form" onSubmit={submit}>
        {error && <div className="alert alert-error" role="alert"><CircleAlert size={18} />{error}</div>}
        {fields.map(field => (
          <Field key={field.name} field={field}
            value={inputValue(editing ? record[field.name] : '', field)} />
        ))}
        <footer className="form-actions">
          <button className="button button-quiet" type="button" onClick={onClose}>Cancelar</button>
          <button className="button button-primary" disabled={loading}>
            {loading ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar registro'}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function Detail({ module, record, onClose }) {
  const [detail, setDetail] = useState(record);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest(`${module.endpoint}/${record[module.idField]}`)
      .then(result => {
        if (active) setDetail(result[module.itemKey] || record);
      })
      .catch(requestError => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [module, record]);

  return (
    <Modal title={`Detalhes · ${module.title}`} onClose={onClose} wide>
      <div className="detail-content">
        {loading && <p className="muted">Carregando detalhes...</p>}
        {error && <div className="alert alert-error" role="alert"><CircleAlert size={18} />{error}</div>}
        {!loading && (
          <dl className="detail-grid">
            {Object.entries(detail).map(([key, value]) => (
              <div className="detail-item" key={key}>
                <dt>{formatLabel(key)}</dt>
                <dd>{formatValue(value, key)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Modal>
  );
}

function Dashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const results = await Promise.all(modules.map(async module => {
      try {
        const response = await apiRequest(module.endpoint);
        const rows = response[module.listKey];
        return { id: module.id, count: Array.isArray(rows) ? rows.length : 0 };
      } catch {
        return { id: module.id, count: null };
      }
    }));
    setMetrics(results);
    if (results.every(result => result.count === null)) {
      setError('Não foi possível carregar os dados. Confira a conexão com a API.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = metrics?.reduce((sum, item) => sum + (item.count || 0), 0);
  const unavailable = metrics?.filter(item => item.count === null).length || 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">VISÃO GERAL</p>
          <h1>Dashboard</h1>
          <p className="muted">Resumo dos dados cadastrados na sua loja.</p>
        </div>
        <button className="button button-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Atualizar
        </button>
      </div>
      <div className="stat-grid">
        <article className="stat-card stat-card-primary">
          <div className="stat-icon"><LayoutDashboard size={20} /></div>
          <span>Total de registros</span>
          <strong>{loading ? '...' : total}</strong>
          <small>Somatório das listas da API</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon-soft"><Package size={20} /></div>
          <span>Produtos</span>
          <strong>{loading ? '...' : metrics?.find(item => item.id === 'produtos')?.count ?? '—'}</strong>
          <small>Catálogo cadastrado</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon-soft"><Boxes size={20} /></div>
          <span>Itens em estoque</span>
          <strong>{loading ? '...' : metrics?.find(item => item.id === 'estoque')?.count ?? '—'}</strong>
          <small>Produtos com controle de estoque</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon-soft"><ShoppingBag size={20} /></div>
          <span>Pedidos</span>
          <strong>{loading ? '...' : metrics?.find(item => item.id === 'pedidos')?.count ?? '—'}</strong>
          <small>Pedidos registrados</small>
        </article>
      </div>
      {error && <div className="alert alert-error dashboard-alert" role="alert"><CircleAlert size={18} />{error}</div>}
      {unavailable > 0 && !error && (
        <div className="alert alert-warning dashboard-alert">
          <CircleAlert size={18} /> {unavailable} {unavailable === 1 ? 'módulo não respondeu' : 'módulos não responderam'} à API.
        </div>
      )}
      <section className="panel quick-panel">
        <div className="panel-heading">
          <div><h2>Acesso rápido</h2><p className="muted">Abra uma área de gerenciamento.</p></div>
        </div>
        <div className="quick-grid">
          {modules.slice(0, 8).map(module => {
            const Icon = iconMap[module.icon] || FileText;
            return (
              <button className="quick-link" key={module.id} onClick={() => onNavigate(module.id)}>
                <span className="nav-icon"><Icon size={18} /></span>
                <span>{module.title}</span><ChevronDown className="quick-arrow" size={16} />
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function DataTable({ module, rows, search, onSearch, onCreate, onEdit, onDelete, onDetails }) {
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return rows;
    return rows.filter(row => Object.values(row).some(value =>
      String(value ?? '').toLocaleLowerCase('pt-BR').includes(query)
    ));
  }, [rows, search]);

  return (
    <section className="panel table-panel">
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input aria-label={`Buscar em ${module.title}`} placeholder="Buscar registros..." value={search}
            onChange={event => onSearch(event.target.value)} />
        </div>
        {module.createFields && (
          <button className="button button-primary" onClick={onCreate}><Plus size={17} /> Novo registro</button>
        )}
      </div>
      {filtered.length === 0
        ? (
          <div className="empty-state">
            <div className="empty-icon"><Search size={21} /></div>
            <h3>{rows.length ? 'Nenhum resultado' : 'Nenhum registro ainda'}</h3>
            <p>{rows.length ? 'Tente outra busca.' : 'Quando houver dados na API, eles aparecerão aqui.'}</p>
            {!rows.length && module.createFields && (
              <button className="button button-secondary" onClick={onCreate}><Plus size={16} /> Criar primeiro registro</button>
            )}
          </div>
        )
        : (
          <>
            <div className="table-scroll">
              <table>
                <thead><tr>
                  {module.columns.map(column => <th key={column}>{formatLabel(column)}</th>)}
                  <th className="actions-heading">Ações</th>
                </tr></thead>
                <tbody>
                  {filtered.map((row, index) => (
                    <tr key={row[module.idField] ?? index}>
                      {module.columns.map(column => (
                        <td key={column}>
                          {column === 'ativo'
                            ? <span className={`status-pill ${Number(row[column]) === 1 ? 'status-active' : 'status-inactive'}`}>
                              {Number(row[column]) === 1 ? 'Ativo' : 'Inativo'}
                            </span>
                            : formatValue(row[column], column)}
                        </td>
                      ))}
                      <td>
                        <div className="row-actions">
                          <button className="text-button" onClick={() => onDetails(row)}>Detalhes</button>
                          {module.editFields && <button className="text-button" onClick={() => onEdit(row)}>Editar</button>}
                          {module.deleteLabel && (
                            <button className="text-button text-danger" onClick={() => onDelete(row)}>
                              {module.deleteLabel}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="table-footer">{filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}</footer>
          </>
        )}
    </section>
  );
}

function ModulePage({ module, onBack }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [formRecord, setFormRecord] = useState(undefined);
  const [detailRecord, setDetailRecord] = useState(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest(module.endpoint);
      setRows(Array.isArray(result[module.listKey]) ? result[module.listKey] : []);
    } catch (requestError) {
      setError(requestError.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [module]);

  useEffect(() => { load(); }, [load]);

  async function removeRecord(row) {
    const id = row[module.idField];
    if (!window.confirm(`Confirma ${module.deleteLabel?.toLowerCase()} "${row.nome || row[module.idField]}"?`)) return;
    setError('');
    setNotice('');
    try {
      await apiRequest(`${module.endpoint}/${id}`, { method: 'DELETE' });
      setNotice('Registro removido com sucesso.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function saved() {
    setFormRecord(undefined);
    setNotice('Registro salvo com sucesso.');
    load();
  }

  return (
    <>
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Voltar ao dashboard</button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">GERENCIAMENTO</p>
          <h1>{module.title}</h1>
          <p className="muted">Consulte e gerencie os dados de {module.title.toLocaleLowerCase('pt-BR')}.</p>
        </div>
        <button className="button button-secondary" onClick={load} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Atualizar
        </button>
      </div>
      {notice && <div className="alert alert-success" role="status">{notice}<button className="alert-close" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={16} /></button></div>}
      {error && <div className="alert alert-error" role="alert"><CircleAlert size={18} />{error}<button className="alert-close" onClick={() => setError('')} aria-label="Fechar erro"><X size={16} /></button></div>}
      {loading
        ? <section className="panel loading-panel"><RefreshCw size={19} className="spin" /> Carregando dados...</section>
        : !error && (
          <DataTable module={module} rows={rows} search={search} onSearch={setSearch}
            onCreate={() => setFormRecord(null)} onEdit={setFormRecord}
            onDelete={removeRecord} onDetails={setDetailRecord} />
        )}
      {formRecord !== undefined && (
        <RecordForm key={`${module.id}-${formRecord?.[module.idField] ?? 'new'}`}
          module={module} record={formRecord} onClose={() => setFormRecord(undefined)} onSaved={saved} />
      )}
      {detailRecord && <Detail module={module} record={detailRecord} onClose={() => setDetailRecord(null)} />}
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(readSavedSession);
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    apiRequest('/teste')
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  function login(result) {
    const nextSession = { user: result.usuario, token: result.token };
    sessionStorage.setItem('loja-user', JSON.stringify(nextSession.user));
    sessionStorage.setItem('loja-token', nextSession.token);
    setSession(nextSession);
  }

  function logout() {
    sessionStorage.removeItem('loja-user');
    sessionStorage.removeItem('loja-token');
    setSession(null);
    setActivePage('dashboard');
  }

  if (!session) return <Login onLogin={login} />;

  const selectedModule = modules.find(module => module.id === activePage);

  function navigate(page) {
    setActivePage(page);
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><Package size={21} strokeWidth={2.2} /></div>
          <div><strong>Varejo</strong><span>Gestão de loja</span></div>
          <button className="icon-button sidebar-close" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
        </div>
        <div className="nav-caption">MENU PRINCIPAL</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <button className={`nav-item ${activePage === 'dashboard' ? 'nav-active' : ''}`} onClick={() => navigate('dashboard')}>
            <LayoutDashboard size={18} /><span>Dashboard</span>
          </button>
          <div className="nav-caption nav-caption-spaced">GESTÃO</div>
          {modules.map(module => {
            const Icon = iconMap[module.icon] || FileText;
            return (
              <button key={module.id} className={`nav-item ${activePage === module.id ? 'nav-active' : ''}`}
                onClick={() => navigate(module.id)}>
                <Icon size={18} /><span>{module.title}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className={`connection-indicator ${apiStatus}`}>
            <span className="connection-dot" />
            <span>{apiStatus === 'online' ? 'API conectada' : apiStatus === 'offline' ? 'API indisponível' : 'Verificando API'}</span>
          </div>
          <button className="profile-button" onClick={logout}>
            <span className="avatar">{(session.user?.nome || 'U').charAt(0).toUpperCase()}</span>
            <span className="profile-copy"><strong>{session.user?.nome || 'Usuário'}</strong><small>{session.user?.email}</small></span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobileMenuOpen && <button className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} aria-label="Fechar menu" />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" aria-label="Abrir menu" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Varejo</span><span className="breadcrumb-separator">/</span><strong>{selectedModule?.title || 'Dashboard'}</strong></div>
          <div className="topbar-user">
            <span className="topbar-status"><i className={`status-dot ${apiStatus}`} />{apiStatus === 'online' ? 'Online' : apiStatus === 'offline' ? 'API offline' : 'Conectando'}</span>
            <span className="topbar-avatar">{(session.user?.nome || 'U').charAt(0).toUpperCase()}</span>
          </div>
        </header>
        <div className="content-area">
          <div className="security-note">
            <CircleAlert size={15} />
            <span>O login atual não restringe o acesso aos demais endpoints da API.</span>
          </div>
          {selectedModule
            ? <ModulePage key={selectedModule.id} module={selectedModule} onBack={() => navigate('dashboard')} />
            : <Dashboard onNavigate={navigate} />}
          <footer className="app-footer">Varejo <span>·</span> Painel de gestão</footer>
        </div>
      </main>
    </div>
  );
}
