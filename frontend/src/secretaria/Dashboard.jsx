import React, { useState, useMemo } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useSchool } from "../context/SchoolContext";
import { useAuth } from "../context/AuthContext";
import {
  FaUserGraduate,
  FaUsers,
  FaIdBadge,
  FaCoins,
  FaHandHoldingUsd,
  FaChalkboardTeacher,
  FaThLarge,
  FaBookOpen,
  FaSchool,
  FaCalendarAlt,
  FaBullhorn,
  FaSearch,
  FaChartBar,
  FaChevronRight,
  FaChevronLeft,
  FaUserCircle,
  FaCheckCircle,
  FaUserTimes,
  FaBuilding,
  FaClock,
  FaInfoCircle,
  FaUserCheck,
  FaSignOutAlt,
  FaUserShield,
  FaExclamationTriangle,
  FaInfoCircle as FaInfo,
} from "react-icons/fa";
import { BiCreditCard } from "react-icons/bi";
import logo from "../assets/LUKI B.png";

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

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    alunos,
    professores,
    matriculas,
    classes,
    anosLectivos,
    anoLectivoActual,
    confirmacoes,
    comunicados,
    pagamentos,
  } = useSchool();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ Estado do modal de aviso
  const [aviso, setAviso] = useState(null); // { tipo, titulo, mensagem }
  const mostrarAviso = (tipo, mensagem, titulo) =>
    setAviso({ tipo, mensagem, titulo });
  const fecharAviso = () => setAviso(null);

  // Cálculo de estatísticas
  const totalAlunos = alunos.length;
  const alunosAtivos = alunos.filter((a) => a.estado === "Ativo").length;
  const alunosInativos = alunos.filter((a) => a.estado === "Inativo").length;
  const matriculados = matriculas.filter((m) => m.estado === "Ativa").length;
  const totalTurmas = classes.reduce(
    (acc, c) => acc + (c.turmas?.length || 0),
    0,
  );

  const todosPagamentos = alunos.flatMap((aluno) =>
    (aluno.pagamentos || []).map((p) => ({
      ...p,
      alunoId: aluno.id,
      alunoNome: aluno.nome,
    })),
  );

  const pagamentosPendentes = todosPagamentos.filter(
    (p) => p.status === "Pendente",
  );
  const totalPendentes = pagamentosPendentes.reduce(
    (sum, p) => sum + p.valor,
    0,
  );

  const hoje = new Date();
  const semanaPassada = new Date(hoje);
  semanaPassada.setDate(hoje.getDate() - 7);

  const pagamentosRecentes = todosPagamentos.filter((p) => {
    const data = new Date(p.data);
    return data >= semanaPassada && data <= hoje && p.status === "Confirmado";
  });
  const totalPagamentosRecentes = pagamentosRecentes.reduce(
    (sum, p) => sum + Number(p.valor),
    0,
  );
  const totalTransacoesRecentes = pagamentosRecentes.length;

  const confirmacoesPendentes = confirmacoes.filter(
    (c) => c.status === "Pendente",
  );

  const comunicadosRecentes = [...comunicados]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .slice(0, 5);

  const atividadesRecentes = useMemo(() => {
    const atividades = [];

    const matriculasRecentes = [...matriculas]
      .sort((a, b) => new Date(b.dataMatricula) - new Date(a.dataMatricula))
      .slice(0, 3);

    matriculasRecentes.forEach((m) => {
      const aluno = alunos.find((a) => a.id === m.alunoId);
      if (aluno) {
        atividades.push({
          id: `mat-${m.id}`,
          titulo: "Nova Matrícula Registada",
          descricao: `${aluno.nome} - ${m.classe} Turma ${m.turma}`,
          tempo: new Date(m.dataMatricula).toLocaleDateString("pt-AO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          icone: FaBookOpen,
          cor: "#3498db",
        });
      }
    });

    const pagamentosRecentesList = todosPagamentos
      .filter((p) => p.status === "Confirmado")
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 3);

    pagamentosRecentesList.forEach((p) => {
      atividades.push({
        id: `pag-${p.id}`,
        titulo: "Pagamento Confirmado",
        descricao: `${p.alunoNome} - ${p.tipo} (Kz ${p.valor.toLocaleString()})`,
        tempo: new Date(p.data).toLocaleDateString("pt-AO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        icone: FaCoins,
        cor: "#2ecc71",
      });
    });

    const confirmacoesRecentes = [...confirmacoes]
      .filter((c) => c.status === "Confirmado")
      .sort(
        (a, b) =>
          new Date(b.dataConfirmacao || "") - new Date(a.dataConfirmacao || ""),
      )
      .slice(0, 3);

    confirmacoesRecentes.forEach((c) => {
      const aluno = alunos.find((a) => a.id === c.alunoId);
      if (aluno) {
        atividades.push({
          id: `conf-${c.id}`,
          titulo: "Reconfirmação Efetuada",
          descricao: `${aluno.nome} - ${c.novaClasse} Turma ${c.novaTurma} (${c.novoAnoLectivo})`,
          tempo: c.dataConfirmacao
            ? new Date(c.dataConfirmacao).toLocaleDateString("pt-AO", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Recentemente",
          icone: FaUserCheck,
          cor: "#9b59b6",
        });
      }
    });

    comunicadosRecentes.forEach((c) => {
      atividades.push({
        id: `com-${c.id}`,
        titulo: "Novo Comunicado",
        descricao: `${c.titulo} - ${c.destinatario || "Todos"}`,
        tempo: new Date(c.data).toLocaleDateString("pt-AO", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        icone: FaBullhorn,
        cor: "#e67e22",
      });
    });

    return atividades
      .sort((a, b) => {
        const getDate = (str) => {
          const match = str.match(/(\d{2})\s+(\w+)\s+(\d{4})/);
          if (match) {
            const meses = {
              Jan: 0,
              Fev: 1,
              Mar: 2,
              Abr: 3,
              Mai: 4,
              Jun: 5,
              Jul: 6,
              Ago: 7,
              Set: 8,
              Out: 9,
              Nov: 10,
              Dez: 11,
            };
            return new Date(
              parseInt(match[3]),
              meses[match[2]] || 0,
              parseInt(match[1]),
            );
          }
          return new Date(0);
        };
        return getDate(b.tempo) - getDate(a.tempo);
      })
      .slice(0, 10);
  }, [matriculas, todosPagamentos, confirmacoes, comunicadosRecentes, alunos]);

  const stats = [
    {
      icon: FaUserGraduate,
      label: "Total alunos",
      value: totalAlunos.toString(),
      sub: `${alunosAtivos} ativos, ${alunosInativos} inativos`,
      subIcon: FaUserTimes,
      subColor: "#e74c3c",
    },
    {
      icon: FaChalkboardTeacher,
      label: "Professores",
      value: professores.length.toString(),
      sub: `${professores.filter((p) => p.estado === "Ativo").length} ativos`,
      subIcon: FaCheckCircle,
      subColor: "#2ecc71",
    },
    {
      icon: FaIdBadge,
      label: "Matriculados",
      value: matriculados.toString(),
      sub: `${((matriculados / (totalAlunos || 1)) * 100).toFixed(1)}% do total`,
      subIcon: FaCheckCircle,
      subColor: "#7a9a7a",
    },
    {
      icon: FaSchool,
      label: "Classes e Turmas",
      value: `${classes.length} Classes`,
      sub: `${totalTurmas} turmas ativas`,
      subIcon: FaBuilding,
      subColor: "#3498db",
    },
    {
      icon: FaCoins,
      label: "Pagamentos (últimos 7 dias)",
      value: `Kz ${totalPagamentosRecentes.toLocaleString()}`,
      sub: `${totalTransacoesRecentes} transações`,
      subIcon: BiCreditCard,
      subColor: "#2ecc71",
    },
    {
      icon: FaHandHoldingUsd,
      label: "Pagamentos pendentes",
      value: `Kz ${totalPendentes.toLocaleString()}`,
      sub: `${pagamentosPendentes.length} faturas pendentes`,
      subIcon: FaCalendarAlt,
      subColor: "#e74c3c",
    },
  ];

  // ============================================================
  // MENU - SEM ITEM ADMIN (o admin acede via URL direto)
  // ============================================================
  const menuItems = [
    { path: "/", icon: FaThLarge, label: "Dashboard", id: "dashboard" },
    { path: "/alunos", icon: FaUsers, label: "Alunos", id: "alunos" },
    {
      path: "/professores",
      icon: FaChalkboardTeacher,
      label: "Professores",
      id: "professores",
    },
    {
      path: "/matriculas",
      icon: FaBookOpen,
      label: "Matrículas",
      id: "matriculas",
    },
    {
      path: "/pagamentos",
      icon: FaCoins,
      label: "Pagamentos",
      id: "pagamentos",
    },
    {
      path: "/classes-turmas",
      icon: FaSchool,
      label: "Classes/Turmas",
      id: "classes-turmas",
    },
    {
      path: "/ano-lectivo",
      icon: FaCalendarAlt,
      label: "Ano Lectivo",
      id: "ano-lectivo",
    },
    {
      path: "#comunicados",
      icon: FaBullhorn,
      label: "Comunicados",
      disabled: true,
      id: "comunicados",
    },
    {
      path: "#consultas",
      icon: FaSearch,
      label: "Consultas",
      disabled: true,
      id: "consultas",
    },
    {
      path: "/relatorios",
      icon: FaChartBar,
      label: "Relatórios",
      id: "relatorios",
    },
  ];

  const isDashboard = location.pathname === "/";

  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja sair do sistema?")) {
      logout();
      navigate("/login");
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      super_admin: "Super Admin",
      admin_escola: "Admin Escola",
      secretaria: "Secretária",
      professor: "Professor",
    };
    return roles[role] || role;
  };

  return (
    <>
      <div
        className={`app-container ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <img src={logo} alt="LUKI Logo" className="logo-image" />
              {!sidebarCollapsed && <span className="logo-text">LUKI</span>}
            </div>
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    className="nav-item disabled"
                    style={{
                      opacity: 0.5,
                      pointerEvents: "none",
                      cursor: "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "6px",
                      color: "#6a6a6a",
                      textDecoration: "none",
                    }}
                    title="Funcionalidade em desenvolvimento"
                  >
                    <IconComponent />
                    {!sidebarCollapsed && (
                      <span className="nav-label">{item.label}</span>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                >
                  <IconComponent />
                  {!sidebarCollapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="user-info-sidebar">
              <FaUserCircle className="user-avatar" />
              {!sidebarCollapsed && (
                <div className="user-details">
                  <span className="user-name">{user?.nome || "Utilizador"}</span>
                  <span className="user-role">{getRoleLabel(user?.role)}</span>
                </div>
              )}
            </div>
            <button
              className="btn-logout-sidebar"
              onClick={handleLogout}
              title="Sair do sistema"
            >
              <FaSignOutAlt />
              {!sidebarCollapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        <main className="main-content">
          {isDashboard ? (
            <div className="dashboard">
              <div className="dashboard-header">
                <h1 style={{ fontSize: "32.5px", fontWeight: "bold" }}>
                  Dashboard Geral
                </h1>
                <div className="dashboard-header-right">
                  {user && (
                    <div className="user-welcome">
                      <FaUserShield />
                      <span>
                        Bem-vindo, <strong>{user.nome}</strong>
                      </span>
                    </div>
                  )}
                  <div className="badge-date">
                    <FaCalendarAlt style={{ marginRight: "0.3rem" }} />
                    Ano Lectivo:{" "}
                    {anoLectivoActual ||
                      anosLectivos.find((a) => a.isAnoActual)?.ano ||
                      "2026"}
                  </div>
                </div>
              </div>

              <div className="grid-cards">
                {stats.map((s, idx) => (
                  <div key={idx} className="stat-card">
                    <div className="stat-label">
                      <s.icon style={{ marginRight: "0.5rem" }} /> {s.label}
                    </div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-sub">
                      <s.subIcon
                        style={{
                          color: s.subColor || "#7a9a7a",
                          marginRight: "0.3rem",
                        }}
                      />{" "}
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="dashboard-lower-section"
                style={{
                  marginTop: "2rem",
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "1.5rem",
                }}
              >
                <div
                  className="recent-activities-card"
                  style={{
                    background: "#1a1a1a",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #3b3b3b",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "1.1rem",
                      color: "white",
                    }}
                  >
                    <FaClock style={{ color: "#3498db" }} /> Atividades Recentes
                  </h3>
                  <div
                    className="activities-list"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    {atividadesRecentes.length === 0 ? (
                      <p
                        style={{
                          color: "#95a5a6",
                          textAlign: "center",
                          padding: "1rem",
                        }}
                      >
                        Nenhuma atividade recente
                      </p>
                    ) : (
                      atividadesRecentes.map((ativ) => {
                        const IconComp = ativ.icone;
                        return (
                          <div
                            key={ativ.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "1rem",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #3b3b3b",
                            }}
                          >
                            <div
                              style={{
                                background: `${ativ.cor}20`,
                                color: ativ.cor,
                                padding: "10px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <IconComp />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h4
                                style={{
                                  fontSize: "0.95rem",
                                  color: "#f0f0f0",
                                  marginBottom: "0.2rem",
                                }}
                              >
                                {ativ.titulo}
                              </h4>
                              <p
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#7f8c8d",
                                  margin: 0,
                                }}
                              >
                                {ativ.descricao}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#95a5a6",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ativ.tempo}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div
                  className="system-info-card"
                  style={{
                    background: "#1a1a1a",
                    padding: "1.5rem",
                    borderRadius: "8px",
                    border: "1px solid #3b3b3b",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3
                    style={{
                      marginBottom: "1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "1.1rem",
                      color: "#fff",
                    }}
                  >
                    <FaInfoCircle style={{ color: "#2ecc71" }} /> Estado do
                    Sistema
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.8rem",
                      fontSize: "0.9rem",
                      color: "#b0b0b0",
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>Ano Lectivo Ativo:</span>
                      <strong style={{ color: "#fff" }}>
                        {anoLectivoActual ||
                          anosLectivos.find((a) => a.isAnoActual)?.ano ||
                          "N/A"}
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>Total de Classes:</span>
                      <strong style={{ color: "#fff" }}>{classes.length}</strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>Turmas Registadas:</span>
                      <strong style={{ color: "#fff" }}>{totalTurmas}</strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>Reconfirmações Pendentes:</span>
                      <strong
                        style={{
                          color:
                            confirmacoesPendentes.length > 0
                              ? "#e74c3c"
                              : "#2ecc71",
                        }}
                      >
                        {confirmacoesPendentes.length}
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>Comunicados Publicados:</span>
                      <strong style={{ color: "#fff" }}>
                        {
                          comunicados.filter((c) => c.status === "Publicado")
                            .length
                        }
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>Última Atualização:</span>
                      <strong style={{ color: "#2ecc71" }}>
                        {new Date().toLocaleDateString("pt-AO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </div>
                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span>Sincronização:</span>
                      <span style={{ color: "#2ecc71", fontWeight: "bold" }}>
                        Online/Seguro
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* ✅ Modal de aviso (substitui alert()) */}
      <AvisoModal aviso={aviso} onClose={fecharAviso} />
    </>
  );
};

export default Dashboard;