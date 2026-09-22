import React, { useState, useRef, useEffect, Fragment } from "react";
import "./Matriculas.css";
import {
  FaSearch,
  FaPlus,
  FaSave,
  FaTimes,
  FaUser,
  FaEye,
  FaArrowLeft,
  FaExchangeAlt,
  FaUserPlus,
  FaPrint,
  FaUserCheck,
  FaEdit,
  FaClock,
  FaBuilding,
  FaMoneyBill,
  FaInfoCircle,
  FaUsers,
  FaSpinner,
  FaUserGraduate,
  FaCheckCircle,
  FaRegFilePdf,
  FaAddressBook,
  FaSchool,
  FaEnvelope,
  FaPhone,
  FaChevronRight,
  FaChevronLeft,
  FaCalendarAlt,
  FaIdCard,
  FaTrash,
  FaUserTie,
} from "react-icons/fa";
import { useReactToPrint } from "react-to-print";
import { useSchool } from "../context/SchoolContext";
import ReciboUnificado from "./ReciboUnificado";

const Matriculas = () => {
  const {
    alunos,
    setAlunos,
    matriculas,
    setMatriculas,
    confirmacoes,
    setConfirmacoes,
    adicionarAlunoEMatricula,
    classes: classesContexto,
    anosLectivos: anosLectivosContexto,
    transferirMatricula,
    cancelarMatricula,
    renovarMatricula,
    confirmarReconfirmacao,
    rejeitarReconfirmacao,
    removerConfirmacao,
    atualizarAluno,
    solicitarConfirmacao,
    atualizarConfirmacao,
    adicionarPagamento,
  } = useSchool();

  const [activeTab, setActiveTab] = useState("matriculas");
  const [viewMode, setViewMode] = useState("lista");
  const [aEnviarMatricula, setAEnviarMatricula] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState(null);
  const [busca, setBusca] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [filtroStatusConfirmacao, setFiltroStatusConfirmacao] =
    useState("todos");
  const [filtroAnoConfirmacao, setFiltroAnoConfirmacao] = useState("");
  const [buscaConfirmacao, setBuscaConfirmacao] = useState("");
  const [selecionadosConfirmacao, setSelecionadosConfirmacao] = useState([]);
  const [showConfirmacaoPrint, setShowConfirmacaoPrint] = useState(false);
  const [confirmacaoRealizada, setConfirmacaoRealizada] = useState(null);
  const confirmacaoPrintRef = useRef();

  const [pesquisaAluno, setPesquisaAluno] = useState("");
  const [resultadosPesquisa, setResultadosPesquisa] = useState([]);
  const [modoPesquisa, setModoPesquisa] = useState(false);
  const [alunoSelecionadoPesquisa, setAlunoSelecionadoPesquisa] =
    useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [pesquisando, setPesquisando] = useState(false);
  const [indiceSugestao, setIndiceSugestao] = useState(-1);
  const inputPesquisaRef = useRef(null);

  const [viewReciboConfirmacao, setViewReciboConfirmacao] = useState(null);
  const viewReciboPrintRef = useRef();

  const [confirmacaoData, setConfirmacaoData] = useState({
    id: null,
    alunoId: "",
    aluno: "",
    codigo: "",
    classeActual: "",
    turmaActual: "",
    anoLectivoActual: "",
    novaClasse: "",
    novaTurma: "",
    novoAnoLectivo: "",
    periodo: "",
    status: "Confirmado",
    dataConfirmacao: new Date().toISOString().split("T")[0],
    valorMensalidade: 25000,
    observacoes: "",
  });

  const [formData, setFormData] = useState({
    nome: "",
    sexo: "",
    dataNascimento: "",
    bi: "",
    encarregado: "",
    contactoEncarregado: "",
    emailEncarregado: "",
    parentesco: "",
    turma: "",
    classe: "",
    anoLectivo: "2026/2027",
    estado: "Ativo",
    dataMatricula: new Date().toISOString().split("T")[0],
    turno: "",
    taxaMatricula: "",
    estadoPagamento: "",
    formaPagamento: "",
    funcionario: "", // ✅ NOVO
    observacoes: "",
  });

  // ✅ Estado para modal de transferência
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [transferData, setTransferData] = useState({
    matriculaId: null,
    novaTurma: "",
    motivo: "",
    dataTransferencia: new Date().toISOString().split("T")[0],
  });

  const [showMatriculaPrint, setShowMatriculaPrint] = useState(false);
  const [matriculaReciboData, setMatriculaReciboData] = useState(null);
  const matriculaPrintRef = useRef();

  const CLASSES_FALLBACK = [
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
  const TURMAS_FALLBACK = ["A", "B", "C"];
  const ANOS_LECTIVOS_FALLBACK = ["2026/2027", "2027/2028", "2028/2029"];

  // Prioridade: classes/turmas/anos lectivos reais da base de dados; só usa a lista fixa
  // enquanto ainda não houver nenhuma classe/ano lectivo cadastrado.
  const classes = classesContexto && classesContexto.length > 0
    ? classesContexto.map((c) => c.nome)
    : CLASSES_FALLBACK;
  const turmas = classesContexto && classesContexto.length > 0
    ? [...new Set(classesContexto.flatMap((c) => (c.turmas || []).map((t) => t.nome)))]
    : TURMAS_FALLBACK;
  const turnos = ["Manhã", "Tarde", "Noite"];
  const anosLectivos = anosLectivosContexto && anosLectivosContexto.length > 0
    ? anosLectivosContexto.map((a) => a.ano)
    : ANOS_LECTIVOS_FALLBACK;
  const estadosPagamento = ["Pago", "Pendente", "Parcial"];
  const sexos = ["Masculino", "Feminino"];
  const parentescos = ["Pai", "Mãe", "Outro"];
  const statusAluno = ["Ativo", "Inativo", "Transferido", "Concluído"];
  const statusConfirmacao = ["Confirmado", "Pendente", "Cancelado"];
  const periodos = ["Manhã", "Tarde", "Integral"];
  const stepNames = ["Dados Pessoais", "Encarregado", "Dados Académicos"];

  const gerarCodigoAluno = () => {
    const ano = new Date().getFullYear();
    const proximoId = (alunos?.length || 0) + 1;
    return `AL-${ano}-${String(proximoId).padStart(3, "0")}`;
  };

  const handlePrintConfirmacao = useReactToPrint({
    contentRef: confirmacaoPrintRef,
    documentTitle: "Recibo_Confirmacao",
  });

  const handlePrintMatricula = useReactToPrint({
    contentRef: matriculaPrintRef,
    documentTitle: "Recibo_Matricula",
  });

  const handlePrintViewRecibo = useReactToPrint({
    contentRef: viewReciboPrintRef,
    documentTitle: "Recibo_Confirmacao",
  });

  // ==================== SUGESTÕES DE PESQUISA ====================
  useEffect(() => {
    if (modoPesquisa && pesquisaAluno.trim().length >= 2) {
      const termo = pesquisaAluno.toLowerCase().trim();
      const alunosAtivos = (alunos || []).filter((a) => a.estado === "Ativo");

      const sugestoesFiltradas = alunosAtivos.filter(
        (aluno) =>
          aluno.nome.toLowerCase().includes(termo) ||
          (aluno.codigo && aluno.codigo.toLowerCase().includes(termo)),
      );

      sugestoesFiltradas.sort((a, b) => {
        const aStarts = a.nome.toLowerCase().startsWith(termo);
        const bStarts = b.nome.toLowerCase().startsWith(termo);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.nome.localeCompare(b.nome);
      });

      setSugestoes(sugestoesFiltradas.slice(0, 10));
      setMostrarSugestoes(sugestoesFiltradas.length > 0);
      setIndiceSugestao(-1);
    } else {
      setSugestoes([]);
      setMostrarSugestoes(false);
      setIndiceSugestao(-1);
    }
  }, [pesquisaAluno, modoPesquisa, alunos]);

  const handleKeyDownPesquisa = (e) => {
    if (!mostrarSugestoes || sugestoes.length === 0) {
      if (e.key === "Enter") {
        handlePesquisarAluno(e);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIndiceSugestao((prev) =>
          prev < sugestoes.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setIndiceSugestao((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (indiceSugestao >= 0 && indiceSugestao < sugestoes.length) {
          selecionarSugestao(sugestoes[indiceSugestao]);
        } else {
          handlePesquisarAluno(e);
        }
        break;
      case "Escape":
        setMostrarSugestoes(false);
        setIndiceSugestao(-1);
        break;
      default:
        break;
    }
  };

  const selecionarSugestao = (aluno) => {
    setPesquisaAluno(aluno.nome);
    setSugestoes([]);
    setMostrarSugestoes(false);
    setIndiceSugestao(-1);
    setResultadosPesquisa([aluno]);
  };

  const handlePesquisarAluno = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!pesquisaAluno.trim()) {
      alert("Digite o nome ou código do aluno para pesquisar");
      return;
    }

    setPesquisando(true);

    const termo = pesquisaAluno.toLowerCase().trim();
    const resultados = (alunos || []).filter(
      (aluno) =>
        aluno.estado === "Ativo" &&
        (aluno.nome.toLowerCase().includes(termo) ||
          (aluno.codigo && aluno.codigo.toLowerCase().includes(termo))),
    );

    setResultadosPesquisa(resultados);
    setSugestoes([]);
    setMostrarSugestoes(false);
    setPesquisando(false);

    if (resultados.length === 0) {
      alert("Nenhum aluno ativo encontrado com esse nome ou código");
    }
  };

  // ==================== NAVEGAÇÃO ====================
  const handleBackToList = () => {
    setViewMode("lista");
    setSelectedMatricula(null);
    setEditMode(false);
    setModoPesquisa(false);
    setResultadosPesquisa([]);
    setAlunoSelecionadoPesquisa(null);
    setPesquisaAluno("");
    setSugestoes([]);
    setMostrarSugestoes(false);
    setShowConfirmacaoPrint(false);
    setConfirmacaoRealizada(null);
    setShowMatriculaPrint(false);
    setMatriculaReciboData(null);
    setViewReciboConfirmacao(null);
    setCurrentStep(0);
    setShowTransferModal(false);
  };

  const handleViewMatricula = (matricula) => {
    setSelectedMatricula(matricula);
    setViewMode("lista");
    setEditMode(false);
  };

  const handleNovaMatricula = () => {
    const codigoGerado = gerarCodigoAluno();
    setFormData({
      nome: "",
      codigo: codigoGerado,
      sexo: "",
      dataNascimento: "",
      bi: "",
      encarregado: "",
      contactoEncarregado: "",
      emailEncarregado: "",
      parentesco: "",
      turma: "",
      classe: "",
      anoLectivo: "",
      estado: "Ativo",
      dataMatricula: new Date().toISOString().split("T")[0],
      turno: "",
      taxaMatricula: "",
      estadoPagamento: "Pendente",
      formaPagamento: "Dinheiro",
      funcionario: "",
      observacoes: "",
    });
    setViewMode("nova");
    setEditMode(false);
    setCurrentStep(0);
  };

  // ==================== ✅ TRANSFERÊNCIA (FUNCIONAL) ====================
  const handleTransferencia = (matricula) => {
    setSelectedMatricula(matricula);
    setTransferData({
      matriculaId: matricula.id,
      novaTurma: matricula.turma || "",
      motivo: "",
      dataTransferencia: new Date().toISOString().split("T")[0],
    });
    setShowTransferModal(true);
  };

  const handleSubmitTransferencia = (e) => {
    e.preventDefault();

    if (!transferData.novaTurma) {
      alert("Por favor, selecione a nova turma.");
      return;
    }

    if (transferData.novaTurma === selectedMatricula?.turma) {
      alert("A nova turma é igual à turma atual. Selecione uma turma diferente.");
      return;
    }

    const matricula = (matriculas || []).find(
      (m) => m.id === transferData.matriculaId,
    );

    if (matricula) {
      const historico = [...(matricula.historicoTransferencias || [])];
      historico.push({
        data: transferData.dataTransferencia,
        deTurma: matricula.turma,
        paraTurma: transferData.novaTurma,
        motivo: transferData.motivo,
      });

      // ✅ Atualizar matrícula
      setMatriculas(
        (matriculas || []).map((m) =>
          m.id === transferData.matriculaId
            ? {
                ...m,
                turma: transferData.novaTurma,
                historicoTransferencias: historico,
              }
            : m,
        ),
      );

      // ✅ Atualizar aluno
      setAlunos(
        (alunos || []).map((a) =>
          a.id === matricula.alunoId
            ? {
                ...a,
                turma: transferData.novaTurma,
                historico: [
                  ...(a.historico || []),
                  {
                    data: transferData.dataTransferencia,
                    acao: "Transferência de Turma",
                    detalhes: `Transferido da Turma ${matricula.turma} para a Turma ${transferData.novaTurma}`,
                  },
                ],
              }
            : a,
        ),
      );

      alert(
        `✅ Aluno transferido com sucesso da Turma ${matricula.turma} para a Turma ${transferData.novaTurma}!`,
      );
    }

    setShowTransferModal(false);
    setSelectedMatricula(null);
  };

  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
    setSelectedMatricula(null);
    setTransferData({
      matriculaId: null,
      novaTurma: "",
      motivo: "",
      dataTransferencia: new Date().toISOString().split("T")[0],
    });
  };

  // ==================== ✅ CANCELAR MATRÍCULA (REMOVE DA LISTA) ====================
  const handleCancelarMatricula = (matricula) => {
    if (
      window.confirm(
        `⚠️ Tem certeza que deseja cancelar a matrícula ${matricula.numero}?\n\nO aluno ${matricula.aluno} será removido da lista de matrículas ativas.`,
      )
    ) {
      // ✅ Remover a matrícula da lista (não apenas marcar como cancelada)
      setMatriculas((matriculas || []).filter((m) => m.id !== matricula.id));

      // ✅ Atualizar confirmações pendentes relacionadas
      setConfirmacoes(
        (confirmacoes || []).map((c) =>
          c.alunoId === matricula.alunoId && c.status === "Pendente"
            ? { ...c, status: "Cancelado" }
            : c,
        ),
      );

      // ✅ Atualizar o aluno com o estado "Inativo"
      setAlunos(
        (alunos || []).map((a) =>
          a.id === matricula.alunoId
            ? {
                ...a,
                estado: "Inativo",
                historico: [
                  ...(a.historico || []),
                  {
                    data: new Date().toISOString().split("T")[0],
                    acao: "Matrícula Cancelada",
                    detalhes: `Matrícula ${matricula.numero} cancelada. Aluno desativado.`,
                  },
                ],
              }
            : a,
        ),
      );

      if (selectedMatricula && selectedMatricula.id === matricula.id) {
        setSelectedMatricula(null);
      }

      alert(`✅ Matrícula ${matricula.numero} cancelada com sucesso!`);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!formData.nome || !formData.bi) {
        alert("Por favor, preencha Nome e B.I. antes de continuar.");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ==================== SUBMIT MATRÍCULA (via API) ====================
  const handleSubmitMatricula = async (e) => {
    e.preventDefault();

    if (
      !formData.nome ||
      !formData.bi ||
      !formData.classe ||
      !formData.turma ||
      !formData.turno
    ) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const biExistente = (alunos || []).find((a) => a.bi === formData.bi);
    if (biExistente) {
      alert(
        `O B.I. ${formData.bi} já está cadastrado para o aluno ${biExistente.nome}.`,
      );
      return;
    }

    setAEnviarMatricula(true);

    const alunoData = {
      nome: formData.nome,
      sexo: formData.sexo || "",
      dataNascimento: formData.dataNascimento || "",
      bi: formData.bi,
      encarregado: formData.encarregado || "",
      contactoEncarregado: formData.contactoEncarregado || "",
      emailEncarregado: formData.emailEncarregado || "",
      parentesco: formData.parentesco || "",
      turma: formData.turma,
      classe: formData.classe,
      estado: formData.estado || "Ativo",
      dataMatricula: formData.dataMatricula,
    };

    const matriculaData = {
      anoLectivo: formData.anoLectivo,
      classe: formData.classe,
      turma: formData.turma,
      turno: formData.turno,
      dataMatricula: formData.dataMatricula,
      taxaMatricula: Number(formData.taxaMatricula) || 25000,
      estadoPagamento: formData.estadoPagamento,
      formaPagamento: formData.formaPagamento || "Dinheiro",
      funcionario: formData.funcionario || "Sistema",
      observacoes: formData.observacoes || "",
    };

    const resultado = await adicionarAlunoEMatricula(alunoData, matriculaData);

    setAEnviarMatricula(false);

    if (!resultado || !resultado.success) {
      alert(
        `Não foi possível criar a matrícula: ${resultado?.message || "erro desconhecido"}`,
      );
      return;
    }

    const { aluno: novoAluno, matricula: novaMatricula } = resultado;

    // Reconfirmação pendente para o próximo ano lectivo (ainda local — sem endpoint ligado)
    const proximoAno = (parseInt(formData.anoLectivo) + 1).toString();
    const novaConfirmacaoPendente = {
      id: (confirmacoes || []).length + 1,
      alunoId: novoAluno.id,
      aluno: formData.nome,
      codigo: novoAluno.codigo,
      classeActual: formData.classe,
      turmaActual: formData.turma,
      novaClasse: formData.classe,
      novaTurma: formData.turma,
      novoAnoLectivo: proximoAno,
      periodo: formData.turno || "Manhã",
      status: "Pendente",
      dataConfirmacao: null,
      valorMensalidade: 25000,
      observacoes: "Reconfirmação pendente gerada automaticamente na matrícula",
    };
    setConfirmacoes([...(confirmacoes || []), novaConfirmacaoPendente]);

    const pagamentoMatricula = {
      data: formData.dataMatricula || new Date().toISOString().split("T")[0],
      valor: Number(formData.taxaMatricula) || 25000,
      status: formData.estadoPagamento === "Pago" ? "Confirmado" : "Pendente",
      referencia: novaMatricula.numero,
      mesReferencia: `Matrícula ${formData.anoLectivo}`,
      tipo: "Matrícula",
      formaPagamento: formData.formaPagamento || "Dinheiro",
      funcionario: formData.funcionario || "Sistema",
    };

    setMatriculaReciboData({
      aluno: novoAluno,
      matricula: novaMatricula,
      pagamento: pagamentoMatricula,
    });
    setShowMatriculaPrint(true);
    setViewMode("lista");
    setEditMode(false);
    setCurrentStep(0);
  };

  const handleSubmitRenovacao = (e) => {
    e.preventDefault();
    const matriculaAtualizada = {
      ...selectedMatricula,
      ...formData,
      dataRenovacao: new Date().toISOString().split("T")[0],
      estado: "Ativa",
    };
    setMatriculas(
      (matriculas || []).map((m) =>
        m.id === selectedMatricula.id ? matriculaAtualizada : m,
      ),
    );

    setAlunos(
      (alunos || []).map((a) =>
        a.id === selectedMatricula.alunoId
          ? {
              ...a,
              classe: formData.classe,
              turma: formData.turma,
              anoLectivo: formData.anoLectivo,
            }
          : a,
      ),
    );

    setViewMode("lista");
    setSelectedMatricula(null);
  };

  // ==================== CONFIRMAÇÃO ====================
  const handleAbrirConfirmacao = (aluno) => {
    if (!aluno) return;

    const confirmacaoExistente = (confirmacoes || []).find(
      (c) => c.alunoId === aluno.id,
    );

    if (confirmacaoExistente) {
      setConfirmacaoData({
        id: confirmacaoExistente.id,
        alunoId: confirmacaoExistente.alunoId,
        aluno: confirmacaoExistente.aluno,
        codigo: confirmacaoExistente.codigo,
        classeActual: aluno.classe,
        turmaActual: aluno.turma,
        anoLectivoActual: aluno.anoLectivo,
        novaClasse: confirmacaoExistente.novaClasse,
        novaTurma: confirmacaoExistente.novaTurma,
        novoAnoLectivo: confirmacaoExistente.novoAnoLectivo,
        periodo: confirmacaoExistente.periodo,
        status: confirmacaoExistente.status,
        dataConfirmacao:
          confirmacaoExistente.dataConfirmacao ||
          new Date().toISOString().split("T")[0],
        valorMensalidade: confirmacaoExistente.valorMensalidade || 25000,
        observacoes: confirmacaoExistente.observacoes || "",
      });
    } else {
      const anoActual = parseInt(aluno.anoLectivo) || new Date().getFullYear();
      setConfirmacaoData({
        id: null,
        alunoId: aluno.id,
        aluno: aluno.nome,
        codigo: aluno.codigo,
        classeActual: aluno.classe,
        turmaActual: aluno.turma,
        anoLectivoActual: aluno.anoLectivo,
        novaClasse: aluno.classe,
        novaTurma: aluno.turma,
        novoAnoLectivo: `${anoActual + 1}/${anoActual + 2}`,
        periodo: "Manhã",
        status: "Confirmado",
        dataConfirmacao: new Date().toISOString().split("T")[0],
        valorMensalidade: 25000,
        observacoes: "",
      });
    }
    setModoPesquisa(false);
    setSugestoes([]);
    setMostrarSugestoes(false);
    setPesquisaAluno("");
    setResultadosPesquisa([]);
    setViewMode("confirmacao");
  };

  const handleConfirmacaoChange = (e) => {
    const { name, value } = e.target;
    setConfirmacaoData({ ...confirmacaoData, [name]: value });
  };

  const handleSalvarConfirmacao = (e) => {
    if (e) e.preventDefault();

    if (
      !confirmacaoData.novaClasse ||
      !confirmacaoData.novaTurma ||
      !confirmacaoData.novoAnoLectivo
    ) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];
    const alunoAtualizado = (alunos || []).find(
      (a) => a.id === confirmacaoData.alunoId,
    );

    if (!alunoAtualizado) {
      alert("Aluno não encontrado.");
      return;
    }

    try {
      const novoAlunoData = {
        ...alunoAtualizado,
        classe: confirmacaoData.novaClasse,
        turma: confirmacaoData.novaTurma,
        anoLectivo: confirmacaoData.novoAnoLectivo,
        historico: [
          ...(alunoAtualizado.historico || []),
          {
            data: hoje,
            acao: "Confirmação para novo ano lectivo",
            detalhes: `Confirmado para ${confirmacaoData.novaClasse} - Turma ${confirmacaoData.novaTurma} (${confirmacaoData.novoAnoLectivo})`,
          },
        ],
      };

      setAlunos(
        (alunos || []).map((a) =>
          a.id === confirmacaoData.alunoId ? novoAlunoData : a,
        ),
      );

      setMatriculas(
        (matriculas || []).map((m) =>
          m.alunoId === confirmacaoData.alunoId
            ? {
                ...m,
                classe: confirmacaoData.novaClasse,
                turma: confirmacaoData.novaTurma,
                anoLectivo: confirmacaoData.novoAnoLectivo,
                dataRenovacao: hoje,
              }
            : m,
        ),
      );

      if (confirmacaoData.id) {
        const updatedConfirmacoes = (confirmacoes || []).map((c) =>
          c.id === confirmacaoData.id
            ? {
                ...c,
                novaClasse: confirmacaoData.novaClasse,
                novaTurma: confirmacaoData.novaTurma,
                novoAnoLectivo: confirmacaoData.novoAnoLectivo,
                periodo: confirmacaoData.periodo,
                status: confirmacaoData.status,
                dataConfirmacao: hoje,
                valorMensalidade: confirmacaoData.valorMensalidade,
                observacoes: confirmacaoData.observacoes,
              }
            : c,
        );
        setConfirmacoes(updatedConfirmacoes);
      } else {
        const novaConfirmacao = {
          id: (confirmacoes || []).length + 1,
          alunoId: confirmacaoData.alunoId,
          aluno: confirmacaoData.aluno,
          codigo: confirmacaoData.codigo,
          classeActual: confirmacaoData.classeActual,
          turmaActual: confirmacaoData.turmaActual,
          novaClasse: confirmacaoData.novaClasse,
          novaTurma: confirmacaoData.novaTurma,
          novoAnoLectivo: confirmacaoData.novoAnoLectivo,
          periodo: confirmacaoData.periodo,
          status: confirmacaoData.status,
          dataConfirmacao: hoje,
          valorMensalidade: confirmacaoData.valorMensalidade,
          observacoes: confirmacaoData.observacoes,
        };
        setConfirmacoes([...(confirmacoes || []), novaConfirmacao]);
      }

      const pagamentoExistente = alunoAtualizado.pagamentos?.find(
        (p) => p.referencia && p.referencia.includes("CONF-"),
      );

      if (!pagamentoExistente && confirmacaoData.status === "Confirmado") {
        const novoPagamento = {
          id: Date.now(),
          data: hoje,
          valor: Number(confirmacaoData.valorMensalidade) || 25000,
          status: "Confirmado",
          referencia: `CONF-${confirmacaoData.novoAnoLectivo}-${String(confirmacaoData.alunoId).padStart(3, "0")}`,
          mesReferencia: `Confirmação ${confirmacaoData.novoAnoLectivo}`,
          tipo: "Confirmação",
          formaPagamento: "Dinheiro",
          funcionario: "Sistema",
        };

        const pagamentosAtualizados = [
          ...(alunoAtualizado.pagamentos || []),
          novoPagamento,
        ];
        setAlunos(
          (alunos || []).map((a) =>
            a.id === confirmacaoData.alunoId
              ? { ...a, pagamentos: pagamentosAtualizados }
              : a,
          ),
        );
      }

      setConfirmacaoRealizada({
        aluno: novoAlunoData,
        confirmacao: {
          ...confirmacaoData,
          dataConfirmacao: hoje,
          status: confirmacaoData.status,
        },
      });

      setShowConfirmacaoPrint(true);
    } catch (error) {
      console.error("Erro ao salvar confirmação:", error);
      alert("Ocorreu um erro ao salvar a confirmação. Tente novamente.");
    }
  };

  const handleUpdateStatus = (id, novoStatus) => {
    if (window.confirm(`Deseja alterar o status para "${novoStatus}"?`)) {
      const hoje = new Date().toISOString().split("T")[0];
      setConfirmacoes(
        (confirmacoes || []).map((c) =>
          c.id === id
            ? {
                ...c,
                status: novoStatus,
                dataConfirmacao:
                  novoStatus === "Confirmado" ? hoje : c.dataConfirmacao,
              }
            : c,
        ),
      );

      if (novoStatus === "Confirmado") {
        const confirmacao = (confirmacoes || []).find((c) => c.id === id);
        if (confirmacao) {
          const aluno = (alunos || []).find(
            (a) => a.id === confirmacao.alunoId,
          );
          if (aluno) {
            setAlunos(
              (alunos || []).map((a) =>
                a.id === confirmacao.alunoId
                  ? {
                      ...a,
                      classe: confirmacao.novaClasse,
                      turma: confirmacao.novaTurma,
                      anoLectivo: confirmacao.novoAnoLectivo,
                      historico: [
                        ...(a.historico || []),
                        {
                          data: hoje,
                          acao: "Confirmação para novo ano lectivo",
                          detalhes: `Confirmado para ${confirmacao.novaClasse} - Turma ${confirmacao.novaTurma} (${confirmacao.novoAnoLectivo})`,
                        },
                      ],
                    }
                  : a,
              ),
            );

            setMatriculas(
              (matriculas || []).map((m) =>
                m.alunoId === confirmacao.alunoId
                  ? {
                      ...m,
                      classe: confirmacao.novaClasse,
                      turma: confirmacao.novaTurma,
                      anoLectivo: confirmacao.novoAnoLectivo,
                      dataRenovacao: hoje,
                    }
                  : m,
              ),
            );
          }
        }
      }
    }
  };

  const handleDeleteConfirmacao = (id) => {
    if (window.confirm("Tem certeza que deseja remover esta reconfirmação?")) {
      setConfirmacoes((confirmacoes || []).filter((c) => c.id !== id));
    }
  };

  const handleSelecionarTodos = (e) => {
    if (e.target.checked) {
      setSelecionadosConfirmacao(confirmacoesFiltradas.map((c) => c.id));
    } else {
      setSelecionadosConfirmacao([]);
    }
  };

  // ==================== HANDLERS DE PESQUISA ====================
  const handleAbrirPesquisa = () => {
    setModoPesquisa(true);
    setResultadosPesquisa([]);
    setPesquisaAluno("");
    setAlunoSelecionadoPesquisa(null);
    setSugestoes([]);
    setMostrarSugestoes(false);
    setIndiceSugestao(-1);
    setTimeout(() => {
      if (inputPesquisaRef.current) {
        inputPesquisaRef.current.focus();
      }
    }, 150);
  };

  const handleFecharPesquisa = () => {
    setModoPesquisa(false);
    setPesquisaAluno("");
    setResultadosPesquisa([]);
    setSugestoes([]);
    setMostrarSugestoes(false);
    setIndiceSugestao(-1);
  };

  const handleSelecionarAlunoPesquisa = (aluno) => {
    const existeConfirmacao = (confirmacoes || []).some(
      (c) => c.alunoId === aluno.id,
    );
    setAlunoSelecionadoPesquisa(aluno);

    if (existeConfirmacao) {
      if (
        window.confirm(
          "Este aluno já possui uma reconfirmação. Deseja editá-la?",
        )
      ) {
        handleAbrirConfirmacao(aluno);
      }
    } else {
      handleAbrirConfirmacao(aluno);
    }
  };

  const handleClosePrintConfirmacao = () => {
    setShowConfirmacaoPrint(false);
    setConfirmacaoRealizada(null);
    setViewMode("lista");
    setModoPesquisa(false);
  };

  const handleClosePrintMatricula = () => {
    setShowMatriculaPrint(false);
    setMatriculaReciboData(null);
    setViewMode("lista");
  };

  const handleViewReciboConfirmacaoAction = (confirmacao) => {
    const aluno = alunos.find((a) => a.id === confirmacao.alunoId);
    if (!aluno) {
      alert("Aluno não encontrado!");
      return;
    }
    setViewReciboConfirmacao({
      aluno,
      confirmacao,
    });
  };

  const handleCloseViewRecibo = () => {
    setViewReciboConfirmacao(null);
  };

  // ==================== FILTROS ====================
  const matriculasFiltradas = (matriculas || []).filter(
    (m) =>
      m.numero.toLowerCase().includes(busca.toLowerCase()) ||
      m.aluno.toLowerCase().includes(busca.toLowerCase()) ||
      m.classe.toLowerCase().includes(busca.toLowerCase()),
  );

  const confirmacoesFiltradas = (confirmacoes || []).filter((c) => {
    const matchBusca =
      c.aluno.toLowerCase().includes(buscaConfirmacao.toLowerCase()) ||
      (c.codigo &&
        c.codigo.toLowerCase().includes(buscaConfirmacao.toLowerCase()));
    const matchStatus =
      filtroStatusConfirmacao === "todos"
        ? true
        : c.status === filtroStatusConfirmacao;
    const matchAno = filtroAnoConfirmacao
      ? c.novoAnoLectivo === filtroAnoConfirmacao
      : true;
    return matchBusca && matchStatus && matchAno;
  });

  const stats = {
    total: (confirmacoes || []).length,
    confirmados: (confirmacoes || []).filter((c) => c.status === "Confirmado")
      .length,
    pendentes: (confirmacoes || []).filter((c) => c.status === "Pendente")
      .length,
    cancelados: (confirmacoes || []).filter((c) => c.status === "Cancelado")
      .length,
  };

  // ==================== VIEW: PRINT CONFIRMAÇÃO ====================
  if (showConfirmacaoPrint && confirmacaoRealizada) {
    const { aluno, confirmacao } = confirmacaoRealizada;

    return (
      <div className="container">
        <div className="header">
          <h2>
            <button className="btn-back" onClick={handleClosePrintConfirmacao}>
              <FaArrowLeft />
            </button>
            <FaPrint /> Recibo de Confirmação
          </h2>
          <div className="header-actions">
            <button className="btn-print" onClick={handlePrintConfirmacao}>
              <FaRegFilePdf /> Imprimir
            </button>
            <button
              className="btn-cancel"
              onClick={handleClosePrintConfirmacao}
            >
              <FaTimes /> Fechar
            </button>
          </div>
        </div>
        <div className="print-modal-content">
          <ReciboUnificado
            ref={confirmacaoPrintRef}
            tipo="confirmacao"
            dados={{
              classeActual: confirmacao.classeActual || aluno.classe,
              turmaActual: confirmacao.turmaActual || aluno.turma,
              novaClasse: confirmacao.novaClasse,
              novaTurma: confirmacao.novaTurma,
              novoAnoLectivo: confirmacao.novoAnoLectivo,
              periodo: confirmacao.periodo || "Manhã",
              valorMensalidade: confirmacao.valorMensalidade,
            }}
            aluno={aluno}
            referencia={`CONF-${confirmacao.novoAnoLectivo}-${String(aluno.id || 0).padStart(3, "0")}`}
            data={confirmacao.dataConfirmacao}
            valor={confirmacao.valorMensalidade || 25000}
            anoLectivo={confirmacao.novoAnoLectivo}
            formaPagamento="Dinheiro"
            funcionario="Sistema"
            status={confirmacao.status}
            servico="Confirmação para Novo Ano Lectivo"
            observacoes={confirmacao.observacoes || ""}
          />
        </div>
      </div>
    );
  }

  // ==================== VIEW: VIEW RECIBO CONFIRMAÇÃO ====================
  if (viewReciboConfirmacao) {
    const { aluno, confirmacao } = viewReciboConfirmacao;

    return (
      <div className="container">
        <div className="header">
          <h2>
            <button className="btn-back" onClick={handleCloseViewRecibo}>
              <FaArrowLeft />
            </button>
            <FaEye /> Visualizar Recibo de Confirmação
          </h2>
          <div className="header-actions">
            <button className="btn-print" onClick={handlePrintViewRecibo}>
              <FaPrint /> Imprimir
            </button>
            <button className="btn-cancel" onClick={handleCloseViewRecibo}>
              <FaTimes /> Fechar
            </button>
          </div>
        </div>
        <div className="print-modal-content">
          <ReciboUnificado
            ref={viewReciboPrintRef}
            tipo="confirmacao"
            dados={{
              classeActual: confirmacao.classeActual || aluno.classe,
              turmaActual: confirmacao.turmaActual || aluno.turma,
              novaClasse: confirmacao.novaClasse,
              novaTurma: confirmacao.novaTurma,
              novoAnoLectivo: confirmacao.novoAnoLectivo,
              periodo: confirmacao.periodo || "Manhã",
              valorMensalidade: confirmacao.valorMensalidade,
            }}
            aluno={aluno}
            referencia={`CONF-${confirmacao.novoAnoLectivo}-${String(aluno.id || 0).padStart(3, "0")}`}
            data={confirmacao.dataConfirmacao}
            valor={confirmacao.valorMensalidade || 25000}
            anoLectivo={confirmacao.novoAnoLectivo}
            formaPagamento="Dinheiro"
            funcionario="Sistema"
            status={confirmacao.status}
            servico="Confirmação para Novo Ano Lectivo"
            observacoes={confirmacao.observacoes || ""}
          />
        </div>
      </div>
    );
  }

  // ==================== VIEW: PRINT MATRÍCULA ====================
  if (showMatriculaPrint && matriculaReciboData) {
    const { aluno, matricula, pagamento } = matriculaReciboData;

    return (
      <div className="container">
        <div className="header">
          <h2>
            <button className="btn-back" onClick={handleClosePrintMatricula}>
              <FaArrowLeft />
            </button>
            <FaPrint /> Recibo de Matrícula
          </h2>
          <div className="header-actions">
            <button className="btn-print" onClick={handlePrintMatricula}>
              <FaRegFilePdf /> Imprimir / PDF
            </button>
            <button className="btn-cancel" onClick={handleClosePrintMatricula}>
              <FaTimes /> Fechar
            </button>
          </div>
        </div>
        <div className="print-modal-content">
          <ReciboUnificado
            ref={matriculaPrintRef}
            tipo="matricula"
            dados={{
              classe: matricula.classe,
              turma: matricula.turma,
              turno: matricula.turno,
              anoLectivo: matricula.anoLectivo,
            }}
            aluno={aluno}
            referencia={pagamento.referencia}
            data={pagamento.data}
            valor={pagamento.valor}
            anoLectivo={matricula.anoLectivo}
            formaPagamento={pagamento.formaPagamento}
            funcionario={pagamento.funcionario}
            status={pagamento.status}
            servico="Taxa de Matrícula"
            observacoes={matricula.observacoes || ""}
          />
        </div>
      </div>
    );
  }

  // ==================== VIEW: CONFIRMAÇÃO (FORMULÁRIO) ====================
  if (viewMode === "confirmacao") {
    return (
      <div className="container">
        <div className="header">
          <h2>
            <button className="btn-back" onClick={handleBackToList}>
              <FaArrowLeft />
            </button>
            <FaUserCheck /> Confirmação para Novo Ano Lectivo
          </h2>
        </div>

        <div className="form-container">
          <div className="aluno-selecionado-info">
            <FaUserGraduate />
            <div>
              <strong>{confirmacaoData.aluno}</strong>
              <span>
                {confirmacaoData.codigo} · {confirmacaoData.classeActual} ·
                Turma {confirmacaoData.turmaActual}
              </span>
            </div>
          </div>

          <form onSubmit={handleSalvarConfirmacao}>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <FaSchool /> Nova Classe *
                </label>
                <select
                  name="novaClasse"
                  value={confirmacaoData.novaClasse}
                  onChange={handleConfirmacaoChange}
                  required
                >
                  <option value="">Selecione a nova classe</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FaBuilding /> Nova Turma *
                </label>
                <select
                  name="novaTurma"
                  value={confirmacaoData.novaTurma}
                  onChange={handleConfirmacaoChange}
                  required
                >
                  <option value="">Selecione a nova turma</option>
                  {turmas.map((t) => (
                    <option key={t} value={t}>
                      Turma {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FaCalendarAlt /> Novo Ano Lectivo *
                </label>
                <select
                  name="novoAnoLectivo"
                  value={confirmacaoData.novoAnoLectivo}
                  onChange={handleConfirmacaoChange}
                  required
                >
                  <option value="">Selecione o novo ano lectivo</option>
                  {anosLectivos.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FaClock /> Período *
                </label>
                <select
                  name="periodo"
                  value={confirmacaoData.periodo}
                  onChange={handleConfirmacaoChange}
                  required
                >
                  <option value="">Selecione o período</option>
                  {periodos.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FaMoneyBill /> Taxa de Confirmação (Kz) *
                </label>
                <input
                  type="number"
                  name="valorMensalidade"
                  value={confirmacaoData.valorMensalidade}
                  onChange={handleConfirmacaoChange}
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FaCheckCircle /> Status
                </label>
                <select
                  name="status"
                  value={confirmacaoData.status}
                  onChange={handleConfirmacaoChange}
                >
                  {statusConfirmacao.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label>
                  <FaInfoCircle /> Observações
                </label>
                <textarea
                  name="observacoes"
                  value={confirmacaoData.observacoes}
                  onChange={handleConfirmacaoChange}
                  rows="3"
                  placeholder="Observações adicionais sobre a confirmação..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                <FaSave /> Confirmar e Gerar Recibo
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleBackToList}
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==================== VIEW: NOVA MATRÍCULA ====================
  if (viewMode === "nova") {
    return (
      <div className="container">
        <div className="header">
          <h2>
            <button className="btn-back" onClick={handleBackToList}>
              <FaArrowLeft />
            </button>
            <FaUserPlus /> Nova Matrícula
          </h2>
          <div className="step-indicator">
            {stepNames.map((name, index) => (
              <Fragment key={index}>
                <span
                  className={`step ${currentStep >= index ? "active" : ""}`}
                >
                  {index + 1}
                </span>
                {index < stepNames.length - 1 && (
                  <span className="step-line"></span>
                )}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmitMatricula}>
            {currentStep === 0 && (
              <div className="form-step">
                <h3>
                  <FaUser /> Dados Pessoais
                </h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Nome Completo *</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      placeholder="Digite o nome completo"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <FaIdCard /> Nº do B.I. *
                    </label>
                    <input
                      type="text"
                      name="bi"
                      value={formData.bi}
                      onChange={handleChange}
                      placeholder="001234567LA042"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select
                      name="sexo"
                      value={formData.sexo}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {sexos.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Data de Nascimento</label>
                    <input
                      type="date"
                      name="dataNascimento"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <FaUserGraduate /> Código (Gerado)
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      value={formData.codigo || gerarCodigoAluno()}
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="form-step">
                <h3>
                  <FaAddressBook /> Dados do Encarregado
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome do Encarregado</label>
                    <input
                      type="text"
                      name="encarregado"
                      value={formData.encarregado}
                      onChange={handleChange}
                      placeholder="Nome do encarregado"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <FaPhone /> Contacto do Encarregado
                    </label>
                    <input
                      type="tel"
                      name="contactoEncarregado"
                      value={formData.contactoEncarregado}
                      onChange={handleChange}
                      placeholder="+244 900 000 000"
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <FaEnvelope /> Email do Encarregado
                    </label>
                    <input
                      type="email"
                      name="emailEncarregado"
                      value={formData.emailEncarregado}
                      onChange={handleChange}
                      placeholder="encarregado@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Parentesco</label>
                    <select
                      name="parentesco"
                      value={formData.parentesco}
                      onChange={handleChange}
                    >
                      <option value="">Selecione</option>
                      {parentescos.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="form-step">
                <h3>
                  <FaSchool /> Dados Académicos e Matrícula
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Turma *</label>
                    <select
                      name="turma"
                      value={formData.turma}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {turmas.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Classe *</label>
                    <select
                      name="classe"
                      value={formData.classe}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {classes.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ano Lectivo *</label>
                    <select
                      name="anoLectivo"
                      value={formData.anoLectivo}
                      onChange={handleChange}
                      required
                    >
                      {anosLectivos.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Turno *</label>
                    <select
                      name="turno"
                      value={formData.turno}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {turnos.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Data de Matrícula</label>
                    <input
                      type="date"
                      name="dataMatricula"
                      value={formData.dataMatricula}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Taxa de Matrícula (Kz)</label>
                    <input
                      type="number"
                      name="taxaMatricula"
                      value={formData.taxaMatricula}
                      onChange={handleChange}
                      min="0"
                      step="100"
                    />
                  </div>
                  <div className="form-group">
                    <label>Forma de Pagamento</label>
                    <select
                      name="formaPagamento"
                      value={formData.formaPagamento}
                      onChange={handleChange}
                    >
                      {[
                        "Depósito",
                        "Transferência Bancária",
                        "Multicaixa",
                        "Dinheiro",
                      ].map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado do Pagamento</label>
                    <select
                      name="estadoPagamento"
                      value={formData.estadoPagamento}
                      onChange={handleChange}
                    >
                      {estadosPagamento.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado do Aluno</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                    >
                      {statusAluno.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* ✅ NOVO CAMPO: FUNCIONÁRIO */}
                  <div className="form-group">
                    <label>
                      <FaUserTie /> Funcionário Responsável *
                    </label>
                    <input
                      type="text"
                      name="funcionario"
                      value={formData.funcionario}
                      onChange={handleChange}
                      placeholder="Nome do funcionário que efetuou a matrícula"
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Observações</label>
                    <textarea
                      name="observacoes"
                      value={formData.observacoes}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Observações adicionais"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              {currentStep > 0 && (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handlePrevStep}
                >
                  <FaChevronLeft /> Anterior
                </button>
              )}
              {currentStep < 2 ? (
                <button
                  type="button"
                  className="btn-add"
                  onClick={handleNextStep}
                >
                  Seguinte <FaChevronRight />
                </button>
              ) : (
                <button type="submit" className="btn-save" disabled={aEnviarMatricula}>
                  <FaSave /> {aEnviarMatricula ? "A gravar..." : "Efetuar Matrícula"}
                </button>
              )}
              <button
                type="button"
                className="btn-cancel"
                onClick={handleBackToList}
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==================== VIEW: PESQUISA DE ALUNO ====================
  if (modoPesquisa) {
    return (
      <div className="container">
        <div className="header">
          <h2>
            <button className="btn-back" onClick={handleFecharPesquisa}>
              <FaArrowLeft />
            </button>
            <FaUserCheck /> Pesquisar Aluno para Reconfirmação
          </h2>
        </div>

        <div className="form-container">
          <div className="pesquisa-container-reconf">
            <div className="form-group full-width pesquisa-wrapper">
              <label>
                <FaSearch /> Pesquisar Aluno (por nome ou código)
              </label>
              <div className="pesquisa-input-wrapper">
                <FaSearch className="pesquisa-icon" />
                <input
                  ref={inputPesquisaRef}
                  type="text"
                  placeholder="Digite o nome ou código do aluno..."
                  value={pesquisaAluno}
                  onChange={(e) => setPesquisaAluno(e.target.value)}
                  onKeyDown={handleKeyDownPesquisa}
                  autoComplete="off"
                  className="pesquisa-input"
                />
                {pesquisando && (
                  <FaSpinner className="spin pesquisa-spinner" />
                )}
              </div>

              {mostrarSugestoes && sugestoes.length > 0 && (
                <div className="sugestoes-dropdown">
                  {sugestoes.map((sug, idx) => (
                    <div
                      key={sug.id}
                      className={`sugestao-item ${idx === indiceSugestao ? "active" : ""}`}
                      onClick={() => selecionarSugestao(sug)}
                      onMouseEnter={() => setIndiceSugestao(idx)}
                    >
                      <div className="sugestao-info">
                        <strong>{sug.nome}</strong>
                        <span className="sugestao-meta">
                          {sug.codigo} · {sug.classe} · Turma {sug.turma}
                        </span>
                      </div>
                      <FaChevronRight className="sugestao-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pesquisa-actions">
              <button
                type="button"
                className="btn-save"
                onClick={handlePesquisarAluno}
                disabled={pesquisando}
              >
                <FaSearch /> {pesquisando ? "A pesquisar..." : "Pesquisar"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={handleFecharPesquisa}
              >
                <FaTimes /> Cancelar
              </button>
            </div>
          </div>

          {resultadosPesquisa.length > 0 && (
            <div className="resultados-section">
              <h3 className="resultados-titulo">
                Resultados ({resultadosPesquisa.length})
              </h3>
              <div className="alunos-resultados">
                {resultadosPesquisa.map((a) => {
                  const jaTemConfirmacao = (confirmacoes || []).some(
                    (c) => c.alunoId === a.id,
                  );
                  return (
                    <div key={a.id} className="aluno-resultado-card">
                      <div className="aluno-resultado-info">
                        <strong>{a.nome}</strong>
                        <span className="aluno-resultado-codigo">
                          {a.codigo}
                        </span>
                        <span className="aluno-resultado-meta">
                          {a.classe} · Turma {a.turma} · {a.anoLectivo}
                        </span>
                        {jaTemConfirmacao && (
                          <span className="ja-confirmado-badge">
                            <FaCheckCircle /> Já possui reconfirmação
                          </span>
                        )}
                      </div>
                      <button
                        className={jaTemConfirmacao ? "btn-edit" : "btn-save"}
                        onClick={() => handleSelecionarAlunoPesquisa(a)}
                      >
                        {jaTemConfirmacao ? <FaEdit /> : <FaPlus />}
                        {jaTemConfirmacao
                          ? "Editar Reconfirmação"
                          : "Nova Reconfirmação"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {pesquisaAluno.trim().length >= 2 &&
            resultadosPesquisa.length === 0 &&
            !pesquisando && (
              <div className="empty-state-pesquisa">
                <FaSearch size={32} />
                <p>Nenhum aluno encontrado. Tente outro nome ou código.</p>
              </div>
            )}
        </div>
      </div>
    );
  }

  // ==================== VIEW: LISTA PRINCIPAL ====================
  return (
    <div className="container">
      <div className="header">
        <h2 style={{fontSize:'32.5px' , fontWeight:'bold'}}>
          Gestão de Matrículas
        </h2>
        <div className="header-actions">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por número, aluno ou classe..."
              value={activeTab === "matriculas" ? busca : buscaConfirmacao}
              onChange={(e) =>
                activeTab === "matriculas"
                  ? setBusca(e.target.value)
                  : setBuscaConfirmacao(e.target.value)
              }
            />
          </div>
          <button className="btn-add" onClick={handleNovaMatricula}>
            <FaPlus /> Nova Matrícula
          </button>
        </div>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === "matriculas" ? "active" : ""}`}
          onClick={() => setActiveTab("matriculas")}
        >
          <FaUsers /> Matrículas
          <span className="badge">{matriculasFiltradas.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "reconfirmacoes" ? "active" : ""}`}
          onClick={() => setActiveTab("reconfirmacoes")}
        >
          <FaUserCheck /> Reconfirmações
          <span className="badge pending-badge">
            {(confirmacoes || []).filter((c) => c.status === "Pendente").length}
          </span>
        </button>
      </div>

      {activeTab === "matriculas" && (
        <div className="table-container">
          <div className="table-header">
            <div className="table-title">
              <span>Lista de Matrículas</span>
              <span className="count">
                {matriculasFiltradas.length} matrículas
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nº Matrícula</th>
                  <th>Aluno</th>
                  <th>Classe</th>
                  <th>Turma</th>
                  <th>Turno</th>
                  <th>Ano Lectivo</th>
                  <th>Estado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {matriculasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      Nenhuma matrícula encontrada
                    </td>
                  </tr>
                ) : (
                  matriculasFiltradas.map((matricula) => (
                    <tr key={matricula.id}>
                      <td>
                        <span className="codigo-badge">
                          {matricula.numero}
                        </span>
                      </td>
                      <td>
                        <strong>{matricula.aluno}</strong>
                      </td>
                      <td>{matricula.classe}</td>
                      <td>
                        <span className="turma-badge">{matricula.turma}</span>
                      </td>
                      <td>{matricula.turno}</td>
                      <td>{matricula.anoLectivo}</td>
                      <td>
                        <span
                          className={`estado-badge ${(matricula.estado || "Ativa").toLowerCase()}`}
                        >
                          {matricula.estado || "Ativa"}
                        </span>
                      </td>
                      <td className="table-actions-cell">
                        <div className="action-buttons-group">
                          <button
                            className="action-btn action-transfer"
                            onClick={() => handleTransferencia(matricula)}
                            >                            
                            Transferir Turma
                          </button>
                          <button
                            className="action-btn action-renew"
                            onClick={() => handleSubmitRenovacao(matricula)}
                            >
                            Renovar
                          </button>

                          <button
                            className="action-btn action-cancel"
                            onClick={() => handleCancelarMatricula(matricula)}
                            >
                            Cancelar                  
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "reconfirmacoes" && (
        <div className="table-container">
          <div className="reconfirmacoes-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.confirmados}</span>
              <span className="stat-label">Confirmados</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.pendentes}</span>
              <span className="stat-label">Pendentes</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{stats.cancelados}</span>
              <span className="stat-label">Cancelados</span>
            </div>
          </div>

          <div className="reconfirmacoes-filters">
            <div className="filter-group">
              <select
                className="filter-select"
                value={filtroStatusConfirmacao}
                onChange={(e) => setFiltroStatusConfirmacao(e.target.value)}
              >
                <option value="todos">Todos os Status</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Pendente">Pendente</option>
                <option value="Cancelado">Cancelado</option>
              </select>

              <select
                className="filter-select"
                value={filtroAnoConfirmacao}
                onChange={(e) => setFiltroAnoConfirmacao(e.target.value)}
              >
                <option value="">Todos os Anos</option>
                {anosLectivos.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ Apenas botão "Nova Reconfirmação" - "Confirmar Todas" removido */}
            <div className="actions-group">
              <button className="btn-add" onClick={handleAbrirPesquisa}>
                <FaPlus /> Nova Reconfirmação
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={
                        confirmacoesFiltradas.length > 0 &&
                        selecionadosConfirmacao.length ===
                          confirmacoesFiltradas.length
                      }
                      onChange={handleSelecionarTodos}
                    />
                  </th>
                  <th>Aluno</th>
                  <th>Nova Classe</th>
                  <th>Nova Turma</th>
                  <th>Novo Ano</th>
                  <th>Status</th>
                  <th>Data Confirmação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {confirmacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      Nenhuma reconfirmação encontrada. Clique em "Nova
                      Reconfirmação" para começar.
                    </td>
                  </tr>
                ) : (
                  confirmacoesFiltradas.map((c) => {
                    const aluno = (alunos || []).find(
                      (a) => a.id === c.alunoId,
                    );
                    return (
                      <tr key={c.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selecionadosConfirmacao.includes(c.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelecionadosConfirmacao([
                                  ...selecionadosConfirmacao,
                                  c.id,
                                ]);
                              } else {
                                setSelecionadosConfirmacao(
                                  selecionadosConfirmacao.filter(
                                    (id) => id !== c.id,
                                  ),
                                );
                              }
                            }}
                            disabled={c.status === "Confirmado"}
                          />
                        </td>
                        <td>
                          <strong>{c.aluno}</strong>
                        </td>
                        <td>
                          <span className="classe-badge">{c.novaClasse}</span>
                        </td>
                        <td>
                          <span className="turma-badge">{c.novaTurma}</span>
                        </td>
                        <td>{c.novoAnoLectivo}</td>
                        <td>
                          <span
                            className={`estado-badge ${c.status.toLowerCase()}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td>
                          {c.dataConfirmacao
                            ? new Date(c.dataConfirmacao).toLocaleDateString(
                                "pt-AO",
                              )
                            : "—"}
                        </td>
                        <td className="table-actions-cell">
                          <div className="action-buttons-group">
                            <button
                              className="action-btn"
                              onClick={() =>
                                aluno && handleAbrirConfirmacao(aluno)
                              }
                              title="Editar reconfirmação"
                            >
                              <FaEdit />
                            </button>

                            {c.status === "Confirmado" && (
                              <button
                                className="action-btn"
                                onClick={() =>
                                  handleViewReciboConfirmacaoAction(c)
                                }
                                title="Ver Recibo"
                              >
                                <FaEye />
                              </button>
                            )}

                            {c.status !== "Confirmado" && (
                              <button
                                className="action-btn action-confirm"
                                onClick={() =>
                                  handleUpdateStatus(c.id, "Confirmado")
                                }
                                title="Confirmar"
                              >
                                <FaCheckCircle />
                              </button>
                            )}

                            <button
                              className="action-btn action-cancel"
                              onClick={() => handleDeleteConfirmacao(c.id)}
                              title="Remover"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== ✅ MODAL DE TRANSFERÊNCIA ==================== */}
      {showTransferModal && selectedMatricula && (
        <div className="modal-overlay" onClick={handleCloseTransferModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FaExchangeAlt /> Transferir Turma
              </h3>
              <button
                className="modal-close"
                onClick={handleCloseTransferModal}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <p>
                  <strong>Aluno:</strong> {selectedMatricula.aluno}
                </p>
                <p>
                  <strong>Matrícula:</strong> {selectedMatricula.numero}
                </p>
                <p>
                  <strong>Classe:</strong> {selectedMatricula.classe}
                </p>
                <p>
                  <strong>Turma Atual:</strong>{" "}
                  <span className="turma-badge">{selectedMatricula.turma}</span>
                </p>
              </div>

              <form onSubmit={handleSubmitTransferencia}>
                <div className="form-group">
                  <label>Nova Turma *</label>
                  <select
                    value={transferData.novaTurma}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        novaTurma: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Selecione a nova turma</option>
                    {turmas
                      .filter((t) => t !== selectedMatricula.turma)
                      .map((t) => (
                        <option key={t} value={t}>
                          Turma {t}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Data da Transferência</label>
                  <input
                    type="date"
                    value={transferData.dataTransferencia}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        dataTransferencia: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Motivo (opcional)</label>
                  <textarea
                    value={transferData.motivo}
                    onChange={(e) =>
                      setTransferData({
                        ...transferData,
                        motivo: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Motivo da transferência..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn-save">
                    <FaSave /> Confirmar Transferência
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleCloseTransferModal}
                  >
                    <FaTimes /> Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Matriculas;