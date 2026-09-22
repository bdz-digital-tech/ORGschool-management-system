import React, { useState } from 'react';
import './Alunos.css';
import { useSchool } from '../context/SchoolContext';
import {
  FaSearch, FaTimes, FaPhone,
  FaFile, FaUserGraduate, FaCheckCircle, FaUserSlash, FaArrowLeft,
  FaEnvelope, FaExclamationTriangle, FaInfoCircle as FaInfo
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

  const { titulo = "Confirmação", mensagem, textoConfirmar = "Sim", textoCancelar = "Não" } = confirmacao;

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

const Alunos = () => {
  const { alunos, setAlunos, classes: classesContexto, alterarEstadoAluno } = useSchool();
  const [viewMode, setViewMode] = useState('lista');
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroClasse, setFiltroClasse] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('');

  // ✅ Estado do modal de aviso
  const [aviso, setAviso] = useState(null); // { tipo, titulo, mensagem }
  const mostrarAviso = (tipo, mensagem, titulo) =>
    setAviso({ tipo, mensagem, titulo });
  const fecharAviso = () => setAviso(null);

  // ✅ Estado do modal de confirmação
  const [confirmacao, setConfirmacao] = useState(null);
  // { titulo, mensagem, textoConfirmar, textoCancelar, onConfirm }

  const abrirConfirmacao = (config) => setConfirmacao(config);
  const fecharConfirmacao = () => setConfirmacao(null);
  const confirmar = () => {
    const cb = confirmacao?.onConfirm;
    fecharConfirmacao();
    if (typeof cb === "function") cb();
  };

  const CLASSES_FALLBACK = ['1ª Classe', '2ª Classe', '3ª Classe', '4ª Classe', '5ª Classe', '6ª Classe', '7ª Classe', '8ª Classe', '9ª Classe'];
  const TURMAS_FALLBACK = ['A', 'B', 'C'];

  // Prioridade: classes/turmas reais da base de dados; só usa a lista fixa se ainda não houver nenhuma
  const classes = classesContexto && classesContexto.length > 0
    ? classesContexto.map((c) => c.nome)
    : CLASSES_FALLBACK;
  const turmas = classesContexto && classesContexto.length > 0
    ? [...new Set(classesContexto.flatMap((c) => (c.turmas || []).map((t) => t.nome)))]
    : TURMAS_FALLBACK;

  const handleViewAluno = (aluno) => {
    setSelectedAluno(aluno);
    setViewMode('perfil');
  };

  const handleBackToList = () => {
    setViewMode('lista');
    setSelectedAluno(null);
  };

  // ✅ Agora usa o ConfirmModal em vez de window.confirm
  const handleDesativarAluno = (aluno) => {
    const acao = aluno.estado === 'Ativo' ? 'desativar' : 'reativar';
    const novoEstado = aluno.estado === 'Ativo' ? 'Inativo' : 'Ativo';

    abrirConfirmacao({
      titulo: 'Confirmação',
      mensagem: `Tem certeza que deseja ${acao} o aluno "${aluno.nome}"?`,
      textoConfirmar: acao === 'desativar' ? 'Sim, desativar' : 'Sim, reativar',
      textoCancelar: 'Cancelar',
      onConfirm: async () => {
        const resultado = await alterarEstadoAluno(aluno.id, novoEstado);
        if (!resultado.success) {
          mostrarAviso(
            'erro',
            `Não foi possível alterar o estado: ${resultado.message}`,
          );
          return;
        }
        if (selectedAluno && selectedAluno.id === aluno.id) {
          setSelectedAluno({ ...selectedAluno, estado: novoEstado });
        }
        mostrarAviso(
          'sucesso',
          `Aluno ${aluno.nome} foi ${novoEstado === 'Ativo' ? 'reativado' : 'desativado'} com sucesso!`,
        );
      },
    });
  };

  const handleClearFilters = () => {
    setFiltroClasse('');
    setFiltroTurma('');
    setBusca('');
  };

  const alunosFiltrados = alunos.filter(aluno => {
    const matchBusca =
      aluno.nome.toLowerCase().includes(busca.toLowerCase()) ||
      aluno.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      (aluno.encarregado && aluno.encarregado.toLowerCase().includes(busca.toLowerCase()));

    const matchClasse = filtroClasse ? aluno.classe === filtroClasse : true;
    const matchTurma = filtroTurma ? aluno.turma === filtroTurma : true;

    return matchBusca && matchClasse && matchTurma;
  });

  if (viewMode === 'perfil' && selectedAluno) {
    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              Perfil do Aluno
            </h2>
            <div className="header-actions">
              <button className="btn-delete" onClick={() => handleDesativarAluno(selectedAluno)}>
                {selectedAluno.estado === 'Ativo' ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </div>

          <div className="perfil-container">
            <div className="perfil-header">
              <div className="perfil-avatar">
                <FaUserGraduate size={60} />
              </div>
              <div className="perfil-info">
                <h3>{selectedAluno.nome}</h3>
                <div className="perfil-badges">
                  <span className={`estado-badge ${selectedAluno.estado.toLowerCase()}`}>
                    {selectedAluno.estado}
                  </span>
                  <span className="turma-badge">Turma {selectedAluno.turma}</span>
                  <span className="classe-badge">{selectedAluno.classe}</span>
                </div>
                <div className="perfil-contactos">
                  <span><FaPhone /> {selectedAluno.contacto || 'N/A'}</span>
                  <span><FaEnvelope /> {selectedAluno.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="perfil-content">
              <div className="perfil-sidebar">
                <div className="perfil-card">
                  <h4>Dados Pessoais</h4>
                  <div className="perfil-field">
                    <label>Código:</label>
                    <span>{selectedAluno.codigo}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Sexo:</label>
                    <span>{selectedAluno.sexo || 'N/A'}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Data Nascimento:</label>
                    <span>{selectedAluno.dataNascimento ? new Date(selectedAluno.dataNascimento).toLocaleDateString('pt-AO') : 'N/A'}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Data Matrícula:</label>
                    <span>{selectedAluno.dataMatricula ? new Date(selectedAluno.dataMatricula).toLocaleDateString('pt-AO') : 'N/A'}</span>
                  </div>
                </div>

                <div className="perfil-card">
                  <h4>Encarregado</h4>
                  <div className="perfil-field">
                    <label>Nome:</label>
                    <span>{selectedAluno.encarregado || 'N/A'}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Parentesco:</label>
                    <span>{selectedAluno.parentesco || 'N/A'}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Contacto:</label>
                    <span>{selectedAluno.contactoEncarregado || 'N/A'}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Email:</label>
                    <span>{selectedAluno.emailEncarregado || 'N/A'}</span>
                  </div>
                </div>

                <div className="perfil-card">
                  <h4>Dados Académicos</h4>
                  <div className="perfil-field">
                    <label>Turma:</label>
                    <span>{selectedAluno.turma}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Classe:</label>
                    <span>{selectedAluno.classe}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Ano Lectivo:</label>
                    <span>{selectedAluno.anoLectivo}</span>
                  </div>
                </div>
              </div>

              <div className="perfil-main">
                <div className="perfil-card">
                  <h4>Documentos</h4>
                  <div className="documentos-list">
                    {selectedAluno.documentos && selectedAluno.documentos.length > 0 ? (
                      selectedAluno.documentos.map((doc, idx) => (
                        <div key={idx} className="documento-item">
                          <FaFile /> {doc}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">Nenhum documento cadastrado</p>
                    )}
                  </div>
                </div>

                <div className="perfil-card">
                  <h4>Pagamentos</h4>
                  <div className="pagamentos-list">
                    {selectedAluno.pagamentos && selectedAluno.pagamentos.length > 0 ? (
                      <table className="pagamentos-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Referência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAluno.pagamentos.map((p, idx) => (
                            <tr key={idx}>
                              <td>{new Date(p.data).toLocaleDateString('pt-AO')}</td>
                              <td>Kz {Number(p.valor).toLocaleString()}</td>
                              <td>
                                <span className={`estado-badge ${p.status.toLowerCase()}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td><span className="codigo-badge">{p.referencia || 'N/A'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-muted">Nenhum pagamento registrado</p>
                    )}
                  </div>
                </div>

                <div className="perfil-card">
                  <h4>Histórico de Actividades</h4>
                  <div className="historico-list">
                    {selectedAluno.historico && selectedAluno.historico.length > 0 ? (
                      selectedAluno.historico.map((h, idx) => (
                        <div key={idx} className="historico-item">
                          <div className="historico-data">
                            {new Date(h.data).toLocaleDateString('pt-AO')}
                          </div>
                          <div className="historico-detalhes">
                            <strong>{h.acao}</strong>
                            <span>{h.detalhes}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">Nenhuma actividade registrada</p>
                    )}
                  </div>
                </div>
              </div>
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

  return (
    <>
      <div className="container">
        <div className="header">
          <h2>Gestão de Alunos</h2>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome, código ou encarregado..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <div className="table-title">
              <span>Lista de Alunos</span>
              <span className="count">{alunosFiltrados.length} alunos</span>
            </div>
            <div className="filter-actions">
              <div className="filter-group">
                <select
                  className="filter-select"
                  value={filtroClasse}
                  onChange={(e) => setFiltroClasse(e.target.value)}
                >
                  <option value="">Todas as Classes</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="filter-select"
                  value={filtroTurma}
                  onChange={(e) => setFiltroTurma(e.target.value)}
                >
                  <option value="">Todas as Turmas</option>
                  {turmas.map(t => <option key={t} value={t}>Turma {t}</option>)}
                </select>
                {(filtroClasse || filtroTurma || busca) && (
                  <button className="btn-clear-filters" onClick={handleClearFilters}>
                    <FaTimes /> Limpar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Turma</th>
                  <th>Classe</th>
                  <th>Ano Lectivo</th>
                  <th>Estado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-message">
                      Nenhum aluno encontrado
                    </td>
                  </tr>
                ) : (
                  alunosFiltrados.map(aluno => (
                    <tr
                      key={aluno.id}
                      className="clickable-row"
                      onClick={() => handleViewAluno(aluno)}
                    >
                      <td><span className="codigo-badge">{aluno.codigo}</span></td>
                      <td><strong>{aluno.nome}</strong></td>
                      <td><span className="turma-badge">{aluno.turma}</span></td>
                      <td>{aluno.classe}</td>
                      <td>{aluno.anoLectivo}</td>
                      <td>
                        <span className={`estado-badge ${aluno.estado.toLowerCase()}`}>
                          {aluno.estado}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDesativarAluno(aluno);
                          }}
                          title={aluno.estado === 'Ativo' ? 'Desativar' : 'Reativar'}
                        >
                          {aluno.estado === 'Ativo' ? <FaUserSlash /> : <FaCheckCircle />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

export default Alunos;