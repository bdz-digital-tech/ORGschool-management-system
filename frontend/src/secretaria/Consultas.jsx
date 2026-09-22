import React, { useState } from 'react';
import './Consultas.css';
import { useSchool } from '../context/SchoolContext';
import { 
  FaSearch, FaUser, FaUserGraduate, FaChalkboardTeacher,
  FaSchool, FaBook, FaUsers, FaDoorOpen,
  FaMoneyBill, FaUserPlus, FaUserMinus,
  FaChevronDown, FaChevronUp, FaArrowLeft, FaArrowRight,
  FaUserCheck, FaUserSlash, FaClock,
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

const Consultas = () => {
  const { alunos, classes, professores, pagamentos } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('todos');
  const [activeTab, setActiveTab] = useState('pesquisa');
  const [filterAlunos, setFilterAlunos] = useState('todos');
  const [expandedResults, setExpandedResults] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ✅ Estado do modal de aviso
  const [aviso, setAviso] = useState(null); // { tipo, titulo, mensagem }
  const mostrarAviso = (tipo, mensagem, titulo) =>
    setAviso({ tipo, mensagem, titulo });
  const fecharAviso = () => setAviso(null);

  const turmasFlat = classes.flatMap(c => 
    (c.turmas || []).map(t => ({ ...t, classe: c.nome }))
  );

  const getResultadosPesquisa = () => {
    if (!searchTerm.trim()) return { alunos: [], turmas: [], professores: [] };

    const term = searchTerm.toLowerCase().trim();
    let resultadosAlunos = [];
    let resultadosTurmas = [];
    let resultadosProfessores = [];

    if (searchType === 'todos' || searchType === 'alunos') {
      resultadosAlunos = alunos.filter(a =>
        a.nome.toLowerCase().includes(term) ||
        a.codigo.toLowerCase().includes(term) ||
        (a.encarregado && a.encarregado.toLowerCase().includes(term)) ||
        (a.classe && a.classe.toLowerCase().includes(term)) ||
        (a.turma && a.turma.toLowerCase().includes(term))
      );
    }

    if (searchType === 'todos' || searchType === 'turmas') {
      resultadosTurmas = turmasFlat.filter(t =>
        t.nome.toLowerCase().includes(term) ||
        t.classe.toLowerCase().includes(term) ||
        (t.professorResponsavel && t.professorResponsavel.toLowerCase().includes(term))
      );
    }

    if (searchType === 'todos' || searchType === 'professores') {
      resultadosProfessores = professores.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        p.codigo.toLowerCase().includes(term) ||
        (p.especialidade && p.especialidade.toLowerCase().includes(term))
      );
    }

    return { alunos: resultadosAlunos, turmas: resultadosTurmas, professores: resultadosProfessores };
  };

  const getAlunosFiltrados = () => {
    let filtered = [...alunos];

    switch (filterAlunos) {
      case 'activos':
        filtered = filtered.filter(a => a.estado === 'Ativo');
        break;
      case 'inactivos':
        filtered = filtered.filter(a => a.estado === 'Inativo');
        break;
      case 'matriculados':
        filtered = filtered.filter(a => a.estado === 'Ativo');
        break;
      case 'nao-matriculados':
        filtered = filtered.filter(a => a.estado !== 'Ativo');
        break;
      case 'pagamentos-pendentes':
        filtered = filtered.filter(a => pagamentos.some(p => p.alunoId === a.id && p.status === 'Pendente'));
        break;
      default:
        break;
    }

    return filtered;
  };

  const toggleExpand = (id) => {
    setExpandedResults(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const paginate = (items) => {
    const start = (currentPage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  };

  const totalPages = (items) => Math.ceil(items.length / itemsPerPage);

  const resultados = getResultadosPesquisa();
  const alunosFiltrados = getAlunosFiltrados();
  const totalAlunos = alunos.length;
  const totalAtivos = alunos.filter(a => a.estado === 'Ativo').length;
  const totalInativos = alunos.filter(a => a.estado === 'Inativo').length;

  return (
    <>
      <div className="consultas-container">
        <div className="consultas-header">
          <h2><span className="icon">🔍</span> Consultas</h2>
        </div>

        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'pesquisa' ? 'active' : ''}`}
            onClick={() => setActiveTab('pesquisa')}
          >
            <FaSearch /> Pesquisa Global
          </button>
          <button 
            className={`tab-btn ${activeTab === 'alunos' ? 'active' : ''}`}
            onClick={() => setActiveTab('alunos')}
          >
            <FaUserGraduate /> Controlo de Alunos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'turmas' ? 'active' : ''}`}
            onClick={() => setActiveTab('turmas')}
          >
            <FaSchool /> Controlo de Turmas
          </button>
        </div>

        {activeTab === 'pesquisa' && (
          <div className="pesquisa-container">
            <div className="search-box-global">
              <div className="search-input-group">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, código, turma, classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="search-type-group">
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="alunos">Alunos</option>
                  <option value="turmas">Turmas</option>
                  <option value="professores">Professores</option>
                </select>
              </div>
            </div>

            {searchTerm.trim() && (
              <div className="resultados-container">
                {resultados.alunos.length > 0 && (searchType === 'todos' || searchType === 'alunos') && (
                  <div className="resultado-grupo">
                    <h3><FaUserGraduate /> Alunos ({resultados.alunos.length})</h3>
                    <div className="resultado-lista">
                      {paginate(resultados.alunos).map(aluno => (
                        <div key={aluno.id} className="resultado-item aluno-item">
                          <div className="item-header" onClick={() => toggleExpand(`aluno-${aluno.id}`)}>
                            <div className="item-info">
                              <span className="item-nome">{aluno.nome}</span>
                              <span className="item-codigo">{aluno.codigo}</span>
                              <span className={`status-badge ${aluno.estado.toLowerCase()}`}>
                                {aluno.estado}
                              </span>
                            </div>
                            <div className="item-meta">
                              <span><FaBook /> {aluno.classe}</span>
                              <span><FaUsers /> Turma {aluno.turma}</span>
                              {expandedResults[`aluno-${aluno.id}`] ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                          </div>
                          {expandedResults[`aluno-${aluno.id}`] && (
                            <div className="item-detalhes">
                              <div className="detalhe-row">
                                <span className="label">Contacto:</span>
                                <span>{aluno.contacto || 'N/A'}</span>
                              </div>
                              <div className="detalhe-row">
                                <span className="label">Encarregado:</span>
                                <span>{aluno.encarregado || 'N/A'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultados.turmas.length > 0 && (searchType === 'todos' || searchType === 'turmas') && (
                  <div className="resultado-grupo">
                    <h3><FaSchool /> Turmas ({resultados.turmas.length})</h3>
                    <div className="resultado-lista">
                      {resultados.turmas.map(turma => (
                        <div key={turma.id} className="resultado-item turma-item">
                          <div className="item-header">
                            <div className="item-info">
                              <span className="item-nome">Turma {turma.nome}</span>
                              <span className="item-codigo">{turma.classe}</span>
                            </div>
                            <div className="item-meta">
                              <span><FaChalkboardTeacher /> {turma.professorResponsavel}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resultados.professores.length > 0 && (searchType === 'todos' || searchType === 'professores') && (
                  <div className="resultado-grupo">
                    <h3><FaChalkboardTeacher /> Professores ({resultados.professores.length})</h3>
                    <div className="resultado-lista">
                      {resultados.professores.map(prof => (
                        <div key={prof.id} className="resultado-item professor-item">
                          <div className="item-header">
                            <div className="item-info">
                              <span className="item-nome">{prof.nome}</span>
                              <span className="item-codigo">{prof.codigo}</span>
                            </div>
                            <div className="item-meta">
                              <span><FaBook /> {prof.especialidade}</span>
                              <span><FaUser /> {prof.contacto}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alunos' && (
          <div className="controle-alunos-container">
            <div className="filtros-alunos">
              <div className="filtro-group">
                <label>Filtrar por:</label>
                <select value={filterAlunos} onChange={(e) => setFilterAlunos(e.target.value)}>
                  <option value="todos">Todos os Alunos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>
            </div>

            <div className="controle-resumo">
              <div className="resumo-card">
                <FaUserGraduate />
                <div className="resumo-info">
                  <span className="resumo-valor">{totalAlunos}</span>
                  <span className="resumo-label">Total Alunos</span>
                </div>
              </div>
              <div className="resumo-card success">
                <FaUserCheck />
                <div className="resumo-info">
                  <span className="resumo-valor">{totalAtivos}</span>
                  <span className="resumo-label">Activos</span>
                </div>
              </div>
              <div className="resumo-card danger">
                <FaUserSlash />
                <div className="resumo-info">
                  <span className="resumo-valor">{totalInativos}</span>
                  <span className="resumo-label">Inactivos</span>
                </div>
              </div>
            </div>

            <div className="tabela-container">
              <div className="tabela-header">
                <span>Lista de Alunos</span>
                <span className="count">{alunosFiltrados.length} alunos</span>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nome</th>
                      <th>Classe</th>
                      <th>Turma</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosFiltrados.map(aluno => (
                      <tr key={aluno.id}>
                        <td><span className="codigo-badge">{aluno.codigo}</span></td>
                        <td><strong>{aluno.nome}</strong></td>
                        <td>{aluno.classe}</td>
                        <td><span className="turma-badge">{aluno.turma}</span></td>
                        <td>
                          <span className={`estado-badge ${aluno.estado.toLowerCase()}`}>
                            {aluno.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'turmas' && (
          <div className="controle-turmas-container">
            <div className="turmas-grid">
              {turmasFlat.map(turma => {
                const alunosAtuais = alunos.filter(a => a.turma === turma.nome && a.classe === turma.classe && a.estado === 'Ativo').length;
                const vagas = turma.capacidadeMaxima - alunosAtuais;
                return (
                  <div key={turma.id} className="turma-card">
                    <div className="turma-card-header">
                      <h3>Turma {turma.nome}</h3>
                      <span className={`status-badge ${vagas > 0 ? 'disponivel' : 'lotada'}`}>
                        {vagas > 0 ? 'Vagas Disponíveis' : 'Lotada'}
                      </span>
                    </div>
                    <div className="turma-card-body">
                      <div className="turma-info-row">
                        <span><FaBook /> {turma.classe}</span>
                        <span><FaClock /> {turma.turno}</span>
                        <span><FaDoorOpen /> {turma.sala}</span>
                      </div>
                      <div className="turma-info-row">
                        <span><FaChalkboardTeacher /> <strong>Professor:</strong> {turma.professorResponsavel}</span>
                      </div>
                      <div className="turma-estatisticas">
                        <div className="estatistica-item">
                          <span className="estatistica-valor">{alunosAtuais}</span>
                          <span className="estatistica-label">Alunos</span>
                        </div>
                        <div className="estatistica-item">
                          <span className="estatistica-valor">{turma.capacidadeMaxima}</span>
                          <span className="estatistica-label">Capacidade</span>
                        </div>
                        <div className="estatistica-item">
                          <span className="estatistica-valor">{vagas}</span>
                          <span className="estatistica-label">Vagas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Modal de aviso (substitui alert()) */}
      <AvisoModal aviso={aviso} onClose={fecharAviso} />
    </>
  );
};

export default Consultas;