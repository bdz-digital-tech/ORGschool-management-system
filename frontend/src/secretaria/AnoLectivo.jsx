// src/secretaria/AnoLectivo.jsx
import React, { useState } from 'react';
import './AnoLectivo.css';
import { useSchool } from '../context/SchoolContext';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaSave, FaTimes, 
  FaCalendar, FaCalendarAlt, FaCheckCircle, FaTimesCircle,
  FaSchool, FaUsers, FaArrowLeft, FaEye, FaStar,
  FaInfoCircle, FaLink, FaSync,
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

  const tipo = aviso.tipo || "info";
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

// ============================================================
// ✅ MODAL DE CONFIRMAÇÃO (substitui window.confirm)
// ============================================================
const ConfirmModal = ({ confirmacao, onConfirm, onCancel }) => {
  React.useEffect(() => {
    if (!confirmacao) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmacao, onConfirm, onCancel]);

  if (!confirmacao) return null;

  const {
    titulo = "Confirmação",
    mensagem,
    textoConfirmar = "Sim",
    textoCancelar = "Não",
  } = confirmacao;

  return (
    <div className="aviso-overlay" onClick={onCancel}>
      <div className="aviso-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aviso-icone" style={{ backgroundColor: "#f59e0b" }}>
          <FaExclamationTriangle />
        </div>
        <h3 className="aviso-titulo">{titulo}</h3>
        <p className="aviso-mensagem">{mensagem}</p>
        <div className="confirm-actions">
          <button
            className="confirm-botao confirm-cancelar"
            onClick={onCancel}
          >
            {textoCancelar}
          </button>
          <button
            className="confirm-botao confirm-confirmar"
            onClick={onConfirm}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};

const AnoLectivo = () => {
  // ✅ Aceder a classes do Context (vem do ClassesTurmas)
  const { 
    anosLectivos, 
    setAnosLectivos, 
    setAnoLectivoActual,
    classes, // ← Classes vindas do ClassesTurmas
  } = useSchool();

  const [viewMode, setViewMode] = useState('lista');
  const [selectedAno, setSelectedAno] = useState(null);
  const [busca, setBusca] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');

  // ✅ Estado do modal de aviso
  const [aviso, setAviso] = useState(null); // { tipo, titulo, mensagem }
  const mostrarAviso = (tipo, mensagem, titulo) =>
    setAviso({ tipo, mensagem, titulo });
  const fecharAviso = () => setAviso(null);

  // ✅ Estado do modal de confirmação
  const [confirmacao, setConfirmacao] = useState(null);
  const abrirConfirmacao = (config) => setConfirmacao(config);
  const fecharConfirmacao = () => setConfirmacao(null);
  const confirmar = () => {
    const cb = confirmacao?.onConfirm;
    fecharConfirmacao();
    if (typeof cb === "function") cb();
  };

  const [formData, setFormData] = useState({
    ano: '',
    dataInicio: '',
    dataTermino: '',
    estado: 'Activo',
    isAnoActual: false,
    classesDisponiveis: [],
    turmasDisponiveis: [],
    descricao: ''
  });

  // ============================================================
  // ✅ CLASSES E TURMAS DINÂMICAS (vêm do ClassesTurmas)
  // ============================================================
  const todasClasses = (classes && classes.length > 0)
    ? classes.map((c) => c.nome)
    : [];

  const todasTurmas = (() => {
    const set = new Set();
    (classes || []).forEach((c) => {
      (c.turmas || []).forEach((t) => set.add(t.nome));
    });
    return Array.from(set).sort();
  })();

  const temClasses = todasClasses.length > 0;
  const temTurmas = todasTurmas.length > 0;

  const estados = ['Activo', 'Encerrado', 'Pendente'];

  const handleViewAno = (ano) => {
    setSelectedAno(ano);
    setViewMode('detalhes');
  };

  const handleNovoAno = () => {
    setFormData({
      ano: (parseInt(anosLectivos[0]?.ano || '2026') + 1).toString(),
      dataInicio: '',
      dataTermino: '',
      estado: 'Activo',
      isAnoActual: false,
      classesDisponiveis: [...todasClasses],
      turmasDisponiveis: [...todasTurmas],
      descricao: ''
    });
    setViewMode('novo');
    setEditMode(false);
  };

  const handleEditAno = (ano) => {
    const classesAtuais = ano.classesDisponiveis || [];
    const turmasAtuais = ano.turmasDisponiveis || [];

    const classesSincronizadas = classesAtuais.filter((c) =>
      todasClasses.includes(c)
    );
    const turmasSincronizadas = turmasAtuais.filter((t) =>
      todasTurmas.includes(t)
    );

    setFormData({
      ...ano,
      classesDisponiveis: classesSincronizadas,
      turmasDisponiveis: turmasSincronizadas,
    });
    setSelectedAno(ano);
    setViewMode('novo');
    setEditMode(true);
  };

  const handleBackToList = () => {
    setViewMode('lista');
    setSelectedAno(null);
    setEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleMultiSelect = (field, value) => {
    const current = formData[field] || [];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter(item => item !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleSincronizarClassesTurmas = () => {
    setFormData({
      ...formData,
      classesDisponiveis: [...todasClasses],
      turmasDisponiveis: [...todasTurmas],
    });
    mostrarAviso(
      'sucesso',
      `Sincronizado: ${todasClasses.length} classes e ${todasTurmas.length} turmas.`,
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.isAnoActual) {
      setAnoLectivoActual(formData.ano);
      setAnosLectivos(anosLectivos.map(a => ({
        ...a,
        isAnoActual: a.id === (editMode ? selectedAno.id : null) ? formData.isAnoActual : false
      })));
    }

    if (editMode) {
      setAnosLectivos(anosLectivos.map(a => 
        a.id === selectedAno.id ? { ...a, ...formData } : a
      ));
      mostrarAviso('sucesso', `Ano lectivo ${formData.ano} atualizado com sucesso!`);
    } else {
      const novoAno = {
        id: anosLectivos.length + 1,
        ...formData
      };
      setAnosLectivos([...anosLectivos, novoAno]);
      mostrarAviso('sucesso', `Ano lectivo ${formData.ano} cadastrado com sucesso!`);
    }
    setViewMode('lista');
    setEditMode(false);
  };

  // ✅ Substituído window.confirm por ConfirmModal
  const handleDefinirAnoActual = (ano) => {
    abrirConfirmacao({
      titulo: 'Confirmação',
      mensagem: `Deseja definir ${ano.ano} como o ano lectivo actual?`,
      textoConfirmar: 'Sim, definir',
      textoCancelar: 'Cancelar',
      onConfirm: () => {
        setAnoLectivoActual(ano.ano);
        setAnosLectivos(anosLectivos.map(a => ({
          ...a,
          isAnoActual: a.id === ano.id
        })));
        mostrarAviso('sucesso', `Ano lectivo ${ano.ano} definido como actual!`);
      },
    });
  };

  // ✅ Substituído window.confirm por ConfirmModal
  const handleAlternarEstado = (ano) => {
    const novoEstado = ano.estado === 'Activo' ? 'Encerrado' : 'Activo';
    const acao = novoEstado === 'Activo' ? 'reativar' : 'encerrar';

    abrirConfirmacao({
      titulo: 'Confirmação',
      mensagem: `Deseja ${acao} o ano lectivo ${ano.ano}?`,
      textoConfirmar: novoEstado === 'Activo' ? 'Sim, reativar' : 'Sim, encerrar',
      textoCancelar: 'Cancelar',
      onConfirm: () => {
        setAnosLectivos(anosLectivos.map(a => 
          a.id === ano.id ? { ...a, estado: novoEstado } : a
        ));
        mostrarAviso(
          'sucesso',
          `Ano lectivo ${ano.ano} ${novoEstado === 'Activo' ? 'reativado' : 'encerrado'} com sucesso!`,
        );
      },
    });
  };

  // ✅ Substituído window.confirm por ConfirmModal
  const handleDeleteAno = (ano) => {
    if (ano.isAnoActual) {
      mostrarAviso('erro', 'Não é possível excluir o ano lectivo actual!');
      return;
    }
    abrirConfirmacao({
      titulo: 'Confirmação',
      mensagem: `Tem certeza que deseja excluir o ano lectivo ${ano.ano}?`,
      textoConfirmar: 'Sim, excluir',
      textoCancelar: 'Cancelar',
      onConfirm: () => {
        setAnosLectivos(anosLectivos.filter(a => a.id !== ano.id));
        mostrarAviso('sucesso', `Ano lectivo ${ano.ano} excluído com sucesso!`);
      },
    });
  };

  const anosFiltrados = anosLectivos.filter(a => {
    const matchBusca = a.ano.includes(busca) || 
                       (a.descricao || '').toLowerCase().includes(busca.toLowerCase());
    const matchEstado = filterEstado === 'todos' || a.estado === filterEstado;
    return matchBusca && matchEstado;
  });

  const anosOrdenados = [...anosFiltrados].sort((a, b) => {
    if (a.isAnoActual) return -1;
    if (b.isAnoActual) return 1;
    return parseInt(b.ano) - parseInt(a.ano);
  });

  // ==================== VIEW: NOVO / EDITAR ====================
  if (viewMode === 'novo') {
    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              {editMode ? 'Editar Ano Lectivo' : 'Novo Ano Lectivo'}
            </h2>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Ano Lectivo</label>
                  <input
                    type="text"
                    name="ano"
                    value={formData.ano}
                    onChange={handleChange}
                    placeholder="Ex: 2026"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data de Início</label>
                  <input
                    type="date"
                    name="dataInicio"
                    value={formData.dataInicio}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data de Término</label>
                  <input
                    type="date"
                    name="dataTermino"
                    value={formData.dataTermino}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={formData.estado} onChange={handleChange}>
                    {estados.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isAnoActual"
                      checked={formData.isAnoActual}
                      onChange={handleChange}
                    />
                    Definir como Ano Lectivo Actual
                  </label>
                </div>
                <div className="form-group full-width">
                  <label>Descrição</label>
                  <textarea
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Descrição do ano lectivo"
                  />
                </div>
              </div>

              <div className="form-section aviso-ligacao">
                <FaInfoCircle className="aviso-icon" />
                <div className="aviso-content">
                  <strong>
                    <FaLink /> Ligado ao Módulo "Classes/Turmas"
                  </strong>
                  <p>
                    As classes e turmas disponíveis são geridas no módulo{' '}
                    <strong>Classes/Turmas</strong>. Adicione ou remova classes/turmas
                    lá para que apareçam aqui automaticamente.
                  </p>
                  <div className="aviso-actions">
                    <span className="aviso-count">
                      <FaSchool /> {todasClasses.length} classes
                    </span>
                    <span className="aviso-count">
                      <FaUsers /> {todasTurmas.length} turmas
                    </span>
                    <button
                      type="button"
                      className="btn-sync"
                      onClick={handleSincronizarClassesTurmas}
                      title="Sincronizar com Classes/Turmas"
                    >
                      <FaSync /> Sincronizar
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>
                  <FaSchool /> Classes Disponíveis
                  <small className="form-section-hint">
                    (vêm do módulo Classes/Turmas)
                  </small>
                </h3>
                {!temClasses ? (
                  <div className="empty-state-inline">
                    <FaInfoCircle />
                    <p>
                      Nenhuma classe cadastrada. Vá a{' '}
                      <strong>"Classes/Turmas"</strong> para adicionar.
                    </p>
                  </div>
                ) : (
                  <div className="multi-select-grid">
                    {todasClasses.map(cls => (
                      <label key={cls} className="multi-select-item">
                        <input
                          type="checkbox"
                          checked={(formData.classesDisponiveis || []).includes(cls)}
                          onChange={() => handleMultiSelect('classesDisponiveis', cls)}
                        />
                        <span>{cls}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-section">
                <h3>
                  <FaUsers /> Turmas Disponíveis
                  <small className="form-section-hint">
                    (vêm do módulo Classes/Turmas)
                  </small>
                </h3>
                {!temTurmas ? (
                  <div className="empty-state-inline">
                    <FaInfoCircle />
                    <p>
                      Nenhuma turma cadastrada. Vá a{' '}
                      <strong>"Classes/Turmas"</strong> para adicionar.
                    </p>
                  </div>
                ) : (
                  <div className="multi-select-grid">
                    {todasTurmas.map(turma => (
                      <label key={turma} className="multi-select-item">
                        <input
                          type="checkbox"
                          checked={(formData.turmasDisponiveis || []).includes(turma)}
                          onChange={() => handleMultiSelect('turmasDisponiveis', turma)}
                        />
                        <span>Turma {turma}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <FaSave /> {editMode ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" className="btn-cancel" onClick={handleBackToList}>
                  <FaTimes /> Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
        <AvisoModal aviso={aviso} onClose={fecharAviso} />
        <ConfirmModal
          confirmacao={confirmacao}
          onConfirm={confirmar}
          onCancel={fecharConfirmacao}
        />
      </>
    );
  }

  // ==================== VIEW: DETALHES ====================
  if (viewMode === 'detalhes' && selectedAno) {
    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              Detalhes do Ano Lectivo {selectedAno.ano}
            </h2>
            <div className="header-actions">
              <button className="btn-edit" onClick={() => handleEditAno(selectedAno)}>
                <FaEdit /> Editar
              </button>
            </div>
          </div>

          <div className="detalhes-container">
            <div className="detalhes-header">
              <div className="detalhes-ano">
                <h3>{selectedAno.ano}</h3>
                <div className="detalhes-badges">
                  <span className={`estado-badge ${selectedAno.estado.toLowerCase()}`}>
                    {selectedAno.estado}
                  </span>
                  {selectedAno.isAnoActual && (
                    <span className="ano-actual-badge">
                      <FaStar /> Ano Actual
                    </span>
                  )}
                </div>
              </div>
              <div className="detalhes-datas">
                <div className="data-item">
                  <FaCalendar /> Início: {new Date(selectedAno.dataInicio).toLocaleDateString('pt-AO')}
                </div>
                <div className="data-item">
                  <FaCalendarAlt /> Término: {new Date(selectedAno.dataTermino).toLocaleDateString('pt-AO')}
                </div>
              </div>
            </div>

            {selectedAno.descricao && (
              <div className="detalhes-descricao">
                <p>{selectedAno.descricao}</p>
              </div>
            )}

            <div className="detalhes-grid">
              <div className="detalhes-card">
                <h4><FaSchool /> Classes Disponíveis</h4>
                <div className="tags-container">
                  {selectedAno.classesDisponiveis && selectedAno.classesDisponiveis.length > 0 ? (
                    selectedAno.classesDisponiveis.map((cls, idx) => (
                      <span key={idx} className="tag-item classe-tag">
                        {cls}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted">Nenhuma classe disponível</p>
                  )}
                </div>
              </div>

              <div className="detalhes-card">
                <h4><FaUsers /> Turmas Disponíveis</h4>
                <div className="tags-container">
                  {selectedAno.turmasDisponiveis && selectedAno.turmasDisponiveis.length > 0 ? (
                    selectedAno.turmasDisponiveis.map((turma, idx) => (
                      <span key={idx} className="tag-item turma-tag">
                        Turma {turma}
                      </span>
                    ))
                  ) : (
                    <p className="text-muted">Nenhuma turma disponível</p>
                  )}
                </div>
              </div>
            </div>

            <div className="detalhes-actions">
              <button 
                className={`btn-toggle ${selectedAno.estado === 'Activo' ? 'btn-active' : 'btn-inactive'}`}
                onClick={() => handleAlternarEstado(selectedAno)}
              >
                {selectedAno.estado === 'Activo' ? <FaTimesCircle /> : <FaCheckCircle />}
                {selectedAno.estado === 'Activo' ? 'Encerrar Ano' : 'Reativar Ano'}
              </button>
              {!selectedAno.isAnoActual && (
                <button
                  className="btn-definir-actual"
                  onClick={() => handleDefinirAnoActual(selectedAno)}
                >
                  <FaStar /> Definir como Ano Actual
                </button>
              )}
            </div>
          </div>
        </div>
        <AvisoModal aviso={aviso} onClose={fecharAviso} />
        <ConfirmModal
          confirmacao={confirmacao}
          onConfirm={confirmar}
          onCancel={fecharConfirmacao}
        />
      </>
    );
  }

  // ==================== VIEW: LISTA ====================
  return (
    <>
      <div className="container">
        <div className="header">
          <h2 style={{fontWeight:'bold', fontSize:'32.5px'}}>Gestão de Anos Lectivos</h2>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por ano ou descrição..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Encerrado">Encerrado</option>
                <option value="Pendente">Pendente</option>
              </select>
            </div>
            <button className="btn-add" onClick={handleNovoAno}>
              <FaPlus /> Novo Ano Lectivo
            </button>
          </div>
        </div>

        <div className="info-banner">
          <FaInfoCircle />
          <div>
            <strong>Classes e Turmas são geridas no módulo "Classes/Turmas"</strong>
            <p>
              Este módulo usa automaticamente as classes ({todasClasses.length}) e
              turmas ({todasTurmas.length}) cadastradas em Classes/Turmas.
            </p>
          </div>
        </div>

        <div className="anos-grid">
          {anosOrdenados.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum ano lectivo encontrado</p>
            </div>
          ) : (
            anosOrdenados.map(ano => (
              <div key={ano.id} className={`ano-card ${ano.isAnoActual ? 'ano-actual' : ''}`}>
                <div className="ano-card-header">
                  <div className="ano-card-titulo">
                    <h3>{ano.ano}</h3>
                    {ano.isAnoActual && (
                      <span className="ano-actual-badge">
                        <FaStar /> Actual
                      </span>
                    )}
                  </div>
                  <span className={`estado-badge ${ano.estado.toLowerCase()}`}>
                    {ano.estado === 'Activo' ? <FaCheckCircle /> : <FaTimesCircle />}
                    {ano.estado}
                  </span>
                </div>

                <div className="ano-card-datas">
                  <div className="data-item">
                    <FaCalendar /> {new Date(ano.dataInicio).toLocaleDateString('pt-AO')}
                  </div>
                  <div className="data-item">
                    <FaCalendarAlt /> {new Date(ano.dataTermino).toLocaleDateString('pt-AO')}
                  </div>
                </div>

                <div className="ano-card-info">
                  <div className="info-item">
                    <FaSchool /> {ano.classesDisponiveis?.length || 0} classes
                  </div>
                  <div className="info-item">
                    <FaUsers /> {ano.turmasDisponiveis?.length || 0} turmas
                  </div>
                </div>

                {ano.descricao && (
                  <div className="ano-card-descricao">
                    {ano.descricao}
                  </div>
                )}

                <div className="ano-card-actions">
                  <button className="btn-view" onClick={() => handleViewAno(ano)}>
                    <FaEye /> Detalhes
                  </button>
                  <button className="btn-edit" onClick={() => handleEditAno(ano)}>
                    <FaEdit /> Editar
                  </button>
                  {!ano.isAnoActual && (
                    <>
                      <button 
                        className="btn-toggle" 
                        onClick={() => handleAlternarEstado(ano)}
                        title={ano.estado === 'Activo' ? 'Encerrar' : 'Reativar'}
                      >
                        {ano.estado === 'Activo' ? <FaTimesCircle /> : <FaCheckCircle />}
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDeleteAno(ano)}
                        title="Excluir"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                  {!ano.isAnoActual && ano.estado === 'Activo' && (
                    <button 
                      className="btn-definir-actual" 
                      onClick={() => handleDefinirAnoActual(ano)}
                      title="Definir como Ano Actual"
                    >
                      <FaStar />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="resumo-anos">
          <div className="resumo-item">
            <span className="label">Total de Anos:</span>
            <span className="value">{anosLectivos.length}</span>
          </div>
          <div className="resumo-item">
            <span className="label">Ano Actual:</span>
            <span className="value highlight">
              {anosLectivos.find(a => a.isAnoActual)?.ano || 'Nenhum'}
            </span>
          </div>
          <div className="resumo-item">
            <span className="label">Anos Activos:</span>
            <span className="value positive">{anosLectivos.filter(a => a.estado === 'Activo').length}</span>
          </div>
          <div className="resumo-item">
            <span className="label">Anos Encerrados:</span>
            <span className="value">{anosLectivos.filter(a => a.estado === 'Encerrado').length}</span>
          </div>
        </div>
      </div>

      {/* ✅ Modais */}
      <AvisoModal aviso={aviso} onClose={fecharAviso} />
      <ConfirmModal
        confirmacao={confirmacao}
        onConfirm={confirmar}
        onCancel={fecharConfirmacao}
      />
    </>
  );
};

export default AnoLectivo;