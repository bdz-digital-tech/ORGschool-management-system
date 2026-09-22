import React, { useState } from 'react';
import './ClassesTurmas.css';
import { useSchool } from '../context/SchoolContext';
import { 
  FaSearch, FaPlus, FaSave, FaTimes, 
  FaSchool, FaUsers, FaClock, FaBuilding,
  FaChalkboardTeacher, FaUserCheck, FaUserTimes,
  FaArrowLeft, FaDoorOpen,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle as FaInfo
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

const ClassesTurmas = () => {
  // Usando o contexto para aceder aos dados
  const { 
    alunos, 
    setAlunos, 
    professores,
    classes,
    setClasses,
    adicionarClasse,
    atualizarClasse,
    eliminarClasse,
    adicionarTurma,
    atualizarTurma,
    eliminarTurma,
  } = useSchool();

  const [viewMode, setViewMode] = useState('lista');
  const [aEnviar, setAEnviar] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [busca, setBusca] = useState('');
  const [editMode, setEditMode] = useState(false);

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

  const [classeForm, setClasseForm] = useState({
    nome: '',
    anoLectivo: '2026'
  });

  const [turmaForm, setTurmaForm] = useState({
    nome: '',
    classe: '',
    turno: '',
    sala: '',
    professorResponsavel: '',
    capacidadeMaxima: 30
  });

  const turnos = ['Manhã', 'Tarde', 'Noite'];

  const handleViewTurma = (classe, turma) => {
    setSelectedClasse(classe);
    setSelectedTurma(turma);
    setViewMode('alunosTurma');
  };

  const handleNovaClasse = () => {
    setClasseForm({ nome: '', anoLectivo: '2026' });
    setViewMode('novaClasse');
    setEditMode(false);
  };

  const handleEditClasse = (classe) => {
    setClasseForm({ nome: classe.nome, anoLectivo: classe.anoLectivo });
    setSelectedClasse(classe);
    setViewMode('novaClasse');
    setEditMode(true);
  };

  const handleNovaTurma = (classe) => {
    setSelectedClasse(classe);
    setTurmaForm({
      nome: '',
      classe: classe.nome,
      turno: '',
      sala: '',
      professorResponsavel: professores && professores.length > 0 ? professores[0]?.nome : '',
      capacidadeMaxima: 30
    });
    setViewMode('novaTurma');
    setEditMode(false);
  };

  const handleEditTurma = (classe, turma) => {
    setSelectedClasse(classe);
    setSelectedTurma(turma);
    setTurmaForm({ ...turma });
    setViewMode('novaTurma');
    setEditMode(true);
  };

  const handleBackToList = () => {
    setViewMode('lista');
    setSelectedClasse(null);
    setSelectedTurma(null);
    setEditMode(false);
  };

  const handleClasseChange = (e) => {
    const { name, value } = e.target;
    setClasseForm({ ...classeForm, [name]: value });
  };

  const handleTurmaChange = (e) => {
    const { name, value } = e.target;
    setTurmaForm({ ...turmaForm, [name]: value });
  };

  const handleSubmitClasse = async (e) => {
    e.preventDefault();
    setAEnviar(true);

    const resultado = editMode
      ? await atualizarClasse(selectedClasse.id, classeForm)
      : await adicionarClasse(classeForm);

    setAEnviar(false);

    if (!resultado.success) {
      mostrarAviso(
        'erro',
        `Não foi possível gravar a classe: ${resultado.message}`,
      );
      return;
    }

    mostrarAviso(
      'sucesso',
      `Classe ${classeForm.nome} ${editMode ? 'atualizada' : 'cadastrada'} com sucesso!`,
    );

    setViewMode('lista');
    setEditMode(false);
  };

  const handleSubmitTurma = async (e) => {
    e.preventDefault();
    setAEnviar(true);

    // O professor responsável é opcional — resolve o nome escolhido para o respectivo id
    const professorEncontrado = (professores || []).find(
      (p) => p.nome === turmaForm.professorResponsavel
    );
    const dadosTurma = {
      ...turmaForm,
      professorResponsavelId: professorEncontrado ? professorEncontrado.id : null,
    };

    const resultado = editMode
      ? await atualizarTurma(selectedClasse.id, selectedTurma.id, dadosTurma)
      : await adicionarTurma(selectedClasse.id, dadosTurma);

    setAEnviar(false);

    if (!resultado.success) {
      mostrarAviso(
        'erro',
        `Não foi possível gravar a turma: ${resultado.message}`,
      );
      return;
    }

    mostrarAviso(
      'sucesso',
      `Turma ${turmaForm.nome} ${editMode ? 'atualizada' : 'cadastrada'} com sucesso!`,
    );

    setViewMode('lista');
    setEditMode(false);
  };

  // ✅ Substituído window.confirm por ConfirmModal
  const handleToggleEstadoAluno = (alunoId, estadoAtual, alunoNome) => {
    const novoEstado = estadoAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    const acaoTexto = novoEstado === 'Ativo' ? 'ativar' : 'inativar';

    abrirConfirmacao({
      titulo: 'Confirmação',
      mensagem: alunoNome
        ? `Tem certeza que deseja ${acaoTexto} o aluno "${alunoNome}"?`
        : `Tem certeza que deseja ${acaoTexto} o estado deste aluno?`,
      textoConfirmar: novoEstado === 'Ativo' ? 'Sim, ativar' : 'Sim, inativar',
      textoCancelar: 'Cancelar',
      onConfirm: () => {
        setAlunos(alunos.map(a => 
          a.id === alunoId ? { ...a, estado: novoEstado } : a
        ));
        mostrarAviso(
          'sucesso',
          `Aluno ${novoEstado === 'Ativo' ? 'ativado' : 'inativado'} com sucesso!`,
        );
      },
    });
  };

  // ✅ Substituído window.confirm por ConfirmModal
  const handleEliminarClasse = (classe) => {
    abrirConfirmacao({
      titulo: 'Confirmação',
      mensagem: `Tem certeza que deseja eliminar a classe "${classe.nome}"?`,
      textoConfirmar: 'Sim, eliminar',
      textoCancelar: 'Cancelar',
      onConfirm: async () => {
        const resultado = await eliminarClasse(classe.id);
        if (!resultado.success) {
          mostrarAviso(
            'erro',
            `Não foi possível eliminar a classe: ${resultado.message}`,
          );
          return;
        }
        mostrarAviso(
          'sucesso',
          `Classe ${classe.nome} eliminada com sucesso!`,
        );
      },
    });
  };

  // ✅ Substituído window.confirm por ConfirmModal
  const handleEliminarTurma = (classe, turma) => {
    abrirConfirmacao({
      titulo: 'Confirmação',
      mensagem: `Tem certeza que deseja eliminar a turma "${turma.nome}" da classe "${classe.nome}"?`,
      textoConfirmar: 'Sim, eliminar',
      textoCancelar: 'Cancelar',
      onConfirm: async () => {
        const resultado = await eliminarTurma(classe.id, turma.id);
        if (!resultado.success) {
          mostrarAviso(
            'erro',
            `Não foi possível eliminar a turma: ${resultado.message}`,
          );
          return;
        }
        mostrarAviso(
          'sucesso',
          `Turma ${turma.nome} eliminada com sucesso!`,
        );
      },
    });
  };

  const classesFiltradas = classes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.anoLectivo.includes(busca)
  );

  if (viewMode === 'novaClasse') {
    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              {editMode ? 'Editar Classe' : 'Nova Classe'}
            </h2>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmitClasse}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome da Classe *</label>
                  <input
                    type="text"
                    name="nome"
                    value={classeForm.nome}
                    onChange={handleClasseChange}
                    placeholder="Ex: 6ª Classe"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ano Lectivo *</label>
                  <input
                    type="text"
                    name="anoLectivo"
                    value={classeForm.anoLectivo}
                    onChange={handleClasseChange}
                    placeholder="2026"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={aEnviar}>
                  <FaSave /> {aEnviar ? 'A gravar...' : (editMode ? 'Atualizar' : 'Cadastrar')}
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

  if (viewMode === 'novaTurma') {
    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              {editMode ? 'Editar Turma' : 'Nova Turma'} - {selectedClasse?.nome}
            </h2>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmitTurma}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome da Turma *</label>
                  <input
                    type="text"
                    name="nome"
                    value={turmaForm.nome}
                    onChange={handleTurmaChange}
                    placeholder="Ex: A, B, C..."
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Classe</label>
                  <input
                    type="text"
                    value={turmaForm.classe}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Turno *</label>
                  <select name="turno" value={turmaForm.turno} onChange={handleTurmaChange} required>
                    <option value="">Selecione</option>
                    {turnos.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sala *</label>
                  <input
                    type="text"
                    name="sala"
                    value={turmaForm.sala}
                    onChange={handleTurmaChange}
                    placeholder="Ex: Sala 101"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Professor Responsável</label>
                  <select name="professorResponsavel" value={turmaForm.professorResponsavel} onChange={handleTurmaChange}>
                    <option value="">Sem professor atribuído</option>
                    {professores && professores.map(p => (
                      <option key={p.id} value={p.nome}>
                        {p.nome} {p.especialidade ? `(${p.especialidade.join(', ')})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Capacidade Máxima *</label>
                  <input
                    type="number"
                    name="capacidadeMaxima"
                    value={turmaForm.capacidadeMaxima}
                    onChange={handleTurmaChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={aEnviar}>
                  <FaSave /> {aEnviar ? 'A gravar...' : (editMode ? 'Atualizar' : 'Cadastrar')}
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

  if (viewMode === 'alunosTurma' && selectedTurma) {
    // ✅ Filtra alunos por nome OU id da turma/classe (robusto)
    const alunosDaTurma = alunos.filter(a => {
      const mesmaTurma =
        a.turma === selectedTurma.nome || a.turmaId === selectedTurma.id;
      const mesmaClasse =
        a.classe === selectedClasse?.nome ||
        a.classe === selectedTurma.classeNome ||
        a.classeId === selectedClasse?.id ||
        a.classeId === selectedTurma.classeId;
      return mesmaTurma && mesmaClasse;
    });

    const alunosAtivosCount = alunosDaTurma.filter(a => a.estado === 'Ativo').length;
    const vagas = selectedTurma.capacidadeMaxima - alunosAtivosCount;

    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              {selectedClasse?.nome} - Turma {selectedTurma.nome}
            </h2>
          </div>

          <div className="turma-info-cards">
            <div className="info-card">
              <FaSchool /> <span>Classe: {selectedClasse?.nome}</span>
            </div>
            <div className="info-card">
              <FaClock /> <span>Turno: {selectedTurma.turno}</span>
            </div>
            <div className="info-card">
              <FaBuilding /> <span>Sala: {selectedTurma.sala}</span>
            </div>
            <div className="info-card">
              <FaChalkboardTeacher /> <span>Professor: {selectedTurma.professorResponsavel || 'Sem professor atribuído'}</span>
            </div>
            <div className="info-card">
              <FaUsers /> <span>Alunos Ativos: {alunosAtivosCount}/{selectedTurma.capacidadeMaxima}</span>
            </div>
            <div className="info-card">
              <FaDoorOpen /> <span>Vagas: {vagas}</span>
            </div>
          </div>

          <div className="table-container">
            <div className="table-header">
              <div className="table-title">
                <span>Lista de Alunos da Turma</span>
                <span className="count">{alunosDaTurma.length} registos</span>
              </div>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nome</th>
                    <th>Sexo</th>
                    <th>Estado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosDaTurma.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-message">
                        Nenhum aluno nesta turma (Inscreva via formulário de matrícula)
                      </td>
                    </tr>
                  ) : (
                    alunosDaTurma.map(aluno => (
                      <tr key={aluno.id}>
                        <td><span className="codigo-badge">{aluno.codigo || `AL-${String(aluno.id).padStart(4, '0')}`}</span></td>
                        <td><strong>{aluno.nome}</strong></td>
                        <td>{aluno.sexo || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${aluno.estado === 'Ativo' ? 'disponivel' : 'lotada'}`}>
                            {aluno.estado || 'Ativo'}
                          </span>
                        </td>
                        <td className="actions">
                          <button 
                            className={aluno.estado === 'Ativo' ? 'btn-delete' : 'btn-save'} 
                            onClick={() => handleToggleEstadoAluno(
                              aluno.id,
                              aluno.estado || 'Ativo',
                              aluno.nome
                            )}
                            title={aluno.estado === 'Ativo' ? 'Inativar Aluno' : 'Ativar Aluno'}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {aluno.estado === 'Ativo' ? <FaUserTimes /> : <FaUserCheck />}
                            {aluno.estado === 'Ativo' ? 'Inativar' : 'Ativar'}
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
        <AvisoModal aviso={aviso} onClose={fecharAviso} />
        <ConfirmModal
          confirmacao={confirmacao}
          onConfirm={confirmar}
          onCancel={fecharConfirmacao}
        />
      </>
    );
  }

  // View: Lista de Classes e Turmas
  return (
    <>
      <div className="container">
        <div className="header">
          <h2 style={{fontWeight:'bold',fontSize:'32.5px'}}>Classes e Turmas</h2>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por classe ou ano lectivo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button className="btn-add" onClick={handleNovaClasse}>
              <FaPlus /> Nova Classe
            </button>
          </div>
        </div>

        {classesFiltradas.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma classe encontrada</p>
          </div>
        ) : (
          classesFiltradas.map(classe => (
            <div key={classe.id} className="classe-card">
              <div className="classe-header">
                <div className="classe-info">
                  <h3>{classe.nome}</h3>
                  <span className="ano-badge">{classe.anoLectivo}</span>
                  <span className="turmas-count">{classe.turmas ? classe.turmas.length : 0} turmas</span>
                </div>
                <div className="classe-actions">
                  <button className="btn-edit" onClick={() => handleEditClasse(classe)}>
                    Editar
                  </button>
                  <button className="btn-delete" onClick={() => handleEliminarClasse(classe)}>
                    Eliminar
                  </button>
                  <button className="btn-add" onClick={() => handleNovaTurma(classe)}>
                    Nova Turma
                  </button>
                </div>
              </div>

              <div className="turmas-grid">
                {!classe.turmas || classe.turmas.length === 0 ? (
                  <div className="empty-turmas">
                    <p>Nenhuma turma cadastrada</p>
                  </div>
                ) : (
                  classe.turmas.map(turma => {
                    // ✅ Contagem robusta: nome OU id
                    const alunosNaTurmaAtivos = alunos.filter(a => {
                      const mesmaTurma =
                        a.turma === turma.nome || a.turmaId === turma.id;
                      const mesmaClasse =
                        a.classe === classe.nome ||
                        a.classe === turma.classeNome ||
                        a.classeId === classe.id;
                      return mesmaTurma && mesmaClasse && a.estado === 'Ativo';
                    }).length;

                    const capacidade = turma.capacidadeMaxima || 30;
                    const temVagas = alunosNaTurmaAtivos < capacidade;

                    return (
                      <div key={turma.id} className="turma-card">
                        <div className="turma-card-header" style={{display:'flex',gap:'15px', justifyContent:'space-between'}}>
                          <h4>Turma {turma.nome}</h4>
                          <span className={`status-badge ${temVagas ? 'disponivel' : 'lotada'}`}>
                            {temVagas ? 'Vagas disponíveis' : 'Lotada'}
                          </span>
                        </div>
                        <div className="turma-detalhes">
                          <div className="detalhe-item">
                            {turma.turno || 'Sem turno'}
                          </div>
                          <div className="detalhe-item">Sala : {turma.sala || 'N/A'}
                          </div>
                          <div className="detalhe-item">Prof : {turma.professorResponsavel || 'Sem professor'}
                          </div>
                          <div className="detalhe-item">
                            Cap : {alunosNaTurmaAtivos}/{capacidade}
                          </div>
                        </div>
                        <div className="turma-actions">
                          <button 
                            className="btn-view" 
                            onClick={() => handleViewTurma(classe, turma)}
                          >
                             Ver Alunos
                          </button>
                          <button 
                            className="btn-edit" 
                            onClick={() => handleEditTurma(classe, turma)}
                          >
                          Editar
                          </button>
                          <button 
                            className="btn-delete" 
                            onClick={() => handleEliminarTurma(classe, turma)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
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

export default ClassesTurmas;