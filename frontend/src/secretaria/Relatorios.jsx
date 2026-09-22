import React, { useState, useRef } from "react";
import "./Relatorios.css";
import {
  FaPrint,
  FaFilePdf,
  FaFileExcel,
  FaUserGraduate,
  FaMoneyBill,
  FaBook,
  FaChalkboardTeacher,
  FaUsers,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUserPlus,
  FaUserMinus,
  FaClipboard,
  FaReceipt,
  FaEye,
  FaArrowLeft,
  FaTimes,
  FaInfoCircle as FaInfo,
} from "react-icons/fa";
import { useSchool } from "../context/SchoolContext";
import ReciboUnificado from "./ReciboUnificado";

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

const Relatorios = () => {
  // Usando o contexto para aceder aos dados
  const { alunos, professores, matriculas } = useSchool();

  const [activeTab, setActiveTab] = useState("alunos");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [filterClasse, setFilterClasse] = useState("todos");
  const [filterTurma, setFilterTurma] = useState("todos");
  const [filterAno, setFilterAno] = useState("todos");
  const [filterDisciplina, setFilterDisciplina] = useState("todos");

  // Estados para visualização de recibos
  const [viewRecibo, setViewRecibo] = useState(null);
  const reciboRef = useRef(null);
  const relatorioPrintRef = useRef(null);

  // ✅ Estado do modal de aviso
  const [aviso, setAviso] = useState(null);
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

  // Extrair classes, turmas e anos dos dados reais
  const classes = [
    "1ª Classe",
    "2ª Classe",
    "3ª Classe",
    "4ª Classe",
    "5ª Classe",
    "6ª Classe",
    "7ª Classe",
    "8ª Classe",
    "9ª Classe",
  ];
  const turmas = ["A", "B", "C"];
  const anos = ["2026/27", "2027/28"];
  const disciplinas = [
    "Matemática",
    "Português",
    "História",
    "Geografia",
    "Ciências",
    "Biologia",
    "Física",
    "Química",
    "Inglês",
    "Educação Física",
  ];

  // Funções para obter dados filtrados dos relatórios
  const getRelatorioAlunos = () => {
    let filtered = [...alunos];
    if (filterClasse !== "todos")
      filtered = filtered.filter((a) => a.classe === filterClasse);
    if (filterTurma !== "todos")
      filtered = filtered.filter((a) => a.turma === filterTurma);
    return filtered;
  };

  // Extrair pagamentos de todos os alunos para o relatório financeiro
  const getRelatorioFinanceiro = () => {
    let allPayments = [];
    alunos.forEach((aluno) => {
      if (aluno.pagamentos && aluno.pagamentos.length > 0) {
        aluno.pagamentos.forEach((pagamento) => {
          allPayments.push({
            id: pagamento.id,
            aluno: aluno.nome,
            alunoId: aluno.id,
            codigo: aluno.codigo,
            bi: aluno.bi,
            encarregado: aluno.encarregado,
            contactoEncarregado: aluno.contactoEncarregado,
            classe: aluno.classe,
            turma: aluno.turma,
            anoLectivo: aluno.anoLectivo,
            tipo: pagamento.tipo,
            valor: pagamento.valor,
            data: pagamento.data,
            status: pagamento.status,
            forma: pagamento.formaPagamento || pagamento.forma || "N/A",
            mesReferencia: pagamento.mesReferencia,
            mesesSelecionados: pagamento.mesesSelecionados || [],
            mesesPagos: pagamento.mesesPagos || 0,
            propinaMensal: pagamento.propinaMensal || 0,
            referencia: pagamento.referencia,
            funcionario: pagamento.funcionario || "Sistema",
          });
        });
      }
    });

    let filtered = allPayments;
    if (periodoInicio && periodoFim) {
      filtered = filtered.filter(
        (p) => p.data >= periodoInicio && p.data <= periodoFim,
      );
    }
    return filtered;
  };

  const getRelatorioMatriculas = () => {
    let filtered = [...matriculas];
    if (filterAno !== "todos")
      filtered = filtered.filter((m) => m.anoLectivo === filterAno);
    if (filterClasse !== "todos")
      filtered = filtered.filter((m) => m.classe === filterClasse);
    if (filterTurma !== "todos")
      filtered = filtered.filter((m) => m.turma === filterTurma);
    return filtered;
  };

  const getRelatorioProfessores = () => {
    let filtered = [...professores];
    if (filterDisciplina !== "todos") {
      filtered = filtered.filter(
        (p) => p.disciplinas && p.disciplinas.includes(filterDisciplina),
      );
    }
    if (filterTurma !== "todos") {
      filtered = filtered.filter(
        (p) => p.turmas && p.turmas.includes(filterTurma),
      );
    }
    return filtered;
  };

  // Função para visualizar recibo de um pagamento
  const handleViewRecibo = (pagamento) => {
    const alunoData = alunos.find((a) => a.id === pagamento.alunoId);
    if (!alunoData) {
      mostrarAviso("erro", "Aluno não encontrado!");
      return;
    }
    setViewRecibo({
      pagamento,
      aluno: alunoData,
    });
  };

  // Função para imprimir o recibo
  const handlePrintRecibo = () => {
    if (reciboRef.current) {
      const printContent = reciboRef.current;
      const win = window.open("", "_blank", "width=800,height=600");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Recibo de Pagamento</title>
            </head>
            <body>
              ${printContent.innerHTML}
              <script>
                window.onload = function() { 
                  setTimeout(function() { window.print(); }, 500);
                  setTimeout(function() { window.close(); }, 3000);
                }
              <\/script>
            </body>
          </html>
        `);
        win.document.close();
      } else {
        mostrarAviso(
          "info",
          "Não foi possível abrir a janela de impressão. Verifique se o pop-up foi bloqueado.",
        );
      }
    }
  };

  // Função para fechar visualização do recibo
  const handleCloseViewRecibo = () => {
    setViewRecibo(null);
  };

  // ============================================================
  // FUNÇÃO PARA IMPRIMIR O RELATÓRIO COMPLETO
  // ============================================================
  const handlePrintRelatorio = () => {
    const printContent = document.querySelector(".relatorio-print-content");
    if (!printContent) {
      mostrarAviso("erro", "Conteúdo do relatório não encontrado.");
      return;
    }

    const win = window.open("", "_blank", "width=900,height=700");
    if (win) {
      const dataAtual = new Date().toLocaleDateString("pt-AO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const tituloRelatorio =
        activeTab === "alunos"
          ? "Relatório de Alunos"
          : activeTab === "financeiro"
            ? "Relatório Financeiro"
            : activeTab === "matriculas"
              ? "Relatório de Matrículas"
              : "Relatório de Professores";

      win.document.write(`
        <html>
          <head>
            <title>${tituloRelatorio}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                background: white; 
                font-family: Arial, sans-serif;
                padding: 40px;
                color: #1a1a1a;
              }
              .relatorio-print {
                max-width: 1100px;
                margin: 0 auto;
              }
              .relatorio-header {
                text-align: center;
                border-bottom: 3px solid #1a3a1a;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .relatorio-header h1 {
                color: black;
                font-size: 28px;
                margin-bottom: 5px;
              }
              .relatorio-header h2 {
                color: black;
                font-size: 20px;
                font-weight: 500;
                margin-bottom: 10px;
              }
              .relatorio-header .info {
                color: #555;
                font-size: 14px;
              }
              .relatorio-header .info span {
                margin: 0 10px;
              }
              .relatorio-filtros {
                background: #f5f5f5;
                padding: 15px 20px;
                border-radius: 0.5rem;
                margin-bottom: 25px;
                font-size: 14px;
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
              }
              .relatorio-filtros .filtro-item {
                display: flex;
                align-items: center;
                gap: 5px;
              }
              .relatorio-filtros .filtro-item strong {
                color: #333;
              }
              .relatorio-filtros .filtro-item .valor {
                background: #e8e8e8;
                padding: 2px 12px;
                border-radius: 0.5rem;
                color: #1a3a1a;
              }
              .relatorio-resumo-print {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
              }
              .relatorio-resumo-print .card {
                background: #f8f8f8;
                border: 1px solid #ddd;
                border-radius: 0.5rem;
                padding: 15px 20px;
                text-align: center;
              }
              .relatorio-resumo-print .card .numero {
                font-size: 28px;
                font-weight: 700;
                color: #1a3a1a;
                display: block;
              }
              .relatorio-resumo-print .card .label {
                font-size: 13px;
                color: #666;
                margin-top: 4px;
              }
              .relatorio-resumo-print .card.success .numero { color: #2ecc71; }
              .relatorio-resumo-print .card.danger .numero { color: #e74c3c; }
              .relatorio-resumo-print .card.primary .numero { color: #3498db; }
              .relatorio-resumo-print .card.warning .numero { color: #f39c12; }
              .relatorio-tabela {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
                margin-top: 20px;
              }
              .relatorio-tabela th {
                background: #1a3a1a;
                color: white;
                padding: 10px 12px;
                text-align: left;
                font-weight: 600;
              }
              .relatorio-tabela td {
                padding: 8px 12px;
                border-bottom: 1px solid #eee;
              }
              .relatorio-tabela tr:nth-child(even) {
                background: #f9f9f9;
              }
              .relatorio-tabela .total-row {
                background: #f0f8f0 !important;
                font-weight: 600;
              }
              .relatorio-tabela .total-row td {
                border-top: 2px solid #1a3a1a;
                padding: 10px 12px;
              }
              .relatorio-footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #ddd;
                text-align: center;
                color: #777;
                font-size: 12px;
              }
              .badge {
                display: inline-block;
                padding: 2px 10px;
                border-radius: 0.5rem;
                font-size: 11px;
                font-weight: 600;
              }
              .badge.ativo, .badge.activo, .badge.ativa { background: #d4edda; color: #155724; }
              .badge.inativo, .badge.inactivo { background: #f8d7da; color: #721c24; }
              .badge.confirmado, .badge.pago { background: #d4edda; color: #155724; }
              .badge.pendente { background: #fff3cd; color: #856404; }
              .badge.cancelado { background: #f8d7da; color: #721c24; }
              .badge.sim { background: #d4edda; color: #155724; }
              .badge.nao { background: #f8d7da; color: #721c24; }
              @media print {
                body { padding: 20px; }
                .relatorio-print { max-width: 100%; }
              }
            </style>
          </head>
          <body>
            <div class="relatorio-print">
              <div class="relatorio-header">
                <h1>COMPLEXO ESCOLAR PRIVADO JÚLIA</h1>
                <h2>${tituloRelatorio}</h2>
                <div class="info">
                  <span>📅 Data: ${dataAtual}</span>
                  <span>|</span>
                  <span>📄 Gerado por: Sistema</span>
                </div>
              </div>

              ${renderFiltrosPrint()}

              <div class="relatorio-resumo-print">
                ${renderResumoPrint()}
              </div>

              <table class="relatorio-tabela">
                ${renderTabelaPrint()}
              </table>

              <div class="relatorio-footer">
                <p>Este relatório foi gerado automaticamente pelo sistema.</p>
                <p>Documento válido para todos os efeitos legais.</p>
                <p style="margin-top: 10px; font-size: 11px; color: #999;">
                  Total de registos: ${getTotalRegistos()}
                </p>
              </div>
            </div>
            <script>
              window.onload = function() { 
                setTimeout(function() { window.print(); }, 600);
                setTimeout(function() { window.close(); }, 3000);
              }
            <\/script>
          </body>
        </html>
      `);
      win.document.close();
    } else {
      mostrarAviso(
        "info",
        "Não foi possível abrir a janela de impressão. Verifique se o pop-up foi bloqueado.",
      );
    }
  };

  // Função para renderizar os filtros na impressão
  const renderFiltrosPrint = () => {
    let filtros = [];

    if (activeTab === "alunos" || activeTab === "matriculas") {
      if (filterClasse !== "todos")
        filtros.push({ label: "Classe", value: filterClasse });
      if (filterTurma !== "todos")
        filtros.push({ label: "Turma", value: filterTurma });
    }
    if (activeTab === "matriculas" && filterAno !== "todos") {
      filtros.push({ label: "Ano Lectivo", value: filterAno });
    }
    if (activeTab === "financeiro") {
      if (periodoInicio)
        filtros.push({
          label: "Data Início",
          value: new Date(periodoInicio).toLocaleDateString("pt-AO"),
        });
      if (periodoFim)
        filtros.push({
          label: "Data Fim",
          value: new Date(periodoFim).toLocaleDateString("pt-AO"),
        });
    }
    if (activeTab === "professores") {
      if (filterDisciplina !== "todos")
        filtros.push({ label: "Disciplina", value: filterDisciplina });
      if (filterTurma !== "todos")
        filtros.push({ label: "Turma", value: filterTurma });
    }

    if (filtros.length === 0) {
      return `<div class="relatorio-filtros"><span style="color: #888;">Nenhum filtro aplicado - Todos os registos</span></div>`;
    }

    return `
      <div class="relatorio-filtros">
        ${filtros
          .map(
            (f) => `
          <div class="filtro-item">
            <strong>${f.label}:</strong>
            <span class="valor">${f.value}</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  };

  // Função para renderizar o resumo na impressão
  const renderResumoPrint = () => {
    if (activeTab === "alunos") {
      const stats = getEstatisticasAlunos();
      return `
        <div class="card"><span class="numero">${stats.total}</span><span class="label">Total Alunos</span></div>
        <div class="card success"><span class="numero">${stats.ativos}</span><span class="label">Activos</span></div>
        <div class="card danger"><span class="numero">${stats.inativos}</span><span class="label">Inactivos</span></div>
        <div class="card primary"><span class="numero">${stats.matriculados}</span><span class="label">Matriculados</span></div>
      `;
    }

    if (activeTab === "financeiro") {
      const totais = calcularTotaisFinanceiros();
      return `
        <div class="card success"><span class="numero">Kz ${totais.totalPago.toLocaleString()}</span><span class="label">Total Pago</span></div>
        <div class="card danger"><span class="numero">Kz ${totais.totalPendente.toLocaleString()}</span><span class="label">Total Pendente</span></div>
        <div class="card primary"><span class="numero">Kz ${totais.totalGeral.toLocaleString()}</span><span class="label">Total Geral</span></div>
        <div class="card warning"><span class="numero">${totais.totalItems}</span><span class="label">Transações</span></div>
      `;
    }

    if (activeTab === "matriculas") {
      const stats = getEstatisticasMatriculas();
      return `
        <div class="card"><span class="numero">${stats.total}</span><span class="label">Total Matrículas</span></div>
        <div class="card success"><span class="numero">${stats.ativas}</span><span class="label">Activas</span></div>
        <div class="card danger"><span class="numero">${stats.canceladas}</span><span class="label">Canceladas</span></div>
      `;
    }

    if (activeTab === "professores") {
      const stats = getEstatisticasProfessores();
      return `
        <div class="card"><span class="numero">${stats.total}</span><span class="label">Total Professores</span></div>
        <div class="card primary"><span class="numero">${Object.keys(stats.porDisciplina).length}</span><span class="label">Disciplinas</span></div>
      `;
    }

    return "";
  };

  // Função para renderizar a tabela na impressão
  const renderTabelaPrint = () => {
    if (activeTab === "alunos") {
      const dados = getRelatorioAlunos();
      if (dados.length === 0) {
        return `<thead><tr><td colspan="6" style="text-align:center;padding:30px;color:#888;">Nenhum aluno encontrado</td></tr></thead>`;
      }
      return `
        <thead>
          <tr>
            <th>Código</th>
            <th>Nome</th>
            <th>Classe</th>
            <th>Turma</th>
            <th>Estado</th>
            <th>Matrícula</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map(
              (a) => `
            <tr>
              <td><strong>${a.codigo || `AL-${String(a.id).padStart(4, "0")}`}</strong></td>
              <td>${a.nome}</td>
              <td>${a.classe}</td>
              <td>${a.turma}</td>
              <td><span class="badge ${a.estado.toLowerCase()}">${a.estado}</span></td>
              <td><span class="badge ${a.dataMatricula ? "sim" : "nao"}">${a.dataMatricula ? "Sim" : "Não"}</span></td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td colspan="6"><strong>Total: ${dados.length} alunos</strong></td>
          </tr>
        </tbody>
      `;
    }

    if (activeTab === "financeiro") {
      const dados = getRelatorioFinanceiro();
      if (dados.length === 0) {
        return `<thead><tr><td colspan="6" style="text-align:center;padding:30px;color:#888;">Nenhum pagamento encontrado</td></tr></thead>`;
      }
      return `
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Forma</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map(
              (p) => `
            <tr>
              <td><strong>${p.aluno}</strong></td>
              <td>${p.tipo}</td>
              <td>Kz ${p.valor.toLocaleString()}</td>
              <td>${new Date(p.data).toLocaleDateString("pt-AO")}</td>
              <td>${p.forma}</td>
              <td><span class="badge ${p.status.toLowerCase() === "confirmado" || p.status.toLowerCase() === "pago" ? "confirmado" : "pendente"}">${p.status}</span></td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td colspan="6"><strong>Total: ${dados.length} transações</strong></td>
          </tr>
        </tbody>
      `;
    }

    if (activeTab === "matriculas") {
      const dados = getRelatorioMatriculas();
      if (dados.length === 0) {
        return `<thead><tr><td colspan="6" style="text-align:center;padding:30px;color:#888;">Nenhuma matrícula encontrada</td></tr></thead>`;
      }
      return `
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Ano</th>
            <th>Classe</th>
            <th>Turma</th>
            <th>Data</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map(
              (m) => `
            <tr>
              <td><strong>${m.aluno}</strong></td>
              <td>${m.anoLectivo}</td>
              <td>${m.classe}</td>
              <td>${m.turma}</td>
              <td>${new Date(m.dataMatricula).toLocaleDateString("pt-AO")}</td>
              <td><span class="badge ${m.estado.toLowerCase()}">${m.estado}</span></td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td colspan="6"><strong>Total: ${dados.length} matrículas</strong></td>
          </tr>
        </tbody>
      `;
    }

    if (activeTab === "professores") {
      const dados = getRelatorioProfessores();
      if (dados.length === 0) {
        return `<thead><tr><td colspan="5" style="text-align:center;padding:30px;color:#888;">Nenhum professor encontrado</td></tr></thead>`;
      }
      return `
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Especialidade</th>
            <th>Disciplinas</th>
            <th>Contacto</th>
          </tr>
        </thead>
        <tbody>
          ${dados
            .map(
              (p) => `
            <tr>
              <td><strong>PROF-${String(p.id).padStart(4, "0")}</strong></td>
              <td>${p.nome}</td>
              <td>${p.especialidade ? p.especialidade.join(", ") : "N/A"}</td>
              <td>${p.disciplinas ? p.disciplinas.join(", ") : "N/A"}</td>
              <td>${p.contacto || "N/A"}</td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td colspan="5"><strong>Total: ${dados.length} professores</strong></td>
          </tr>
        </tbody>
      `;
    }

    return "";
  };

  // Função para obter o total de registos
  const getTotalRegistos = () => {
    if (activeTab === "alunos") return getRelatorioAlunos().length;
    if (activeTab === "financeiro") return getRelatorioFinanceiro().length;
    if (activeTab === "matriculas") return getRelatorioMatriculas().length;
    if (activeTab === "professores") return getRelatorioProfessores().length;
    return 0;
  };

  // ============================================================
  // ✅ EXPORTAR PDF (via janela de impressão → "Guardar como PDF")
  // ============================================================
  const handleExportPDF = () => {
    const printContent = document.querySelector(".relatorio-print-content");
    if (!printContent) {
      mostrarAviso("erro", "Conteúdo do relatório não encontrado.");
      return;
    }

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      mostrarAviso(
        "info",
        "Não foi possível abrir a janela de exportação. Verifique se o pop-up foi bloqueado.",
      );
      return;
    }

    const dataAtual = new Date().toLocaleDateString("pt-AO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const tituloRelatorio =
      activeTab === "alunos"
        ? "Relatório de Alunos"
        : activeTab === "financeiro"
          ? "Relatório Financeiro"
          : activeTab === "matriculas"
            ? "Relatório de Matrículas"
            : "Relatório de Professores";

    win.document.write(`
      <html>
        <head>
          <title>${tituloRelatorio}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              background: white; 
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #1a1a1a;
            }
            .relatorio-print {
              max-width: 1100px;
              margin: 0 auto;
            }
            .relatorio-header {
              text-align: center;
              border-bottom: 3px solid #1a3a1a;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .relatorio-header h1 {
              color: black;
              font-size: 28px;
              margin-bottom: 5px;
            }
            .relatorio-header h2 {
              color: black;
              font-size: 20px;
              font-weight: 500;
              margin-bottom: 10px;
            }
            .relatorio-header .info {
              color: #555;
              font-size: 14px;
            }
            .relatorio-header .info span {
              margin: 0 10px;
            }
            .relatorio-filtros {
              background: #f5f5f5;
              padding: 15px 20px;
              border-radius: 0.5rem;
              margin-bottom: 25px;
              font-size: 14px;
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
            }
            .relatorio-filtros .filtro-item {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .relatorio-filtros .filtro-item strong {
              color: #333;
            }
            .relatorio-filtros .filtro-item .valor {
              background: #e8e8e8;
              padding: 2px 12px;
              border-radius: 0.5rem;
              color: black;
            }
            .relatorio-resumo-print {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 15px;
              margin-bottom: 30px;
            }
            .relatorio-resumo-print .card {
              background: #f8f8f8;
              border: 1px solid #ddd;
              border-radius: 0.5rem;
              padding: 15px 20px;
              text-align: center;
            }
            .relatorio-resumo-print .card .numero {
              font-size: 28px;
              font-weight: 700;
              color: #1a3a1a;
              display: block;
            }
            .relatorio-resumo-print .card .label {
              font-size: 13px;
              color: #666;
              margin-top: 4px;
            }
            .relatorio-resumo-print .card.success .numero { color: #2ecc71; }
            .relatorio-resumo-print .card.danger .numero { color: #e74c3c; }
            .relatorio-resumo-print .card.primary .numero { color: #3498db; }
            .relatorio-resumo-print .card.warning .numero { color: #f39c12; }
            .relatorio-tabela {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
              margin-top: 20px;
            }
            .relatorio-tabela th {
              background: #1a3a1a;
              color: white;
              padding: 10px 12px;
              text-align: left;
              font-weight: 600;
            }
            .relatorio-tabela td {
              padding: 8px 12px;
              border-bottom: 1px solid #eee;
            }
            .relatorio-tabela tr:nth-child(even) {
              background: #f9f9f9;
            }
            .relatorio-tabela .total-row {
              background: #f0f8f0 !important;
              font-weight: 600;
            }
            .relatorio-tabela .total-row td {
              border-top: 2px solid #1a3a1a;
              padding: 10px 12px;
            }
            .relatorio-footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #ddd;
              text-align: center;
              color: #777;
              font-size: 12px;
            }
            .badge {
              display: inline-block;
              padding: 2px 10px;
              border-radius: 0.5rem;
              font-size: 11px;
              font-weight: 600;
            }
            .badge.ativo, .badge.activo, .badge.ativa { background: #d4edda; color: #155724; }
            .badge.inativo, .badge.inactivo { background: #f8d7da; color: #721c24; }
            .badge.confirmado, .badge.pago { background: #d4edda; color: #155724; }
            .badge.pendente { background: #fff3cd; color: #856404; }
            .badge.cancelado { background: #f8d7da; color: #721c24; }
            .badge.sim { background: #d4edda; color: #155724; }
            .badge.nao { background: #f8d7da; color: #721c24; }
            @media print {
              body { padding: 20px; }
              .relatorio-print { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="relatorio-print">
            <div class="relatorio-header">
              <h1>COMPLEXO ESCOLAR PRIVADO JÚLIA</h1>
              <h2>${tituloRelatorio}</h2>
              <div class="info">
                <span>📅 Data: ${dataAtual}</span>
                <span>|</span>
                <span>📄 Gerado por: Sistema</span>
              </div>
            </div>

            ${renderFiltrosPrint()}

            <div class="relatorio-resumo-print">
              ${renderResumoPrint()}
            </div>

            <table class="relatorio-tabela">
              ${renderTabelaPrint()}
            </table>

            <div class="relatorio-footer">
              <p>Este relatório foi gerado automaticamente pelo sistema.</p>
              <p>Documento válido para todos os efeitos legais.</p>
              <p style="margin-top: 10px; font-size: 11px; color: #999;">
                Total de registos: ${getTotalRegistos()}
              </p>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 600);
            }
          <\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // ============================================================
  // ✅ EXPORTAR EXCEL (CSV compatível com Excel)
  // ============================================================
  const handleExportExcel = () => {
    let csvContent = "";
    let nomeArquivo = "";

    // Função auxiliar para escapar campos CSV
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (
        str.includes(",") ||
        str.includes('"') ||
        str.includes("\n") ||
        str.includes(";")
      ) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // BOM para UTF-8 (garante acentuação correta no Excel)
    const BOM = "\uFEFF";

    // Cabeçalho do documento
    const tituloRelatorio =
      activeTab === "alunos"
        ? "Relatório de Alunos"
        : activeTab === "financeiro"
          ? "Relatório Financeiro"
          : activeTab === "matriculas"
            ? "Relatório de Matrículas"
            : "Relatório de Professores";

    const dataAtual = new Date().toLocaleDateString("pt-AO");

    let linhas = [];

    // Título
    linhas.push([tituloRelatorio]);
    linhas.push(["COMPLEXO ESCOLAR PRIVADO JÚLIA"]);
    linhas.push([`Data de emissão: ${dataAtual}`]);
    linhas.push([]);

    // Filtros aplicados
    const filtros = [];
    if (activeTab === "alunos" || activeTab === "matriculas") {
      if (filterClasse !== "todos")
        filtros.push(`Classe: ${filterClasse}`);
      if (filterTurma !== "todos")
        filtros.push(`Turma: ${filterTurma}`);
    }
    if (activeTab === "matriculas" && filterAno !== "todos")
      filtros.push(`Ano Lectivo: ${filterAno}`);
    if (activeTab === "financeiro") {
      if (periodoInicio)
        filtros.push(`Data Início: ${periodoInicio}`);
      if (periodoFim) filtros.push(`Data Fim: ${periodoFim}`);
    }
    if (activeTab === "professores") {
      if (filterDisciplina !== "todos")
        filtros.push(`Disciplina: ${filterDisciplina}`);
      if (filterTurma !== "todos")
        filtros.push(`Turma: ${filterTurma}`);
    }

    if (filtros.length > 0) {
      linhas.push(["Filtros aplicados:"]);
      filtros.forEach((f) => linhas.push([f]));
    } else {
      linhas.push(["Filtros aplicados: Nenhum (todos os registos)"]);
    }
    linhas.push([]);

    // Dados por tipo de relatório
    if (activeTab === "alunos") {
      const dados = getRelatorioAlunos();
      linhas.push([
        "Código",
        "Nome",
        "Classe",
        "Turma",
        "Estado",
        "Data Matrícula",
      ]);
      dados.forEach((a) => {
        linhas.push([
          a.codigo || `AL-${String(a.id).padStart(4, "0")}`,
          a.nome,
          a.classe,
          a.turma,
          a.estado,
          a.dataMatricula
            ? new Date(a.dataMatricula).toLocaleDateString("pt-AO")
            : "",
        ]);
      });
      linhas.push([]);
      linhas.push([`Total: ${dados.length} alunos`]);
      nomeArquivo = "relatorio_alunos";
    }

    if (activeTab === "financeiro") {
      const dados = getRelatorioFinanceiro();
      linhas.push([
        "Aluno",
        "Tipo",
        "Valor (Kz)",
        "Data",
        "Forma Pagamento",
        "Status",
        "Referência",
      ]);
      dados.forEach((p) => {
        linhas.push([
          p.aluno,
          p.tipo,
          p.valor,
          new Date(p.data).toLocaleDateString("pt-AO"),
          p.forma,
          p.status,
          p.referencia || "",
        ]);
      });
      const totais = calcularTotaisFinanceiros();
      linhas.push([]);
      linhas.push([`Total de registos: ${dados.length}`]);
      linhas.push([`Total Pago: Kz ${totais.totalPago.toLocaleString()}`]);
      linhas.push([`Total Pendente: Kz ${totais.totalPendente.toLocaleString()}`]);
      linhas.push([`Total Geral: Kz ${totais.totalGeral.toLocaleString()}`]);
      nomeArquivo = "relatorio_financeiro";
    }

    if (activeTab === "matriculas") {
      const dados = getRelatorioMatriculas();
      linhas.push([
        "Aluno",
        "Ano Lectivo",
        "Classe",
        "Turma",
        "Data Matrícula",
        "Estado",
      ]);
      dados.forEach((m) => {
        linhas.push([
          m.aluno,
          m.anoLectivo,
          m.classe,
          m.turma,
          m.dataMatricula
            ? new Date(m.dataMatricula).toLocaleDateString("pt-AO")
            : "",
          m.estado,
        ]);
      });
      linhas.push([]);
      linhas.push([`Total: ${dados.length} matrículas`]);
      nomeArquivo = "relatorio_matriculas";
    }

    if (activeTab === "professores") {
      const dados = getRelatorioProfessores();
      linhas.push([
        "ID",
        "Nome",
        "Especialidade",
        "Disciplinas",
        "Contacto",
        "Turmas",
      ]);
      dados.forEach((p) => {
        linhas.push([
          `PROF-${String(p.id).padStart(4, "0")}`,
          p.nome,
          p.especialidade ? p.especialidade.join(", ") : "",
          p.disciplinas ? p.disciplinas.join(", ") : "",
          p.contacto || "",
          p.turmas ? p.turmas.map((t) => `Turma ${t}`).join(", ") : "",
        ]);
      });
      linhas.push([]);
      linhas.push([`Total: ${dados.length} professores`]);
      nomeArquivo = "relatorio_professores";
    }

    // Construir CSV
    csvContent = linhas
      .map((linha) =>
        linha.map((campo) => escapeCSV(campo)).join(";"),
      )
      .join("\n");

    // Download
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    mostrarAviso("sucesso", "Exportação Excel (CSV) concluída com sucesso!");
  };

  const handlePrint = () => {
    window.print();
  };

  const calcularTotaisFinanceiros = () => {
    const relatorio = getRelatorioFinanceiro();
    const totalPago = relatorio
      .filter((p) => p.status === "Confirmado" || p.status === "Pago")
      .reduce((sum, p) => sum + p.valor, 0);
    const totalPendente = relatorio
      .filter((p) => p.status === "Pendente")
      .reduce((sum, p) => sum + p.valor, 0);
    const totalGeral = totalPago + totalPendente;
    return {
      totalPago,
      totalPendente,
      totalGeral,
      totalItems: relatorio.length,
    };
  };

  const getEstatisticasAlunos = () => {
    const relatorio = getRelatorioAlunos();
    const ativos = relatorio.filter((a) => a.estado === "Ativo").length;
    const inativos = relatorio.filter((a) => a.estado === "Inativo").length;
    const matriculados = relatorio.filter(
      (a) => a.estado === "Ativo" && a.dataMatricula,
    ).length;
    const naoMatriculados = relatorio.filter(
      (a) => a.estado === "Inativo",
    ).length;
    return {
      total: relatorio.length,
      ativos,
      inativos,
      matriculados,
      naoMatriculados,
    };
  };

  const getEstatisticasMatriculas = () => {
    const relatorio = getRelatorioMatriculas();
    const ativas = relatorio.filter((m) => m.estado === "Ativa").length;
    const canceladas = relatorio.filter((m) => m.estado === "Cancelada").length;
    return { total: relatorio.length, ativas, canceladas };
  };

  const getEstatisticasProfessores = () => {
    const relatorio = getRelatorioProfessores();
    const porDisciplina = {};
    relatorio.forEach((p) => {
      if (p.disciplinas) {
        p.disciplinas.forEach((disciplina) => {
          porDisciplina[disciplina] = (porDisciplina[disciplina] || 0) + 1;
        });
      }
    });
    return { total: relatorio.length, porDisciplina };
  };

  // View: Visualizar Recibo
  if (viewRecibo) {
    const { pagamento, aluno } = viewRecibo;

    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleCloseViewRecibo}>
                <FaArrowLeft />
              </button>
              Recibo de Pagamento
            </h2>
            <div className="header-actions">
              <button className="btn-print" onClick={handlePrintRecibo}>
                <FaPrint /> Imprimir
              </button>
              <button className="btn-cancel" onClick={handleCloseViewRecibo}>
                <FaTimes /> Fechar
              </button>
            </div>
          </div>
          <div className="print-modal-content" ref={reciboRef}>
            <ReciboUnificado
              tipo="pagamento"
              dados={pagamento}
              aluno={aluno}
              referencia={pagamento.referencia}
              data={pagamento.data}
              valor={pagamento.valor}
              formaPagamento={pagamento.forma}
              funcionario={pagamento.funcionario}
              status={pagamento.status}
              servico={pagamento.tipo}
              observacoes={pagamento.observacoes || ""}
            />
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

  const renderRelatorioAlunos = () => {
    const dados = getRelatorioAlunos();
    const stats = getEstatisticasAlunos();

    return (
      <div className="relatorio-content relatorio-print-content">
        <div className="relatorio-filtros">
          <div className="filter-group">
            <label>Classe:</label>
            <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
            >
              <option value="todos">Todas</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Turma:</label>
            <select
              value={filterTurma}
              onChange={(e) => setFilterTurma(e.target.value)}
            >
              <option value="todos">Todas</option>
              {turmas.map((t) => (
                <option key={t} value={t}>
                  Turma {t}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn-export" onClick={handlePrintRelatorio}>
              <FaPrint /> Imprimir Relatório
            </button>
            <button className="btn-export" onClick={handleExportPDF}>
              <FaFilePdf /> PDF
            </button>
            <button className="btn-export" onClick={handleExportExcel}>
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        <div className="relatorio-resumo">
          <div className="resumo-card">
            <FaUsers />
            <div className="resumo-info">
              <span className="resumo-valor">{stats.total}</span>
              <span className="resumo-label">Total Alunos</span>
            </div>
          </div>
          <div className="resumo-card success">
            <FaCheckCircle />
            <div className="resumo-info">
              <span className="resumo-valor">{stats.ativos}</span>
              <span className="resumo-label">Activos</span>
            </div>
          </div>
          <div className="resumo-card danger">
            <FaUserMinus />
            <div className="resumo-info">
              <span className="resumo-valor">{stats.inativos}</span>
              <span className="resumo-label">Inactivos</span>
            </div>
          </div>
          <div className="resumo-card primary">
            <FaUserPlus />
            <div className="resumo-info">
              <span className="resumo-valor">{stats.matriculados}</span>
              <span className="resumo-label">Matriculados</span>
            </div>
          </div>
        </div>

        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Classe</th>
                <th>Turma</th>
                <th>Estado</th>
                <th>Matrícula</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-message">
                    Nenhum aluno encontrado
                  </td>
                </tr>
              ) : (
                dados.map((aluno) => (
                  <tr key={aluno.id}>
                    <td>
                      <span className="codigo-badge">
                        {aluno.codigo ||
                          `AL-${String(aluno.id).padStart(4, "0")}`}
                      </span>
                    </td>
                    <td>
                      <strong>{aluno.nome}</strong>
                    </td>
                    <td>{aluno.classe}</td>
                    <td>
                      <span className="turma-badge">{aluno.turma}</span>
                    </td>
                    <td>
                      <span
                        className={`estado-badge ${aluno.estado.toLowerCase()}`}
                      >
                        {aluno.estado}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`matricula-badge ${aluno.dataMatricula ? "sim" : "nao"}`}
                      >
                        {aluno.dataMatricula ? "Sim" : "Não"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRelatorioFinanceiro = () => {
    const dados = getRelatorioFinanceiro();
    const totais = calcularTotaisFinanceiros();

    return (
      <div className="relatorio-content relatorio-print-content">
        <div className="relatorio-filtros">
          <div className="filter-group">
            <label>Data Início:</label>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Data Fim:</label>
            <input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
            />
          </div>
          <div className="filter-actions">
            <button className="btn-export" onClick={handlePrintRelatorio}>
              <FaPrint /> Imprimir Relatório
            </button>
            <button className="btn-export" onClick={handleExportPDF}>
              <FaFilePdf /> PDF
            </button>
            <button className="btn-export" onClick={handleExportExcel}>
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        <div className="relatorio-resumo">
          <div className="resumo-card success">
            <FaCheckCircle />
            <div className="resumo-info">
              <span className="resumo-valor">
                Kz {totais.totalPago.toLocaleString()}
              </span>
              <span className="resumo-label">Total Pago</span>
            </div>
          </div>
          <div className="resumo-card danger">
            <FaExclamationTriangle />
            <div className="resumo-info">
              <span className="resumo-valor">
                Kz {totais.totalPendente.toLocaleString()}
              </span>
              <span className="resumo-label">Total Pendente</span>
            </div>
          </div>
          <div className="resumo-card primary">
            <FaMoneyBill />
            <div className="resumo-info">
              <span className="resumo-valor">
                Kz {totais.totalGeral.toLocaleString()}
              </span>
              <span className="resumo-label">Total Geral</span>
            </div>
          </div>
          <div className="resumo-card">
            <FaReceipt />
            <div className="resumo-info">
              <span className="resumo-valor">{totais.totalItems}</span>
              <span className="resumo-label">Total Transações</span>
            </div>
          </div>
        </div>

        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Forma</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-message">
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                dados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.aluno}</strong>
                    </td>
                    <td>{p.tipo}</td>
                    <td>Kz {p.valor.toLocaleString()}</td>
                    <td>{new Date(p.data).toLocaleDateString("pt-AO")}</td>
                    <td>{p.forma}</td>
                    <td>
                      <span
                        className={`pagamento-badge ${p.status.toLowerCase() === "confirmado" ? "pago" : p.status.toLowerCase()}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="actions">
                      {p.status === "Confirmado" && (
                        <button
                          className="btn-view"
                          onClick={() => handleViewRecibo(p)}
                          title="Ver Recibo"
                        >
                          <FaEye />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRelatorioMatriculas = () => {
    const dados = getRelatorioMatriculas();
    const stats = getEstatisticasMatriculas();

    return (
      <div className="relatorio-content relatorio-print-content">
        <div className="relatorio-filtros">
          <div className="filter-group">
            <label>Ano Lectivo:</label>
            <select
              value={filterAno}
              onChange={(e) => setFilterAno(e.target.value)}
            >
              <option value="todos">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Classe:</label>
            <select
              value={filterClasse}
              onChange={(e) => setFilterClasse(e.target.value)}
            >
              <option value="todos">Todas</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Turma:</label>
            <select
              value={filterTurma}
              onChange={(e) => setFilterTurma(e.target.value)}
            >
              <option value="todos">Todas</option>
              {turmas.map((t) => (
                <option key={t} value={t}>
                  Turma {t}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn-export" onClick={handlePrintRelatorio}>
              <FaPrint /> Imprimir Relatório
            </button>
            <button className="btn-export" onClick={handleExportPDF}>
              <FaFilePdf /> PDF
            </button>
            <button className="btn-export" onClick={handleExportExcel}>
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        <div className="relatorio-resumo">
          <div className="resumo-card">
            <FaClipboard />
            <div className="resumo-info">
              <span className="resumo-valor">{stats.total}</span>
              <span className="resumo-label">Total Matrículas</span>
            </div>
          </div>
          <div className="resumo-card success">
            <FaCheckCircle />
            <div className="resumo-info">
              <span className="resumo-valor">{stats.ativas}</span>
              <span className="resumo-label">Activas</span>
            </div>
          </div>
          <div className="resumo-card danger">
            <FaExclamationTriangle />
            <div className="resumo-info">
              <span className="resumo-valor">{stats.canceladas}</span>
              <span className="resumo-label">Canceladas</span>
            </div>
          </div>
        </div>

        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Ano</th>
                <th>Classe</th>
                <th>Turma</th>
                <th>Data</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-message">
                    Nenhuma matrícula encontrada
                  </td>
                </tr>
              ) : (
                dados.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.aluno}</strong>
                    </td>
                    <td>{m.anoLectivo}</td>
                    <td>{m.classe}</td>
                    <td>
                      <span className="turma-badge">{m.turma}</span>
                    </td>
                    <td>
                      {new Date(m.dataMatricula).toLocaleDateString("pt-AO")}
                    </td>
                    <td>
                      <span
                        className={`estado-badge ${m.estado.toLowerCase()}`}
                      >
                        {m.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderRelatorioProfessores = () => {
    const dados = getRelatorioProfessores();
    const stats = getEstatisticasProfessores();

    return (
      <div className="relatorio-content relatorio-print-content">
        <div className="relatorio-filtros">
          <div className="filter-group">
            <label>Disciplina:</label>
            <select
              value={filterDisciplina}
              onChange={(e) => setFilterDisciplina(e.target.value)}
            >
              <option value="todos">Todas</option>
              {disciplinas.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Turma:</label>
            <select
              value={filterTurma}
              onChange={(e) => setFilterTurma(e.target.value)}
            >
              <option value="todos">Todas</option>
              {turmas.map((t) => (
                <option key={t} value={t}>
                  Turma {t}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn-export" onClick={handlePrintRelatorio}>
              <FaPrint /> Imprimir Relatório
            </button>
            <button className="btn-export" onClick={handleExportPDF}>
              <FaFilePdf /> PDF
            </button>
            <button className="btn-export" onClick={handleExportExcel}>
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        <div className="relatorio-resumo">
          <div className="resumo-card">
            <div className="resumo-info">
              <span className="resumo-valor">{stats.total}</span>
              <span className="resumo-label">Total Professores</span>
            </div>
          </div>
          <div className="resumo-card primary">
            <div className="resumo-info">
              <span className="resumo-valor">
                {Object.keys(stats.porDisciplina).length}
              </span>
              <span className="resumo-label">Disciplinas</span>
            </div>
          </div>
        </div>

        <div className="disciplinas-resumo">
          <h4>Professores por Disciplina</h4>
          <div className="disciplinas-grid">
            {Object.entries(stats.porDisciplina).map(([disciplina, count]) => (
              <div key={disciplina} className="disciplina-item">
                <span className="disciplina-nome">{disciplina}</span>
                <span className="disciplina-count">{count} professor(es)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>Disciplinas</th>
                <th>Contacto</th>
                <th>Turmas</th>
              </tr>
            </thead>
            <tbody>
              {dados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-message">
                    Nenhum professor encontrado
                  </td>
                </tr>
              ) : (
                dados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="codigo-badge">
                        PROF-{String(p.id).padStart(4, "0")}
                      </span>
                    </td>
                    <td>
                      <strong>{p.nome}</strong>
                    </td>
                    <td>{p.especialidade && p.especialidade.join(", ")}</td>
                    <td>{p.disciplinas && p.disciplinas.join(", ")}</td>
                    <td>{p.contacto}</td>
                    <td>
                      {p.turmas && p.turmas.map((t) => `Turma ${t}`).join(", ")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="container">
        <div className="header">
          <h2 style={{fontSize:'32.5px', fontWeight:'bold'}}>Relatórios</h2>
          <div className="header-actions">
            <button className="btn-export" onClick={handlePrintRelatorio}>
              <FaPrint /> Imprimir Relatório
            </button>
            <button className="btn-export" onClick={handleExportPDF}>
              <FaFilePdf /> PDF
            </button>
            <button className="btn-export" onClick={handleExportExcel}>
              <FaFileExcel /> Excel
            </button>
          </div>
        </div>

        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "alunos" ? "active" : ""}`}
            onClick={() => setActiveTab("alunos")}
          >
            <FaUserGraduate /> Alunos
          </button>
          <button
            className={`tab-btn ${activeTab === "financeiro" ? "active" : ""}`}
            onClick={() => setActiveTab("financeiro")}
          >
            <FaMoneyBill /> Financeiro
          </button>
          <button
            className={`tab-btn ${activeTab === "matriculas" ? "active" : ""}`}
            onClick={() => setActiveTab("matriculas")}
          >
            <FaBook /> Matrículas
          </button>
          <button
            className={`tab-btn ${activeTab === "professores" ? "active" : ""}`}
            onClick={() => setActiveTab("professores")}
          >
            <FaChalkboardTeacher /> Professores
          </button>
        </div>

        <div className="relatorio-container">
          {activeTab === "alunos" && renderRelatorioAlunos()}
          {activeTab === "financeiro" && renderRelatorioFinanceiro()}
          {activeTab === "matriculas" && renderRelatorioMatriculas()}
          {activeTab === "professores" && renderRelatorioProfessores()}
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

export default Relatorios;