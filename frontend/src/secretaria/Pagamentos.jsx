import React, { useState, useRef, useMemo } from "react";
import {
  FaArrowLeft,
  FaReceipt,
  FaPrint,
  FaFilePdf,
  FaSearch,
  FaPlusCircle,
  FaSave,
  FaTimesCircle,
  FaEye,
  FaPen,
  FaHourglassHalf,
  FaBook,
  FaExclamationTriangle,
  FaCalculator,
  FaInfoCircle,
  FaCheckCircle,
  FaInfoCircle as FaInfo,
} from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import { useSchool } from "../context/SchoolContext";
import ReciboUnificado from "./ReciboUnificado";
import "./Pagamentos.css";

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

const Pagamentos = () => {
  // ==================== DADOS DO CONTEXTO ====================
  const { alunos, adicionarPagamento, atualizarPagamento } = useSchool();

  // ==================== TODOS OS PAGAMENTOS DO SISTEMA ====================
  const pagamentos = useMemo(() => {
    return alunos.flatMap((aluno) =>
      (aluno.pagamentos || []).map((p) => ({
        ...p,
        alunoId: aluno.id,
        aluno: aluno.nome,
        codigo: aluno.codigo,
        bi: aluno.bi,
        encarregado: aluno.encarregado,
        contactoEncarregado: aluno.contactoEncarregado,
        classe: aluno.classe,
        turma: aluno.turma,
        anoLectivo: aluno.anoLectivo,
        multa: p.multa || 0,
        valorBase: p.valorBase || p.valor - (p.multa || 0),
      })),
    );
  }, [alunos]);

  // ==================== REFERÊNCIA PARA IMPRESSÃO ====================
  const reciboRef = useRef(null);
  const handlePrintRecibo = useReactToPrint({
    contentRef: reciboRef,
    documentTitle: "Recibo_Pagamento",
  });

  // ==================== ESTADOS ====================
  const [viewMode, setViewMode] = useState("lista");
  const [selectedPagamento, setSelectedPagamento] = useState(null);
  const [busca, setBusca] = useState("");
  const [buscaRecibos, setBuscaRecibos] = useState("");
  const [buscaPendentes, setBuscaPendentes] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");

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

  // ==================== FORM DATA ====================
  const [formData, setFormData] = useState({
    alunoId: "",
    aluno: "",
    tipo: "",
    valor: "",
    valorBase: "",
    data: new Date().toISOString().split("T")[0],
    formaPagamento: "",
    referencia: "",
    funcionario: "",
    status: "",
    mesReferencia: "",
    propinaMensal: "",
    mesesPagos: 0,
    mesesSelecionados: [],
    temMulta: false,
    multa: 0,
  });

  // ==================== BUSCA DE ALUNOS ====================
  const [buscaAluno, setBuscaAluno] = useState("");
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // ==================== PROPINAS ====================
  const [propinasView, setPropinasView] = useState({
    alunoId: null,
    aluno: "",
    mesesAtraso: 0,
    valorTotal: 0,
  });

  // ==================== RECIBO ====================
  const [reciboGerado, setReciboGerado] = useState(null);

  // ==================== LISTAS DE OPÇÕES ====================
  const tiposPagamento = [
    "Propina",
    "Matrícula",
    "Confirmação",
    "Declaração",
    "Certificado",
    "Emissão de documento",
    "Outros",
  ];

  const formasPagamento = [
    "Transferência Bancária",
    "Multicaixa",
    "Depósito",
    "Dinheiro",
  ];

  const statusPagamento = ["Pendente", "Confirmado", "Cancelado"];

  // ==================== MESES ====================
  const gerarMeses = () => {
    return [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
  };
  const mesesDisponiveis = gerarMeses();

  // ==================== MESES PAGOS PELO ALUNO ====================
  const getMesesPagosAluno = (alunoId) => {
    const pagamentosAluno = pagamentos.filter(
      (p) =>
        p.alunoId === Number(alunoId) &&
        p.tipo === "Propina" &&
        p.status === "Confirmado",
    );

    const mesesPagos = [];
    pagamentosAluno.forEach((p) => {
      if (p.mesesSelecionados && p.mesesSelecionados.length > 0) {
        p.mesesSelecionados.forEach((mes) => {
          if (!mesesPagos.includes(mes)) {
            mesesPagos.push(mes);
          }
        });
      } else if (p.mesReferencia) {
        if (!mesesPagos.includes(p.mesReferencia)) {
          mesesPagos.push(p.mesReferencia);
        }
      }
    });
    return mesesPagos;
  };

  // ==================== BUSCAR ALUNO ====================
  const handleBuscarAluno = (termo) => {
    setBuscaAluno(termo);
    if (termo.length > 1) {
      const filtrados = alunos.filter(
        (a) =>
          a.nome.toLowerCase().includes(termo.toLowerCase()) ||
          a.codigo.toLowerCase().includes(termo.toLowerCase()),
      );
      setAlunosFiltrados(filtrados);
      setMostrarResultados(true);
    } else {
      setAlunosFiltrados([]);
      setMostrarResultados(false);
    }
  };

  const handleSelecionarAluno = (aluno) => {
    setFormData({
      ...formData,
      alunoId: aluno.id,
      aluno: aluno.nome,
      mesesSelecionados: [],
      mesesPagos: 0,
    });
    setBuscaAluno(aluno.nome);
    setMostrarResultados(false);
    setAlunosFiltrados([]);
  };

  // ==================== TOGGLE MÊS ====================
  const handleToggleMes = (mes) => {
    const mesesPagos = getMesesPagosAluno(formData.alunoId);

    if (mesesPagos.includes(mes)) {
      mostrarAviso("info", `O mês ${mes} já foi pago.`);
      return;
    }

    const mesesSelecionados = formData.mesesSelecionados || [];
    let novosMeses;
    if (mesesSelecionados.includes(mes)) {
      novosMeses = mesesSelecionados.filter((m) => m !== mes);
    } else {
      novosMeses = [...mesesSelecionados, mes];
    }

    setFormData({
      ...formData,
      mesesSelecionados: novosMeses,
      mesesPagos: novosMeses.length,
    });
  };

  // ==================== NAVEGAÇÃO ====================
  const handleViewPagamento = (pagamento) => {
    setSelectedPagamento(pagamento);
    setViewMode("lista");
    setEditMode(false);
  };

  const handleNovoPagamento = () => {
    setFormData({
      alunoId: "",
      aluno: "",
      tipo: "",
      valor: "",
      valorBase: "",
      data: new Date().toISOString().split("T")[0],
      formaPagamento: "",
      referencia: `REC-${new Date().getFullYear()}-${String(pagamentos.length + 1).padStart(3, "0")}`,
      funcionario: "",
      status: "Pendente",
      mesReferencia: "",
      propinaMensal: "",
      mesesPagos: 0,
      mesesSelecionados: [],
      temMulta: false,
      multa: 0,
    });
    setBuscaAluno("");
    setAlunosFiltrados([]);
    setMostrarResultados(false);
    setViewMode("novo");
    setEditMode(false);
  };

  const handleEditPagamento = (pagamento) => {
    setFormData({
      ...pagamento,
      valorBase: pagamento.valorBase || pagamento.valor - (pagamento.multa || 0),
      mesesSelecionados: pagamento.mesesSelecionados || [],
      mesesPagos: pagamento.mesesPagos || 0,
      temMulta: (pagamento.multa || 0) > 0,
      multa: pagamento.multa || 0,
    });
    setBuscaAluno(pagamento.aluno);
    setSelectedPagamento(pagamento);
    setViewMode("novo");
    setEditMode(true);
  };

  const handleBackToList = () => {
    setViewMode("lista");
    setSelectedPagamento(null);
    setEditMode(false);
    setReciboGerado(null);
  };

  const handleViewPropinas = (alunoId, aluno) => {
    const pagamentosAluno = pagamentos.filter(
      (p) => p.alunoId === Number(alunoId) && p.tipo === "Propina",
    );
    const totalPago = pagamentosAluno
      .filter((p) => p.status === "Confirmado")
      .reduce((sum, p) => sum + p.valor, 0);
    const totalDevido = pagamentosAluno.length * 0;
    const emAtraso = pagamentosAluno.filter(
      (p) => p.status === "Pendente",
    ).length;

    setPropinasView({
      alunoId,
      aluno,
      mesesAtraso: emAtraso,
      valorTotal: totalDevido - totalPago,
    });
    setViewMode("propinas");
  };

  const handleViewRecibos = () => {
    setViewMode("recibos");
    setBuscaRecibos("");
  };

  const handleViewPendentes = () => {
    setViewMode("pendentes");
    setBuscaPendentes("");
  };

  // ==================== FORM CHANGE ====================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "temMulta") {
      setFormData({
        ...formData,
        temMulta: checked,
        multa: checked ? formData.multa || 0 : 0,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) || 0 : value,
    });
  };

  // ==================== CÁLCULO DO TOTAL COM MULTA ====================
  const calcularValorTotal = () => {
    let valorBase = 0;

    if (formData.tipo === "Propina") {
      const propinaMensal = parseFloat(formData.propinaMensal || 0);
      valorBase = propinaMensal * (formData.mesesSelecionados?.length || 0);
    } else {
      valorBase = parseFloat(formData.valorBase || formData.valor || 0);
    }

    const multa = formData.temMulta ? parseFloat(formData.multa || 0) : 0;
    return valorBase + multa;
  };

  // ==================== SUBMIT ====================
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.alunoId) {
      mostrarAviso("info", "Por favor, selecione um aluno.");
      return;
    }

    if (!formData.tipo) {
      mostrarAviso("info", "Por favor, selecione o tipo de pagamento.");
      return;
    }

    let valorBase = 0;
    let propinaMensal = 0;
    let mesesSelecionados = formData.mesesSelecionados || [];

    if (formData.tipo === "Propina") {
      propinaMensal = parseFloat(formData.propinaMensal || 0);
      valorBase = propinaMensal * (mesesSelecionados.length || 0);

      if (mesesSelecionados.length === 0) {
        mostrarAviso("info", "Por favor, selecione pelo menos um mês a pagar.");
        return;
      }

      if (propinaMensal <= 0) {
        mostrarAviso("info", "Por favor, informe o valor da propina mensal.");
        return;
      }
    } else {
      valorBase = parseFloat(formData.valorBase || formData.valor || 0);
      if (valorBase <= 0) {
        mostrarAviso("info", "Por favor, informe um valor válido.");
        return;
      }
    }

    const multa = formData.temMulta ? parseFloat(formData.multa || 0) : 0;

    if (formData.temMulta && multa <= 0) {
      mostrarAviso("info", "Por favor, informe o valor da multa.");
      return;
    }

    const valorTotal = valorBase + multa;

    const novoPagamento = {
      id: editMode ? formData.id : Date.now(),
      tipo: formData.tipo,
      valor: valorTotal,
      valorBase,
      multa,
      data: formData.data,
      formaPagamento: formData.formaPagamento,
      referencia: formData.referencia,
      funcionario: formData.funcionario,
      status: formData.status,
      mesReferencia:
        formData.tipo === "Propina" ? mesesSelecionados.join(", ") : null,
      propinaMensal: formData.tipo === "Propina" ? propinaMensal : null,
      mesesPagos: formData.tipo === "Propina" ? mesesSelecionados.length : 0,
      mesesSelecionados: formData.tipo === "Propina" ? mesesSelecionados : [],
    };

    if (editMode) {
      atualizarPagamento(formData.alunoId, novoPagamento);
      mostrarAviso("sucesso", "Pagamento atualizado com sucesso!");
    } else {
      adicionarPagamento(formData.alunoId, novoPagamento);
      mostrarAviso("sucesso", "Pagamento registado com sucesso!");
    }

    const alunoData = alunos.find((a) => a.id === Number(formData.alunoId));

    setReciboGerado({
      ...novoPagamento,
      aluno: formData.aluno,
      alunoId: formData.alunoId,
      codigo: alunoData?.codigo,
      bi: alunoData?.bi,
      encarregado: alunoData?.encarregado,
      contactoEncarregado: alunoData?.contactoEncarregado,
      classe: alunoData?.classe,
      turma: alunoData?.turma,
      anoLectivo: alunoData?.anoLectivo,
    });
    setViewMode("recibo");
  };

  // ==================== GERAR RECIBO ====================
  const handleGerarRecibo = (pagamento) => {
    setReciboGerado(pagamento);
    setViewMode("recibo");
  };

  // ==================== BAIXAR PDF ====================
  const handleBaixarPDF = async (pagamento) => {
    if (!reciboRef.current) {
      mostrarAviso("erro", "Erro ao gerar PDF. Recibo não encontrado.");
      return;
    }

    try {
      if (typeof html2pdf === "undefined") {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        document.body.appendChild(script);
        await new Promise((resolve) => (script.onload = resolve));
      }

      const element = reciboRef.current;
      const opt = {
        margin: 5,
        filename: `Recibo_${pagamento.referencia}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          width: element.scrollWidth,
          height: element.scrollHeight,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "landscape",
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      const btn = document.querySelector(".btn-download-pdf");
      if (btn) {
        btn.textContent = "⏳ A gerar...";
        btn.disabled = true;
      }

      await html2pdf().set(opt).from(element).save();

      if (btn) {
        btn.textContent = "📄 Baixar PDF";
        btn.disabled = false;
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      mostrarAviso("erro", "Erro ao gerar o PDF. Tente novamente.");
    }
  };

  // ==================== FILTROS ====================
  const pagamentosFiltrados = pagamentos.filter((p) => {
    const matchBusca =
      p.aluno.toLowerCase().includes(busca.toLowerCase()) ||
      p.referencia.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filterTipo === "todos" || p.tipo === filterTipo;
    const matchStatus = filterStatus === "todos" || p.status === filterStatus;
    return matchBusca && matchTipo && matchStatus;
  });

  const recibosFiltrados = pagamentos
    .filter((p) => p.status === "Confirmado")
    .filter((p) => {
      const matchBusca =
        p.aluno.toLowerCase().includes(buscaRecibos.toLowerCase()) ||
        p.referencia.toLowerCase().includes(buscaRecibos.toLowerCase());
      return matchBusca;
    });

  const pendentesFiltrados = pagamentos
    .filter((p) => p.status === "Pendente")
    .filter((p) => {
      const matchBusca =
        p.aluno.toLowerCase().includes(buscaPendentes.toLowerCase()) ||
        p.referencia.toLowerCase().includes(buscaPendentes.toLowerCase());
      return matchBusca;
    });

  // ==================== TOTAIS ====================
  const totalPagos = pagamentosFiltrados
    .filter((p) => p.status === "Confirmado")
    .reduce((sum, p) => sum + Number(p.valor), 0);

  const totalPendentes = pagamentosFiltrados
    .filter((p) => p.status === "Pendente")
    .reduce((sum, p) => sum + Number(p.valor), 0);

  const totalMultas = pagamentosFiltrados
    .filter((p) => (p.multa || 0) > 0)
    .reduce((sum, p) => sum + Number(p.multa), 0);

  // ==================== RESUMO POR TIPO ====================
  const resumoPorTipo = tiposPagamento.reduce((acc, tipo) => {
    const total = pagamentosFiltrados
      .filter((p) => p.tipo === tipo && p.status === "Confirmado")
      .reduce((sum, p) => sum + Number(p.valor), 0);
    const count = pagamentosFiltrados.filter(
      (p) => p.tipo === tipo && p.status === "Confirmado",
    ).length;
    if (count > 0) {
      acc[tipo] = { total, count };
    }
    return acc;
  }, {});

  // ==================== VIEW: RECIBO GERADO ====================
  if (viewMode === "recibo" && reciboGerado) {
    const pagamento = reciboGerado;

    return (
      <>
        <div className="pagamentos-container">
          <div className="pagamentos-header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              Recibo de Pagamento
            </h2>
            <div className="header-actions">
              <button className="btn-print" onClick={handlePrintRecibo}>
                <FaPrint /> Imprimir
              </button>
              <button
                className="btn-print btn-download-pdf"
                onClick={() => handleBaixarPDF(pagamento)}
              >
                <FaFilePdf /> Baixar PDF
              </button>
            </div>
          </div>
          <div className="print-modal-content">
            <ReciboUnificado
              ref={reciboRef}
              tipo="pagamento"
              dados={pagamento}
              aluno={{
                nome: pagamento.aluno,
                codigo:
                  pagamento.codigo ||
                  `AL-${String(pagamento.alunoId || 0).padStart(4, "0")}`,
                bi: pagamento.bi || "N/A",
                encarregado: pagamento.encarregado || "",
                contactoEncarregado: pagamento.contactoEncarregado || "",
                classe: pagamento.classe || "",
                turma: pagamento.turma || "",
                anoLectivo: pagamento.anoLectivo || "",
              }}
              referencia={pagamento.referencia}
              data={pagamento.data}
              valor={pagamento.valor}
              valorBase={pagamento.valorBase}
              multa={pagamento.multa}
              formaPagamento={pagamento.formaPagamento}
              funcionario={pagamento.funcionario}
              status={pagamento.status}
              servico={pagamento.tipo}
              anoLectivo={pagamento.anoLectivo}
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

  // ==================== VIEW: NOVO/EDITAR PAGAMENTO ====================
  if (viewMode === "novo") {
    const mesesPagosAluno = formData.alunoId
      ? getMesesPagosAluno(formData.alunoId)
      : [];
    const valorBase =
      formData.tipo === "Propina"
        ? parseFloat(formData.propinaMensal || 0) *
          (formData.mesesSelecionados?.length || 0)
        : parseFloat(formData.valorBase || formData.valor || 0);
    const multaAplicada = formData.temMulta
      ? parseFloat(formData.multa || 0)
      : 0;
    const valorTotal = valorBase + multaAplicada;

    return (
      <>
        <div className="container">
          <div className="header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              {editMode ? "Editar Pagamento" : "Novo Pagamento"}
            </h2>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* PESQUISA DE ALUNO */}
                <div className="form-group">
                  <label>Pesquisar Aluno</label>
                  <div className="search-aluno-container">
                    <input
                      type="text"
                      placeholder="Digite o nome ou código do aluno..."
                      value={buscaAluno}
                      onChange={(e) => handleBuscarAluno(e.target.value)}
                      className="search-aluno-input"
                      autoComplete="off"
                    />
                    {mostrarResultados && alunosFiltrados.length > 0 && (
                      <div className="resultados-alunos">
                        {alunosFiltrados.map((aluno) => {
                          const mesesPagos = getMesesPagosAluno(aluno.id);
                          return (
                            <div
                              key={aluno.id}
                              className="resultado-aluno-item"
                              onClick={() => handleSelecionarAluno(aluno)}
                            >
                              <span className="codigo">{aluno.codigo}</span>
                              <span className="nome">{aluno.nome}</span>
                              <span className="meses-pagos-info">
                                {mesesPagos.length > 0
                                  ? `${mesesPagos.length} meses pagos`
                                  : "Sem pagamentos"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ALUNO SELECIONADO */}
                <div className="form-group">
                  <label>Aluno Selecionado</label>
                  <input
                    type="text"
                    name="aluno"
                    value={formData.aluno}
                    readOnly
                    className="aluno-selecionado"
                    placeholder="Selecione um aluno acima"
                  />
                </div>

                {/* TIPO DE PAGAMENTO */}
                <div className="form-group">
                  <label>Tipo de Pagamento</label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {tiposPagamento.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PROPINA: SELEÇÃO DE MESES */}
                {formData.tipo === "Propina" && (
                  <>
                    <div className="form-group full-width">
                      <label>
                        <FaBook /> Selecione os Meses a Pagar
                      </label>
                      <div className="meses-grid">
                        {mesesDisponiveis.map((mes) => {
                          const isPago = mesesPagosAluno.includes(mes);
                          const isSelecionado = (
                            formData.mesesSelecionados || []
                          ).includes(mes);
                          return (
                            <label
                              key={mes}
                              className={`mes-checkbox ${isPago ? "pago" : ""} ${isSelecionado ? "selecionado" : ""}`}
                              onClick={(e) => {
                                if (isPago) {
                                  e.preventDefault();
                                  mostrarAviso(
                                    "info",
                                    `O mês ${mes} já foi pago.`,
                                  );
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelecionado}
                                onChange={() => handleToggleMes(mes)}
                                disabled={isPago}
                              />
                              <span>{mes}</span>
                              {isPago && (
                                <span className="pago-badge">✓ Pago</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Propina Mensal (Kz)</label>
                      <input
                        type="number"
                        name="propinaMensal"
                        value={formData.propinaMensal}
                        onChange={handleChange}
                        placeholder="Valor da propina mensal"
                        min="0"
                        required
                      />
                    </div>
                  </>
                )}

                {/* VALOR BASE (não-propina) */}
                {formData.tipo !== "Propina" && formData.tipo !== "" && (
                  <div className="form-group">
                    <label>Valor Base (Kz)</label>
                    <input
                      type="number"
                      name="valorBase"
                      value={formData.valorBase}
                      onChange={handleChange}
                      placeholder="Valor sem multa"
                      min="0"
                      required
                    />
                  </div>
                )}

                {/* SECÇÃO DE MULTA */}
                {formData.tipo === "Propina" && (
                  <div className="form-group full-width multa-section">
                    <div className="multa-header">
                      <label className="checkbox-label multa-toggle">
                        <input
                          type="checkbox"
                          name="temMulta"
                          checked={formData.temMulta}
                          onChange={handleChange}
                        />
                        <FaExclamationTriangle
                          style={{
                            color: formData.temMulta ? "#f39c12" : "#7f8c8d",
                            marginRight: "0.4rem",
                          }}
                        />
                        <strong>Aplicar Multa por Atraso</strong>
                      </label>
                      <span className="multa-info">
                        <FaInfoCircle /> Use quando o aluno pagar após o prazo
                        estipulado
                      </span>
                    </div>

                    {formData.temMulta && (
                      <div className="multa-fields">
                        <div className="form-group full-width">
                          <label>
                            <FaCalculator /> Valor da Multa (Kz)
                          </label>
                          <input
                            type="number"
                            name="multa"
                            value={formData.multa}
                            onChange={handleChange}
                            placeholder="Valor da multa"
                            min="0"
                            step="100"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* RESUMO DO VALOR */}
                {formData.tipo && (
                  <div className="form-group full-width resumo-valor">
                    <div className="resumo-row">
                      <span>Valor Base:</span>
                      <strong>
                        Kz{" "}
                        {valorBase.toLocaleString("pt-PT", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </div>
                    {formData.temMulta && (
                      <div className="resumo-row multa-row">
                        <span>
                          <FaExclamationTriangle /> Multa:
                        </span>
                        <strong>
                          + Kz{" "}
                          {multaAplicada.toLocaleString("pt-PT", {
                            minimumFractionDigits: 2,
                          })}
                        </strong>
                      </div>
                    )}
                    <div className="resumo-row total-row">
                      <span>TOTAL A PAGAR:</span>
                      <strong>
                        Kz{" "}
                        {valorTotal.toLocaleString("pt-PT", {
                          minimumFractionDigits: 2,
                        })}
                      </strong>
                    </div>
                  </div>
                )}

                {/* DATA */}
                <div className="form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* FORMA DE PAGAMENTO */}
                <div className="form-group">
                  <label>Forma de Pagamento</label>
                  <select
                    name="formaPagamento"
                    value={formData.formaPagamento}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {formasPagamento.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* REFERÊNCIA */}
                <div className="form-group">
                  <label>Referência/Recibo</label>
                  <input
                    type="text"
                    name="referencia"
                    value={formData.referencia}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* FUNCIONÁRIO */}
                <div className="form-group">
                  <label>Funcionário Responsável</label>
                  <input
                    type="text"
                    name="funcionario"
                    value={formData.funcionario}
                    onChange={handleChange}
                    placeholder="Nome do funcionário"
                    required
                  />
                </div>

                {/* STATUS */}
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {statusPagamento.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <FaSave /> {editMode ? "Atualizar" : "Registrar"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleBackToList}
                >
                  <FaTimesCircle /> Cancelar
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

  // ==================== VIEW: PROPINAS ====================
  if (viewMode === "propinas") {
    return (
      <>
        <div className="pagamentos-container">
          <div className="pagamentos-header">
            <h2 style={{fontWeight:'bold' , fontSize:'32.5px'}}>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              Propinas - {propinasView.aluno}
            </h2>
          </div>

          <div className="propinas-container">
            <div className="propinas-table">
              <h3>
                Histórico de Pagamentos
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Valor Base</th>
                    <th>Multa</th>
                    <th>Total</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Referência</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentos
                    .filter(
                      (p) =>
                        p.alunoId === Number(propinasView.alunoId) &&
                        p.tipo === "Propina",
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>{p.mesReferencia || "N/A"}</td>
                        <td>
                          Kz{" "}
                          {(p.valorBase || p.valor - (p.multa || 0)).toLocaleString()}
                        </td>
                        <td>
                          {(p.multa || 0) > 0 ? (
                            <span className="multa-badge">
                              Kz {p.multa.toLocaleString()}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <strong>Kz {p.valor.toLocaleString()}</strong>
                        </td>
                        <td>{new Date(p.data).toLocaleDateString("pt-AO")}</td>
                        <td>
                          <span
                            className={`estado-badge ${p.status.toLowerCase()}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <span className="codigo-badge">{p.referencia}</span>
                        </td>
                      </tr>
                    ))}
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

  // ==================== VIEW: RECIBOS ====================
  if (viewMode === "recibos") {
    return (
      <>
        <div className="pagamentos-container">
          <div className="pagamentos-header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              <FaReceipt /> Recibos
            </h2>
          </div>

          <div className="recibos-container">
            <div className="recibos-actions">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por aluno ou referência..."
                  value={buscaRecibos}
                  onChange={(e) => setBuscaRecibos(e.target.value)}
                />
              </div>
            </div>

            <div className="table-container">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Recibo</th>
                      <th>Aluno</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recibosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="codigo-badge">{p.referencia}</span>
                        </td>
                        <td>{p.aluno}</td>
                        <td>{p.tipo}</td>
                        <td>Kz {p.valor.toLocaleString()}</td>
                        <td>{new Date(p.data).toLocaleDateString("pt-AO")}</td>
                        <td className="actions">
                          <button
                            className="btn-view"
                            onClick={() => handleGerarRecibo(p)}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="btn-print"
                            onClick={() => handleGerarRecibo(p)}
                          >
                            <FaPrint />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

  // ==================== VIEW: PENDENTES ====================
  if (viewMode === "pendentes") {
    return (
      <>
        <div className="pagamentos-container">
          <div className="pagamentos-header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              <FaHourglassHalf /> Pagamentos Pendentes
            </h2>
          </div>

          <div className="pendentes-container">
            <div className="table-container">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Mês Referência</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendentesFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.aluno}</strong>
                        </td>
                        <td>{p.tipo}</td>
                        <td>Kz {p.valor.toLocaleString()}</td>
                        <td>{p.mesReferencia || "N/A"}</td>
                        <td>{new Date(p.data).toLocaleDateString("pt-AO")}</td>
                        <td className="actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditPagamento(p)}
                          >
                            <FaPen />
                          </button>
                          <button
                            className="btn-receipt"
                            onClick={() => handleGerarRecibo(p)}
                          >
                            <FaReceipt />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

  // ==================== VIEW: LISTA PRINCIPAL ====================
  return (
    <>
      <div className="pagamentos-container">
        <div className="pagamentos-header">
          <h1 style={{fontWeight:'bold' , fontSize:'32.5px'}}>
            Gestão de Pagamentos
          </h1>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por aluno ou referência..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button className="btn-add" onClick={handleNovoPagamento}>
              <FaPlusCircle /> Novo Pagamento
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="filters-container">
          <div className="filter-group">
            <label>Tipo:</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="todos">Todos os tipos</option>
              {tiposPagamento.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              {statusPagamento.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn-recibos" onClick={handleViewRecibos}>
              <FaReceipt /> Recibos
            </button>
            <button className="btn-pendentes" onClick={handleViewPendentes}>
              <FaHourglassHalf /> Pendentes
            </button>
          </div>
        </div>

        {/* RESUMO FINANCEIRO */}
        <div className="resumo-pagamentos" style={{display:'flex', gap:'50px' , justifyContent:'space-between'}}>
          <div className="resumo-item">
            <span className="label">Total Pago:</span>
            <span className="value positive">
              Kz {totalPagos.toLocaleString()}
            </span>
          </div>
          <div className="resumo-item">
            <span className="label">Total Pendente:</span>
            <span className="value negative">
              Kz {totalPendentes.toLocaleString()}
            </span>
          </div>
          {totalMultas > 0 && (
            <div className="resumo-item">
              <span className="label">
                Total Multas:
              </span>
              <span className="value warning">
                Kz {totalMultas.toLocaleString()}
              </span>
            </div>
          )}
          <div className="resumo-item">
            <span className="label">Total Geral:</span>
            <span className="value">
              Kz {(totalPagos + totalPendentes).toLocaleString()}
            </span>
          </div>
        </div>

        {/* RESUMO POR TIPO DE PAGAMENTO */}
        {Object.keys(resumoPorTipo).length > 0 && (
          <div className="resumo-por-tipo">
            <h4>
              Resumo por Tipo (Confirmados)
            </h4>
            <div className="resumo-tipo-grid">
              {Object.entries(resumoPorTipo).map(([tipo, { total, count }]) => (
                <div key={tipo} className="resumo-tipo-card">
                  <span className="tipo-nome">{tipo}</span>
                  <span className="tipo-valor">Kz {total.toLocaleString()}</span>
                  <span className="tipo-count">{count} pagamento(s)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABELA PRINCIPAL */}
        <div className="table-container">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Tipo</th>
                  <th>Valor Base</th>
                  <th>Multa</th>
                  <th>Total</th>
                  <th>Data</th>
                  <th>Mês</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-message">
                      Nenhum pagamento encontrado
                    </td>
                  </tr>
                ) : (
                  pagamentosFiltrados.map((pagamento) => (
                    <tr key={pagamento.id}>
                      <td>
                        <strong>{pagamento.aluno}</strong>
                      </td>
                      <td>
                        <span
                          className={`tipo-badge tipo-${pagamento.tipo.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          {pagamento.tipo}
                        </span>
                      </td>
                      <td>
                        Kz{" "}
                        {(
                          pagamento.valorBase ||
                          pagamento.valor - (pagamento.multa || 0)
                        ).toLocaleString()}
                      </td>
                      <td>
                        {(pagamento.multa || 0) > 0 ? (
                          <span className="multa-badge">
                            Kz {pagamento.multa.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <strong>Kz {pagamento.valor.toLocaleString()}</strong>
                      </td>
                      <td>
                        {new Date(pagamento.data).toLocaleDateString("pt-AO")}
                      </td>
                      <td>{pagamento.mesReferencia || "-"}</td>
                      <td>
                        <span
                          className={`estado-badge ${pagamento.status.toLowerCase()}`}
                        >
                          {pagamento.status}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEditPagamento(pagamento)}
                          style={{padding:'8px 13px', backgroundColor:'#0a0909', fontWeight:'600'}}
                        >
                          Editar
                        </button>
                        {pagamento.tipo === "Propina" && (
                          <button
                            className="btn-propina"
                            onClick={() =>
                              handleViewPropinas(
                                pagamento.alunoId,
                                pagamento.aluno,
                              )
                            }
                            style={{padding:'8px 13px', backgroundColor:'#5d585848', fontWeight:'600'}}
                            >
                            Ver Propinas
                          </button>
                        )}
                        {pagamento.status === "Confirmado" && (
                          <button
                            className="btn-receipt"
                            onClick={() => handleGerarRecibo(pagamento)}
                            style={{padding:'8px 13px', backgroundColor:'#5d585848', fontWeight:'600'}}
                          >
                            Recibo
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

export default Pagamentos;