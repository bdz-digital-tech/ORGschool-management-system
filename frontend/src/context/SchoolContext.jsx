import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import {
  alunosAPI,
  professoresAPI,
  matriculasAPI,
  pagamentosAPI,
  classesAPI,
  turmasAPI,
  comunicadosAPI,
  confirmacoesAPI,
  formatarDataDoBackend,
} from "../services/api";

const SchoolContext = createContext();

const STORAGE_KEYS = {
  ALUNOS: "luki_alunos",
  PROFESSORES: "luki_professores",
  MATRICULAS: "luki_matriculas",
  CLASSES: "luki_classes",
  CONFIRMACOES: "luki_confirmacoes",
  COMUNICADOS: "luki_comunicados",
  ANOS_LECTIVOS: "luki_anos_lectivos",
};

// ✅ Helper de normalização
const normalizarEscolaId = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const num = Number(valor);
  return Number.isNaN(num) ? null : num;
};

const getStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const setStorage = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const SchoolProvider = ({ children }) => {
  const { user, token } = useAuth();

  // Estados principais
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [todosProfessores, setTodosProfessores] = useState([]);
  const [todasMatriculas, setTodasMatriculas] = useState([]);
  const [todasClasses, setTodasClasses] = useState([]);
  const [todasConfirmacoes, setTodasConfirmacoes] = useState([]);
  const [todosComunicados, setTodosComunicados] = useState([]);
  const [todosAnosLectivos, setTodosAnosLectivos] = useState([]);

  // Estados de loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================================
  // CARREGAR DADOS DO BACKEND
  // ============================================================
  const carregarDados = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    setError(null);

    try {
      // Carregar dados do backend em paralelo
      const [alunosData, professoresData, matriculasData, pagamentosData, classesData, comunicadosData] =
        await Promise.allSettled([
          alunosAPI.listar(),
          professoresAPI.listar(),
          matriculasAPI.listar(),
          pagamentosAPI.listar(),
          classesAPI.listar(),
          comunicadosAPI.listar(),
        ]);

      // Processar alunos
      if (alunosData.status === "fulfilled") {
        const alunosFormatados = (
          alunosData.value.dados ||
          alunosData.value.data ||
          (Array.isArray(alunosData.value) ? alunosData.value : []) ||
          []
        ).map((a) => ({
          id: a.id,
          codigo: a.codigo || `AL-${String(a.id).padStart(4, "0")}`,
          nome: a.nome,
          sexo: a.sexo,
          dataNascimento: formatarDataDoBackend(a.data_nascimento),
          bi: a.bi,
          contacto: a.contacto,
          email: a.email,
          encarregado: a.encarregado,
          contactoEncarregado: a.contacto_encarregado,
          emailEncarregado: a.email_encarregado,
          parentesco: a.parentesco,
          turma: a.turma || a.turma_nome,
          turmaId: a.turma_id,
          classe: a.classe || a.classe_nome,
          classeId: a.classe_id,
          anoLectivo: a.ano_lectivo,
          estado: a.estado || "Ativo",
          dataMatricula: formatarDataDoBackend(a.data_matricula),
          documentos: a.documentos || [],
          pagamentos: [],
          historico: a.historico || [],
          escolaId: normalizarEscolaId(a.escola_id),
        }));
        setTodosAlunos(alunosFormatados);
        setStorage(STORAGE_KEYS.ALUNOS, alunosFormatados);
      } else {
        // Fallback para localStorage
        setTodosAlunos(getStorage(STORAGE_KEYS.ALUNOS));
      }

      // Processar professores
      if (professoresData.status === "fulfilled") {
        const professoresFormatados = (
          professoresData.value.dados ||
          professoresData.value.data ||
          (Array.isArray(professoresData.value) ? professoresData.value : []) ||
          []
        ).map((p) => ({
          id: p.id,
          codigo: p.codigo || `PROF-${String(p.id).padStart(4, "0")}`,
          nome: p.nome,
          sexo: p.sexo,
          dataNascimento: formatarDataDoBackend(p.data_nascimento),
          contacto: p.contacto,
          email: p.email,
          endereco: p.endereco,
          especialidade: p.especialidade ? p.especialidade.split(", ") : [],
          classes: p.classes || [],
          turmas: p.turmas || [],
          disciplinas: p.disciplinas || [],
          estado: p.estado || "Ativo",
          dataContratacao: formatarDataDoBackend(p.data_contratacao),
          formacao: p.formacao,
          experiencia: p.experiencia,
          observacoes: p.observacoes,
          escolaId: normalizarEscolaId(p.escola_id),
        }));
        setTodosProfessores(professoresFormatados);
        setStorage(STORAGE_KEYS.PROFESSORES, professoresFormatados);
      } else {
        setTodosProfessores(getStorage(STORAGE_KEYS.PROFESSORES));
      }

      // Processar matrículas
      if (matriculasData.status === "fulfilled") {
        const matriculasFormatadas = (
          matriculasData.value.dados ||
          matriculasData.value.data ||
          (Array.isArray(matriculasData.value) ? matriculasData.value : []) ||
          []
        ).map((m) => ({
          id: m.id,
          numero:
            m.numero || `MAT-${m.anoLectivo}-${String(m.id).padStart(3, "0")}`,
          aluno: m.aluno || m.aluno_nome,
          alunoId: m.alunoId || m.aluno_id,
          anoLectivo: m.anoLectivo || m.ano_lectivo,
          classe: m.classe || m.classe_nome,
          classeId: m.classeId || m.classe_id,
          turma: m.turma || m.turma_nome,
          turmaId: m.turmaId || m.turma_id,
          turno: m.turno,
          dataMatricula: formatarDataDoBackend(
            m.dataMatricula || m.data_matricula,
          ),
          taxaMatricula: m.taxaMatricula || m.taxa_matricula,
          estadoPagamento: m.estadoPagamento || m.estado_pagamento,
          estado: m.estado || "Ativa",
          dataRenovacao: m.dataRenovacao || m.data_renovacao,
          historicoTransferencias: m.historicoTransferencias || [],
          observacoes: m.observacoes,
          escolaId: normalizarEscolaId(m.escola_id),
        }));
        setTodasMatriculas(matriculasFormatadas);
        setStorage(STORAGE_KEYS.MATRICULAS, matriculasFormatadas);
      } else {
        setTodasMatriculas(getStorage(STORAGE_KEYS.MATRICULAS));
      }

      // Processar pagamentos (se o backend retornar separadamente)
      if (pagamentosData.status === "fulfilled") {
        const pagamentosList =
          pagamentosData.value.dados ||
          pagamentosData.value.data ||
          (Array.isArray(pagamentosData.value) ? pagamentosData.value : []) ||
          [];

        // Agrupar pagamentos por aluno
        const pagamentosPorAluno = {};
        pagamentosList.forEach((p) => {
          const alunoId = p.alunoId || p.aluno_id;
          if (!pagamentosPorAluno[alunoId]) {
            pagamentosPorAluno[alunoId] = [];
          }
          pagamentosPorAluno[alunoId].push({
            id: p.id,
            data: formatarDataDoBackend(p.data),
            valor: Number(p.valor),
            valorBase: p.valorBase != null ? Number(p.valorBase) : (p.valor_base != null ? Number(p.valor_base) : null),
            multa: Number(p.multa || 0),
            propinaMensal: p.propinaMensal != null ? Number(p.propinaMensal) : (p.propina_mensal != null ? Number(p.propina_mensal) : null),
            mesesSelecionados: p.mesesSelecionados || p.meses_selecionados || [],
            status: p.status,
            tipo: p.tipo || "Propina",
            referencia: p.referencia,
            formaPagamento: p.formaPagamento || p.forma_pagamento,
            funcionario: p.funcionario,
            mesReferencia: p.mesReferencia || p.mes_referencia,
          });
        });

        // Atualizar alunos com seus pagamentos
        setTodosAlunos((prev) =>
          prev.map((aluno) => ({
            ...aluno,
            pagamentos: pagamentosPorAluno[aluno.id] || aluno.pagamentos || [],
          })),
        );
      }

      // ============================================================
      // ✅ CLASSES/TURMAS — NORMALIZAR snake_case → camelCase
      // ============================================================
      if (classesData.status === "fulfilled") {
        const rawClasses =
          classesData.value?.dados ||
          classesData.value?.data ||
          (Array.isArray(classesData.value) ? classesData.value : []) ||
          [];

        const classesFormatadas = rawClasses.map((c) => ({
          id: c.id,
          nome: c.nome,
          anoLectivo: c.anoLectivo || c.ano_lectivo || "",
          escolaId: normalizarEscolaId(c.escola_id ?? c.escolaId),
          turmas: (c.turmas || []).map((t) => ({
            id: t.id,
            nome: t.nome,
            turno: t.turno || "",
            sala: t.sala || "",
            capacidadeMaxima:
              t.capacidadeMaxima ?? t.capacidade_maxima ?? 30,
            professorResponsavel:
              t.professorResponsavel ||
              t.professor_responsavel ||
              t.professor_nome ||
              "",
            professorResponsavelId:
              t.professorResponsavelId ?? t.professor_responsavel_id ?? null,
            classeId: t.classeId ?? t.classe_id ?? c.id,
            classeNome: c.nome,
          })),
        }));

        setTodasClasses(classesFormatadas);
        setStorage(STORAGE_KEYS.CLASSES, classesFormatadas);
      } else {
        setTodasClasses(getStorage(STORAGE_KEYS.CLASSES));
      }

      // Comunicados — vêm da API
      if (comunicadosData.status === "fulfilled") {
        setTodosComunicados(comunicadosData.value || []);
      } else {
        setTodosComunicados(getStorage(STORAGE_KEYS.COMUNICADOS));
      }

      // Ainda locais (sem endpoint ligado neste momento)
      setTodasConfirmacoes(getStorage(STORAGE_KEYS.CONFIRMACOES));
      setTodosAnosLectivos(getStorage(STORAGE_KEYS.ANOS_LECTIVOS));
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message);

      // Fallback para localStorage
      setTodosAlunos(getStorage(STORAGE_KEYS.ALUNOS));
      setTodosProfessores(getStorage(STORAGE_KEYS.PROFESSORES));
      setTodasMatriculas(getStorage(STORAGE_KEYS.MATRICULAS));
      setTodasClasses(getStorage(STORAGE_KEYS.CLASSES));
      setTodasConfirmacoes(getStorage(STORAGE_KEYS.CONFIRMACOES));
      setTodosComunicados(getStorage(STORAGE_KEYS.COMUNICADOS));
      setTodosAnosLectivos(getStorage(STORAGE_KEYS.ANOS_LECTIVOS));
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  // Carregar dados quando o utilizador mudar
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ============================================================
  // FILTRAGEM POR ESCOLA
  // ============================================================
  const isSuperAdmin = user?.role === "super_admin";
  const escolaIdDoUser = normalizarEscolaId(user?.escolaId);

  const filtrarPorEscola = (items) => {
    if (isSuperAdmin) return items;
    if (!escolaIdDoUser) return items; // Se não tem escola, mostrar todos (fallback)
    return items.filter((item) => {
      const itemEscolaId = normalizarEscolaId(item.escolaId);
      return itemEscolaId === null || itemEscolaId === escolaIdDoUser;
    });
  };

  const alunos = filtrarPorEscola(todosAlunos);
  const professores = filtrarPorEscola(todosProfessores);
  const matriculas = filtrarPorEscola(todasMatriculas);
  const classes = filtrarPorEscola(todasClasses);
  const confirmacoes = filtrarPorEscola(todasConfirmacoes);
  const comunicados = filtrarPorEscola(todosComunicados);
  const anosLectivos = filtrarPorEscola(todosAnosLectivos);

  const anoLectivoActual =
    anosLectivos.find((a) => a.isAnoActual)?.ano || "2026/2027";

  // ============================================================
  // SETTERS COM PERSISTÊNCIA
  // ============================================================
  const enriquecerComEscola = useCallback(
    (items) => {
      return items.map((item) => ({
        ...item,
        escolaId: normalizarEscolaId(item.escolaId) || escolaIdDoUser,
      }));
    },
    [escolaIdDoUser],
  );

  const setAlunos = useCallback(
    (updater) => {
      setTodosAlunos((prev) => {
        const novos = typeof updater === "function" ? updater(prev) : updater;
        const comEscola = enriquecerComEscola(novos);
        setStorage(STORAGE_KEYS.ALUNOS, comEscola);
        return comEscola;
      });
    },
    [escolaIdDoUser, enriquecerComEscola],
  );

  const setProfessores = useCallback(
    (updater) => {
      setTodosProfessores((prev) => {
        const novos = typeof updater === "function" ? updater(prev) : updater;
        const comEscola = enriquecerComEscola(novos);
        setStorage(STORAGE_KEYS.PROFESSORES, comEscola);
        return comEscola;
      });
    },
    [escolaIdDoUser, enriquecerComEscola],
  );

  const setMatriculas = useCallback(
    (updater) => {
      setTodasMatriculas((prev) => {
        const novos = typeof updater === "function" ? updater(prev) : updater;
        const comEscola = enriquecerComEscola(novos);
        setStorage(STORAGE_KEYS.MATRICULAS, comEscola);
        return comEscola;
      });
    },
    [escolaIdDoUser, enriquecerComEscola],
  );

  const setClasses = useCallback(
    (updater) => {
      setTodasClasses((prev) => {
        const novos = typeof updater === "function" ? updater(prev) : updater;
        const comEscola = enriquecerComEscola(novos);
        setStorage(STORAGE_KEYS.CLASSES, comEscola);
        return comEscola;
      });
    },
    [escolaIdDoUser, enriquecerComEscola],
  );

  const setConfirmacoes = useCallback(
    (updater) => {
      setTodasConfirmacoes((prev) => {
        const novos = typeof updater === "function" ? updater(prev) : updater;
        const comEscola = enriquecerComEscola(novos);
        setStorage(STORAGE_KEYS.CONFIRMACOES, comEscola);
        return comEscola;
      });
    },
    [escolaIdDoUser, enriquecerComEscola],
  );

  const setComunicados = useCallback(
    (updater) => {
      setTodosComunicados((prev) => {
        const novos = typeof updater === "function" ? updater(prev) : updater;
        const comEscola = enriquecerComEscola(novos);
        setStorage(STORAGE_KEYS.COMUNICADOS, comEscola);
        return comEscola;
      });
    },
    [escolaIdDoUser, enriquecerComEscola],
  );

  const setAnosLectivos = useCallback(
    (updater) => {
      setTodosAnosLectivos((prev) => {
        const novos = typeof updater === "function" ? updater(prev) : updater;
        const comEscola = enriquecerComEscola(novos);
        setStorage(STORAGE_KEYS.ANOS_LECTIVOS, comEscola);
        return comEscola;
      });
    },
    [escolaIdDoUser, enriquecerComEscola],
  );

  const setAnoLectivoActual = useCallback(
    (ano) => {
      setAnosLectivos((prev) =>
        prev.map((a) => ({ ...a, isAnoActual: a.ano === ano })),
      );
    },
    [setAnosLectivos],
  );

  // ============================================================
  // FUNÇÕES AUXILIARES
  // ============================================================
  const validarClasseTurmaNoAno = (anoLectivoTarget, classeNome, turmaNome) => {
    const anoObj = anosLectivos.find((a) => a.ano === anoLectivoTarget);
    if (!anoObj) return true; // Permitir se não encontrar
    const classeDisponivel =
      !anoObj.classesDisponiveis?.length ||
      anoObj.classesDisponiveis?.includes(classeNome);
    const turmaDisponivel =
      !anoObj.turmasDisponiveis?.length ||
      anoObj.turmasDisponiveis?.includes(turmaNome);
    return Boolean(classeDisponivel && turmaDisponivel);
  };

  // ============================================================
  // ADICIONAR ALUNO E MATRÍCULA (COM API)
  // ============================================================
  const adicionarAlunoEMatricula = async (alunoData, matriculaData) => {
    const anoAlvo = matriculaData.anoLectivo || anoLectivoActual;

    if (
      !validarClasseTurmaNoAno(
        anoAlvo,
        matriculaData.classe,
        matriculaData.turma,
      )
    ) {
      alert(
        `Atenção: A ${matriculaData.classe} ou a Turma ${matriculaData.turma} não estão associadas ou permitidas para o ano lectivo ${anoAlvo}!`,
      );
      return false;
    }

    try {
      // 1. Criar aluno no backend
      const alunoResponse = await alunosAPI.criar({
        ...alunoData,
        anoLectivo: anoAlvo,
      });

      const novoAlunoBackend = alunoResponse.data || alunoResponse;
      const novoAluno = {
        id: novoAlunoBackend.id,
        codigo:
          novoAlunoBackend.codigo ||
          `AL-${String(novoAlunoBackend.id).padStart(4, "0")}`,
        ...alunoData,
        anoLectivo: anoAlvo,
        escolaId: escolaIdDoUser,
        pagamentos: [],
        historico: [],
      };

      // Atualizar estado local
      setAlunos((prev) => [...prev, novoAluno]);

      // 2. Criar matrícula no backend
      const matriculaResponse = await matriculasAPI.criar({
        alunoId: novoAluno.id,
        anoLectivo: anoAlvo,
        classeId: matriculaData.classeId,
        turmaId: matriculaData.turmaId,
        classe: matriculaData.classe,
        turma: matriculaData.turma,
        turno: matriculaData.turno || "Manhã",
        dataMatricula:
          matriculaData.dataMatricula || new Date().toISOString().split("T")[0],
        taxaMatricula: matriculaData.taxaMatricula || 0,
        estadoPagamento: matriculaData.estadoPagamento || "Pendente",
        formaPagamento: matriculaData.formaPagamento,
        funcionario: matriculaData.funcionario,
        estado: "Ativa",
        observacoes: matriculaData.observacoes || "",
      });

      const novaMatriculaBackend = matriculaResponse.data || matriculaResponse;
      const novaMatricula = {
        id: novaMatriculaBackend.id,
        numero:
          novaMatriculaBackend.numero ||
          `MAT-${anoAlvo}-${String(novaMatriculaBackend.id).padStart(3, "0")}`,
        aluno: novoAluno.nome,
        alunoId: novoAluno.id,
        ...matriculaData,
        estado: novaMatriculaBackend.estado || "Ativa",
        estadoPagamento:
          novaMatriculaBackend.estadoPagamento ||
          matriculaData.estadoPagamento ||
          "Pendente",
        anoLectivo: anoAlvo,
        escolaId: escolaIdDoUser,
      };

      setMatriculas((prev) => [...prev, novaMatricula]);

      return { success: true, aluno: novoAluno, matricula: novaMatricula };
    } catch (error) {
      console.error("Erro ao salvar aluno e matrícula:", error);
      alert(`Erro ao criar matrícula: ${error.message}`);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ADICIONAR PROFESSOR (COM API)
  // ============================================================
  const adicionarProfessor = async (profData) => {
    try {
      const response = await professoresAPI.criar(profData);
      const novoProfessorBackend = response.data || response;

      const novoProfessor = {
        id: novoProfessorBackend.id,
        codigo:
          novoProfessorBackend.codigo ||
          `PROF-${String(novoProfessorBackend.id).padStart(4, "0")}`,
        ...profData,
        escolaId: escolaIdDoUser,
      };

      setProfessores((prev) => [...prev, novoProfessor]);
      return { success: true, data: novoProfessor };
    } catch (error) {
      console.error("Erro ao criar professor:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ATUALIZAR PROFESSOR (COM API)
  // ============================================================
  const atualizarProfessor = async (id, dadosAtualizados) => {
    try {
      await professoresAPI.atualizar(id, dadosAtualizados);

      setProfessores((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...dadosAtualizados } : p)),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar professor:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ELIMINAR PROFESSOR (COM API)
  // ============================================================
  const eliminarProfessor = async (id) => {
    try {
      await professoresAPI.eliminar(id);
      setProfessores((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Erro ao eliminar professor:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // CLASSES (COM API)
  // ============================================================
  const adicionarClasse = async (dados) => {
    try {
      const nova = await classesAPI.criar(dados);
      const novaClasse = {
        id: nova.id,
        nome: nova.nome || dados.nome,
        anoLectivo: nova.anoLectivo || nova.ano_lectivo || dados.anoLectivo,
        escolaId: escolaIdDoUser,
        turmas: [],
      };
      setClasses((prev) => [...prev, novaClasse]);
      return { success: true, data: novaClasse };
    } catch (error) {
      console.error("Erro ao criar classe:", error);
      return { success: false, message: error.message };
    }
  };

  const atualizarClasse = async (id, dados) => {
    try {
      await classesAPI.atualizar(id, dados);
      setClasses((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...dados } : c)),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar classe:", error);
      return { success: false, message: error.message };
    }
  };

  const eliminarClasse = async (id) => {
    try {
      await classesAPI.eliminar(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Erro ao eliminar classe:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // TURMAS (COM API) — o professor responsável é opcional
  // ============================================================
  const adicionarTurma = async (classeId, dados) => {
    try {
      const payload = { ...dados, classeId };
      const resposta = await turmasAPI.criar(payload);
      const novaTurma = {
        id: resposta.id,
        nome: dados.nome,
        turno: dados.turno,
        sala: dados.sala || "",
        professorResponsavel: dados.professorResponsavel || "",
        professorResponsavelId: dados.professorResponsavelId || null,
        capacidadeMaxima: Number(dados.capacidadeMaxima) || 30,
        classeId: classeId,
        classeNome: dados.classe || "",
      };
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classeId
            ? { ...c, turmas: [...(c.turmas || []), novaTurma] }
            : c,
        ),
      );
      return { success: true, data: novaTurma };
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      return { success: false, message: error.message };
    }
  };

  const atualizarTurma = async (classeId, turmaId, dados) => {
    try {
      await turmasAPI.atualizar(turmaId, dados);
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classeId
            ? {
                ...c,
                turmas: (c.turmas || []).map((t) =>
                  t.id === turmaId ? { ...t, ...dados } : t,
                ),
              }
            : c,
        ),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar turma:", error);
      return { success: false, message: error.message };
    }
  };

  const eliminarTurma = async (classeId, turmaId) => {
    try {
      await turmasAPI.eliminar(turmaId);
      setClasses((prev) =>
        prev.map((c) =>
          c.id === classeId
            ? { ...c, turmas: (c.turmas || []).filter((t) => t.id !== turmaId) }
            : c,
        ),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao eliminar turma:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // COMUNICADOS (COM API)
  // ============================================================
  const adicionarComunicado = async (dados) => {
    try {
      const novo = await comunicadosAPI.criar(dados);
      setComunicados((prev) => [...prev, novo]);
      return { success: true, data: novo };
    } catch (error) {
      console.error("Erro ao criar comunicado:", error);
      return { success: false, message: error.message };
    }
  };

  const marcarComunicadoLido = async (id) => {
    try {
      await comunicadosAPI.marcarLido(id);
      setComunicados((prev) =>
        prev.map((c) => (c.id === id ? { ...c, lido: true } : c)),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao marcar comunicado como lido:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ADICIONAR PAGAMENTO (COM API)
  // ============================================================
  const adicionarPagamento = async (alunoId, pagamentoData) => {
    try {
      const response = await pagamentosAPI.criar({
        alunoId,
        ...pagamentoData,
      });

      const novoPagamentoBackend = response.data || response;
      const novoPagamento = {
        id: novoPagamentoBackend.id,
        ...pagamentoData,
        data: pagamentoData.data || new Date().toISOString().split("T")[0],
      };

      setAlunos((prev) =>
        prev.map((aluno) => {
          if (Number(aluno.id) === Number(alunoId)) {
            return {
              ...aluno,
              pagamentos: [...(aluno.pagamentos || []), novoPagamento],
            };
          }
          return aluno;
        }),
      );

      return { success: true, data: novoPagamento };
    } catch (error) {
      console.error("Erro ao adicionar pagamento:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ATUALIZAR PAGAMENTO (COM API)
  // ============================================================
  const atualizarPagamento = async (alunoId, pagamentoAtualizado) => {
    try {
      await pagamentosAPI.atualizar(pagamentoAtualizado.id, {
        alunoId,
        ...pagamentoAtualizado,
      });

      setAlunos((prev) =>
        prev.map((aluno) => {
          if (Number(aluno.id) === Number(alunoId)) {
            return {
              ...aluno,
              pagamentos: (aluno.pagamentos || []).map((p) =>
                p.id === pagamentoAtualizado.id ? pagamentoAtualizado : p,
              ),
            };
          }
          return aluno;
        }),
      );

      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ELIMINAR ALUNO (COM API)
  // ============================================================
  const eliminarAluno = async (id) => {
    try {
      await alunosAPI.eliminar(id);
      setAlunos((prev) => prev.filter((a) => a.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Erro ao eliminar aluno:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ACTIVAR / DESACTIVAR ALUNO (COM API)
  // ============================================================
  const alterarEstadoAluno = async (id, novoEstado) => {
    try {
      await alunosAPI.alterarEstado(id, novoEstado);
      setAlunos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, estado: novoEstado } : a)),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao alterar estado do aluno:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // ATUALIZAR ALUNO (COM API)
  // ============================================================
  const atualizarAluno = async (id, dadosAtualizados) => {
    try {
      await alunosAPI.atualizar(id, dadosAtualizados);

      setAlunos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...dadosAtualizados } : a)),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar aluno:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // MATRÍCULAS: TRANSFERIR / CANCELAR / RENOVAR (COM API)
  // ============================================================
  const transferirMatricula = async (matriculaId, { novaTurma, motivo }) => {
    try {
      // Resolve o nome da turma escolhida para o respectivo id, usando as
      // classes/turmas já carregadas do backend (classes vem do contexto)
      const turmaEncontrada = (classes || [])
        .flatMap((c) => c.turmas || [])
        .find((t) => t.nome === novaTurma);

      if (!turmaEncontrada) {
        return {
          success: false,
          message: `Turma "${novaTurma}" não encontrada.`,
        };
      }

      await matriculasAPI.transferir(matriculaId, {
        novaTurmaId: turmaEncontrada.id,
        motivo,
      });

      setMatriculas((prev) =>
        prev.map((m) =>
          m.id === matriculaId ? { ...m, turma: novaTurma } : m,
        ),
      );

      return { success: true };
    } catch (error) {
      console.error("Erro ao transferir matrícula:", error);
      return { success: false, message: error.message };
    }
  };

  const cancelarMatricula = async (matriculaId, motivo) => {
    try {
      await matriculasAPI.cancelar(matriculaId, motivo);
      setMatriculas((prev) => prev.filter((m) => m.id !== matriculaId));
      return { success: true };
    } catch (error) {
      console.error("Erro ao cancelar matrícula:", error);
      return { success: false, message: error.message };
    }
  };

  // Nota: o backend renova mantendo a mesma classe/turma da matrícula anterior
  // (só muda o ano lectivo). Para mudar de classe/turma, usa "Transferir Turma".
  const renovarMatricula = async (matriculaId, anoLectivo) => {
    try {
      const novaMatricula = await matriculasAPI.renovar(matriculaId, anoLectivo);
      setMatriculas((prev) => [...prev, novaMatricula]);
      return { success: true, data: novaMatricula };
    } catch (error) {
      console.error("Erro ao renovar matrícula:", error);
      return { success: false, message: error.message };
    }
  };

  // ============================================================
  // CONFIRMAÇÕES (reconfirmação de matrícula) — COM API
  // ============================================================
  const solicitarConfirmacao = async (dados) => {
    try {
      const nova = await confirmacoesAPI.criar(dados);
      setConfirmacoes((prev) => [...prev, nova]);
      return { success: true, data: nova };
    } catch (error) {
      console.error("Erro ao solicitar confirmação:", error);
      return { success: false, message: error.message };
    }
  };

  const atualizarConfirmacao = async (id, dados) => {
    try {
      const atualizada = await confirmacoesAPI.atualizar(id, dados);
      setConfirmacoes((prev) =>
        prev.map((c) => (c.id === id ? atualizada : c)),
      );
      return { success: true, data: atualizada };
    } catch (error) {
      console.error("Erro ao atualizar confirmação:", error);
      return { success: false, message: error.message };
    }
  };

  // Confirma a reconfirmação e, de seguida, actualiza o aluno para a nova
  // classe/turma/ano lectivo (o backend não faz isso sozinho)
  const confirmarReconfirmacao = async (id, dadosParaAluno) => {
    try {
      const atualizada = await confirmacoesAPI.confirmar(id);
      setConfirmacoes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...atualizada, status: "Confirmado" } : c)),
      );

      if (dadosParaAluno?.alunoId) {
        await atualizarAluno(dadosParaAluno.alunoId, {
          classe: dadosParaAluno.classe,
          turma: dadosParaAluno.turma,
          anoLectivo: dadosParaAluno.anoLectivo,
        });
      }

      return { success: true, data: atualizada };
    } catch (error) {
      console.error("Erro ao confirmar reconfirmação:", error);
      return { success: false, message: error.message };
    }
  };

  const rejeitarReconfirmacao = async (id) => {
    try {
      await confirmacoesAPI.rejeitar(id);
      setConfirmacoes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: "Rejeitado" } : c)),
      );
      return { success: true };
    } catch (error) {
      console.error("Erro ao rejeitar reconfirmação:", error);
      return { success: false, message: error.message };
    }
  };

  const removerConfirmacao = async (id) => {
    try {
      await confirmacoesAPI.eliminar(id);
      setConfirmacoes((prev) => prev.filter((c) => c.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Erro ao remover confirmação:", error);
      return { success: false, message: error.message };
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        // Dados
        classes,
        setClasses,
        anosLectivos,
        setAnosLectivos,
        anoLectivoActual,
        setAnoLectivoActual,
        alunos,
        setAlunos,
        professores,
        setProfessores,
        matriculas,
        setMatriculas,
        confirmacoes,
        setConfirmacoes,
        comunicados,
        setComunicados,

        // Estados
        loading,
        error,

        // Funções
        validarClasseTurmaNoAno,
        adicionarAlunoEMatricula,
        adicionarProfessor,
        atualizarProfessor,
        eliminarProfessor,
        adicionarPagamento,
        atualizarPagamento,
        eliminarAluno,
        atualizarAluno,
        alterarEstadoAluno,
        adicionarClasse,
        atualizarClasse,
        eliminarClasse,
        adicionarTurma,
        atualizarTurma,
        eliminarTurma,
        adicionarComunicado,
        marcarComunicadoLido,
        transferirMatricula,
        cancelarMatricula,
        renovarMatricula,
        solicitarConfirmacao,
        atualizarConfirmacao,
        confirmarReconfirmacao,
        rejeitarReconfirmacao,
        removerConfirmacao,
        carregarDados,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSchool = () => useContext(SchoolContext);