import React, { useState } from 'react';
import './Comunicados.css';
import { useSchool } from '../context/SchoolContext';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, 
  FaBullhorn, FaUsers, FaChalkboardTeacher,
  FaUserGraduate, FaClock, FaCalendar, FaEye,
  FaArrowLeft, FaCheckCircle, FaTag, FaPaperPlane,
  FaUser, FaSchool, FaBook,
  FaExclamationTriangle, FaInfoCircle as FaInfo
} from 'react-icons/fa';

// ============================================================
// ✅ MODAL DE AVISO (substitui alert())
// ============================================================
const AvisoModal = ({ aviso, onClose }) => {
  React.useEffect(() => {
    if (!aviso) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [aviso, onClose]);

  if (!aviso) return null;

  const tipo = aviso.tipo || "info"; // sucesso | erro | info
  const cores = {
    sucesso: { bg: "#16a34a", icon: <FaCheckCircle />, titulo: "Sucesso" },
    erro: { bg: "#dc2626", icon: <FaExclamationTriangle />, titulo: "Atenção" },
    info: { bg: "#2563eb", icon: <FaInfo />, titulo: "Informação" },
  }[tipo] || { bg: "#2563eb", icon: <FaInfo />, titulo: "Informação" };

  return (
    <div className="aviso-overlay" onClick={onClose}>
      <div className="aviso-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aviso-icone" style={{ backgroundColor: cores.bg }}>
          {cores.icon}
        </div>
        <h3 className="aviso-titulo">{aviso.titulo || cores.titulo}</h3>
        <p className="aviso-mensagem">{aviso.mensagem}</p>
        <button className="aviso-botao" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
};

const Comunicados = () => {
  const { comunicados, setComunicados, professores } = useSchool();

  const [viewMode, setViewMode] = useState('lista');
  const [selectedComunicado, setSelectedComunicado] = useState(null);
  const [busca, setBusca] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo] = useState('todos');

  // ✅ Estado do modal de aviso
  const [aviso, setAviso] = useState(null); // { tipo, titulo, mensagem }
  const mostrarAviso = (tipo, mensagem, titulo) =>
    setAviso({ tipo, mensagem, titulo });
  const fecharAviso = () => setAviso(null);

  const [formData, setFormData] = useState({
    titulo: '',
    mensagem: '',
    dataPublicacao: new Date().toISOString().slice(0, 16),
    destinatarios: [],
    tipo: 'Todos',
    status: 'Rascunho',
    autor: 'Direção da Escola'
  });

  const tiposDestinatarios = ['Todos', 'Alunos', 'Turmas', 'Professores'];
  const statusList = ['Rascunho', 'Publicado', 'Arquivado'];
  const turmasDisponiveis = ['Turma A', 'Turma B', 'Turma C'];
  const classesDisponiveis = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe'];

  const handleViewComunicado = (comunicado) => {
    setSelectedComunicado(comunicado);
    setViewMode('detalhes');
  };

  const handleNovoComunicado = () => {
    setFormData({
      titulo: '',
      mensagem: '',
      dataPublicacao: new Date().toISOString().slice(0, 16),
      destinatarios: [],
      tipo: 'Todos',
      status: 'Rascunho',
      autor: 'Direção da Escola'
    });
    setViewMode('novo');
    setEditMode(false);
  };

  const handleEditComunicado = (comunicado) => {
    setFormData({ ...comunicado });
    setSelectedComunicado(comunicado);
    setViewMode('novo');
    setEditMode(true);
  };

  const handleBackToList = () => {
    setViewMode('lista');
    setSelectedComunicado(null);
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTipoChange = (e) => {
    const tipo = e.target.value;
    setFormData({
      ...formData,
      tipo: tipo,
      destinatarios: []
    });
  };

  const handleDestinatarioToggle = (destinatario) => {
    const current = formData.destinatarios || [];
    if (current.includes(destinatario)) {
      setFormData({ ...formData, destinatarios: current.filter(d => d !== destinatario) });
    } else {
      setFormData({ ...formData, destinatarios: [...current, destinatario] });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const novoComunicado = {
      id: editMode ? selectedComunicado.id : comunicados.length + 1,
      ...formData,
      status: formData.status || 'Rascunho',
      visualizacoes: editMode ? selectedComunicado.visualizacoes : 0,
      autor: formData.autor || 'Direção da Escola'
    };

    if (editMode) {
      setComunicados(comunicados.map(c => 
        c.id === selectedComunicado.id ? novoComunicado : c
      ));
      mostrarAviso('sucesso', `Comunicado "${formData.titulo}" atualizado com sucesso!`);
    } else {
      setComunicados([...comunicados, novoComunicado]);
      mostrarAviso('sucesso', `Comunicado "${formData.titulo}" criado com sucesso!`);
    }
    setViewMode('lista');
    setEditMode(false);
  };

  const handleDeleteComunicado = (comunicado) => {
    if (window.confirm(`Tem certeza que deseja excluir o comunicado "${comunicado.titulo}"?`)) {
      setComunicados(comunicados.filter(c => c.id !== comunicado.id));
      mostrarAviso('sucesso', `Comunicado "${comunicado.titulo}" excluído com sucesso!`);
    }
  };

  const handlePublicar = (comunicado) => {
    if (window.confirm(`Publicar o comunicado "${comunicado.titulo}"?`)) {
      setComunicados(comunicados.map(c => 
        c.id === comunicado.id ? { ...c, status: 'Publicado', dataPublicacao: new Date().toISOString() } : c
      ));
      mostrarAviso('sucesso', `Comunicado "${comunicado.titulo}" publicado com sucesso!`);
    }
  };

  const handleArquivar = (comunicado) => {
    if (window.confirm(`Arquivar o comunicado "${comunicado.titulo}"?`)) {
      setComunicados(comunicados.map(c => 
        c.id === comunicado.id ? { ...c, status: 'Arquivado' } : c
      ));
      mostrarAviso('sucesso', `Comunicado "${comunicado.titulo}" arquivado com sucesso!`);
    }
  };

  const comunicadosFiltrados = comunicados.filter(c => {
    const matchBusca = c.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       c.mensagem.toLowerCase().includes(busca.toLowerCase()) ||
                       c.autor.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filterStatus === 'todos' || c.status === filterStatus;
    const matchTipo = filterTipo === 'todos' || c.tipo === filterTipo;
    return matchBusca && matchStatus && matchTipo;
  });

  const comunicadosOrdenados = [...comunicadosFiltrados].sort((a, b) => 
    new Date(b.dataPublicacao) - new Date(a.dataPublicacao)
  );

  if (viewMode === 'novo') {
    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              {editMode ? 'Editar Comunicado' : 'Novo Comunicado'}
            </h2>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Título</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    placeholder="Digite o título do comunicado"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Mensagem</label>
                  <textarea
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleChange}
                    rows="6"
                    placeholder="Digite a mensagem do comunicado"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data de Publicação</label>
                  <input
                    type="datetime-local"
                    name="dataPublicacao"
                    value={formData.dataPublicacao}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    {statusList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Autor</label>
                  <input
                    type="text"
                    name="autor"
                    value={formData.autor}
                    onChange={handleChange}
                    placeholder="Nome do autor"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Tipo de Destinatários</label>
                  <select name="tipo" value={formData.tipo} onChange={handleTipoChange}>
                    {tiposDestinatarios.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-section destinatarios-section">
                <h3><FaUsers /> Destinatários</h3>
                
                {formData.tipo === 'Todos' && (
                  <div className="destinatarios-info">
                    <p className="info-text">O comunicado será enviado para <strong>Todos os destinatários</strong> (Alunos, Professores e Funcionários).</p>
                    <div className="destinatarios-preview">
                      <span className="tag-preview"><FaUserGraduate /> Todos os Alunos</span>
                      <span className="tag-preview"><FaChalkboardTeacher /> Todos os Professores</span>
                      <span className="tag-preview"><FaUser /> Todos os Funcionários</span>
                    </div>
                  </div>
                )}

                {formData.tipo === 'Alunos' && (
                  <div className="destinatarios-select">
                    <p className="info-text">Selecione os alunos ou classes:</p>
                    <div className="destinatarios-grid">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.destinatarios.includes('Todos os alunos')}
                          onChange={() => handleDestinatarioToggle('Todos os alunos')}
                        />
                        <span><FaUserGraduate /> Todos os Alunos</span>
                      </label>
                      {classesDisponiveis.map(cls => (
                        <label key={cls} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.destinatarios.includes(cls)}
                            onChange={() => handleDestinatarioToggle(cls)}
                          />
                          <span><FaBook /> {cls}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.tipo === 'Turmas' && (
                  <div className="destinatarios-select">
                    <p className="info-text">Selecione uma ou mais turmas:</p>
                    <div className="destinatarios-grid">
                      {turmasDisponiveis.map(turma => (
                        <label key={turma} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.destinatarios.includes(turma)}
                            onChange={() => handleDestinatarioToggle(turma)}
                          />
                          <span><FaSchool /> {turma}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.tipo === 'Professores' && (
                  <div className="destinatarios-select">
                    <p className="info-text">Selecione os professores:</p>
                    <div className="destinatarios-grid">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.destinatarios.includes('Todos os professores')}
                          onChange={() => handleDestinatarioToggle('Todos os professores')}
                        />
                        <span><FaChalkboardTeacher /> Todos os Professores</span>
                      </label>
                      {professores.map(prof => (
                        <label key={prof.id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.destinatarios.includes(prof.nome)}
                            onChange={() => handleDestinatarioToggle(prof.nome)}
                          />
                          <span>{prof.nome}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {formData.destinatarios.length > 0 && (
                  <div className="destinatarios-selecionados">
                    <p><strong>Destinatários selecionados:</strong></p>
                    <div className="tags-container">
                      {formData.destinatarios.map(d => (
                        <span key={d} className="tag-item destinatario-tag">
                          {d}
                          <button 
                            type="button" 
                            className="remove-tag"
                            onClick={() => handleDestinatarioToggle(d)}
                          >
                            <FaTimes />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <FaSave /> {editMode ? 'Atualizar' : 'Salvar'}
                </button>
                <button type="button" className="btn-publish" onClick={() => {
                  setFormData({ ...formData, status: 'Publicado' });
                  handleSubmit(new Event('submit'));
                }}>
                  <FaPaperPlane /> Publicar
                </button>
                <button type="button" className="btn-cancel" onClick={handleBackToList}>
                  <FaTimes /> Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
        <AvisoModal aviso={aviso} onClose={fecharAviso} />
      </>
    );
  }

  if (viewMode === 'detalhes' && selectedComunicado) {
    const data = new Date(selectedComunicado.dataPublicacao);
    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              Detalhes do Comunicado
            </h2>
            <div className="header-actions">
              <button className="btn-edit" onClick={() => handleEditComunicado(selectedComunicado)}>
                <FaEdit /> Editar
              </button>
            </div>
          </div>

          <div className="detalhes-container">
            <div className="detalhes-header">
              <div className="detalhes-titulo">
                <h3>{selectedComunicado.titulo}</h3>
                <div className="detalhes-badges">
                  <span className={`status-badge ${selectedComunicado.status.toLowerCase()}`}>
                    {selectedComunicado.status}
                  </span>
                  <span className="tipo-badge">
                    <FaTag /> {selectedComunicado.tipo}
                  </span>
                </div>
              </div>
              <div className="detalhes-meta">
                <div className="meta-item">
                  <FaCalendar /> {data.toLocaleDateString('pt-AO')}
                </div>
                <div className="meta-item">
                  <FaClock /> {data.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="meta-item">
                  <FaEye /> {selectedComunicado.visualizacoes} visualizações
                </div>
              </div>
            </div>

            <div className="detalhes-autor">
              <strong>Autor:</strong> {selectedComunicado.autor}
            </div>

            <div className="detalhes-mensagem">
              <h4>Mensagem</h4>
              <p>{selectedComunicado.mensagem}</p>
            </div>

            <div className="detalhes-destinatarios">
              <h4><FaUsers /> Destinatários</h4>
              <div className="tags-container">
                {selectedComunicado.destinatarios && selectedComunicado.destinatarios.length > 0 ? (
                  selectedComunicado.destinatarios.map(d => (
                    <span key={d} className="tag-item destinatario-tag">
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-muted">Nenhum destinatário específico</span>
                )}
              </div>
            </div>

            <div className="detalhes-actions">
              {selectedComunicado.status === 'Rascunho' && (
                <button className="btn-publish" onClick={() => {
                  handlePublicar(selectedComunicado);
                  setSelectedComunicado({ ...selectedComunicado, status: 'Publicado' });
                }}>
                  <FaPaperPlane /> Publicar
                </button>
              )}
              {selectedComunicado.status === 'Publicado' && (
                <button className="btn-archive" onClick={() => {
                  handleArquivar(selectedComunicado);
                  setSelectedComunicado({ ...selectedComunicado, status: 'Arquivado' });
                }}>
                  <FaCheckCircle /> Arquivar
                </button>
              )}
              <button className="btn-delete" onClick={() => {
                handleDeleteComunicado(selectedComunicado);
                setViewMode('lista');
              }}>
                <FaTrash /> Excluir
              </button>
            </div>
          </div>
        </div>
        <AvisoModal aviso={aviso} onClose={fecharAviso} />
      </>
    );
  }

  return (
    <>
      <div className="container">
        <div className="header">
          <h2><span className="icon"></span> Gestão de Comunicados</h2>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por título, mensagem ou autor..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="todos">Todos os status</option>
                {statusList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                <option value="todos">Todos os tipos</option>
                {tiposDestinatarios.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="btn-add" onClick={handleNovoComunicado}>
              <FaPlus /> Novo Comunicado
            </button>
          </div>
        </div>

        <div className="comunicados-list">
          {comunicadosOrdenados.length === 0 ? (
            <div className="empty-state">
              <FaBullhorn size={48} />
              <p>Nenhum comunicado encontrado</p>
            </div>
          ) : (
            comunicadosOrdenados.map(comunicado => {
              const data = new Date(comunicado.dataPublicacao);
              return (
                <div key={comunicado.id} className={`comunicado-card ${comunicado.status.toLowerCase()}`}>
                  <div className="comunicado-card-header">
                    <div className="comunicado-titulo">
                      <h3>{comunicado.titulo}</h3>
                      <div className="comunicado-badges">
                        <span className={`status-badge ${comunicado.status.toLowerCase()}`}>
                          {comunicado.status}
                        </span>
                        <span className="tipo-badge">
                          <FaTag /> {comunicado.tipo}
                        </span>
                      </div>
                    </div>
                    <div className="comunicado-meta">
                      <span className="meta-item">
                        <FaCalendar /> {data.toLocaleDateString('pt-AO')}
                      </span>
                      <span className="meta-item">
                        <FaClock /> {data.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="meta-item">
                        <FaEye /> {comunicado.visualizacoes}
                      </span>
                    </div>
                  </div>

                  <div className="comunicado-card-body">
                    <p className="comunicado-mensagem">
                      {comunicado.mensagem.length > 200 
                        ? `${comunicado.mensagem.substring(0, 200)}...` 
                        : comunicado.mensagem}
                    </p>
                    <div className="comunicado-autor">
                      <FaUser /> {comunicado.autor}
                    </div>
                  </div>

                  <div className="comunicado-card-footer">
                    <div className="comunicado-destinatarios">
                      <FaUsers />
                      <span>
                        {comunicado.destinatarios && comunicado.destinatarios.length > 0 ? (
                          comunicado.destinatarios.length <= 3 ? (
                            comunicado.destinatarios.join(', ')
                          ) : (
                            `${comunicado.destinatarios.slice(0, 3).join(', ')} +${comunicado.destinatarios.length - 3}`
                          )
                        ) : (
                          'Todos'
                        )}
                      </span>
                    </div>
                    <div className="comunicado-actions">
                      <button className="btn-view" onClick={() => handleViewComunicado(comunicado)}>
                        <FaEye /> Detalhes
                      </button>
                      <button className="btn-edit" onClick={() => handleEditComunicado(comunicado)}>
                        <FaEdit /> Editar
                      </button>
                      {comunicado.status === 'Rascunho' && (
                        <button className="btn-publish" onClick={() => handlePublicar(comunicado)}>
                          <FaPaperPlane />
                        </button>
                      )}
                      {comunicado.status === 'Publicado' && (
                        <button className="btn-archive" onClick={() => handleArquivar(comunicado)}>
                          <FaCheckCircle />
                        </button>
                      )}
                      <button className="btn-delete" onClick={() => handleDeleteComunicado(comunicado)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="resumo-comunicados">
          <div className="resumo-item">
            <span className="label">Total:</span>
            <span className="value">{comunicados.length}</span>
          </div>
          <div className="resumo-item">
            <span className="label">Publicados:</span>
            <span className="value positive">{comunicados.filter(c => c.status === 'Publicado').length}</span>
          </div>
          <div className="resumo-item">
            <span className="label">Rascunhos:</span>
            <span className="value">{comunicados.filter(c => c.status === 'Rascunho').length}</span>
          </div>
          <div className="resumo-item">
            <span className="label">Arquivados:</span>
            <span className="value">{comunicados.filter(c => c.status === 'Arquivado').length}</span>
          </div>
          <div className="resumo-item">
            <span className="label">Total Visualizações:</span>
            <span className="value highlight">{comunicados.reduce((sum, c) => sum + c.visualizacoes, 0)}</span>
          </div>
        </div>
      </div>

      {/* ✅ Modal de aviso (substitui alert()) */}
      <AvisoModal aviso={aviso} onClose={fecharAviso} />
    </>
  );
};

export default Comunicados;