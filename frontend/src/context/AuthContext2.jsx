// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

// ============================================================
// CONFIG PADRÃO DO RECIBO
// ============================================================
const CONFIG_RECIBO_PADRAO = {
  nomeInstituicao: "NOME DA INSTITUIÇÃO",
  subtituloInstituicao: "GESTÃO ESCOLAR",
  sigla: "ESCOLA",
  endereco: "",
  telefone: "",
  telefone2: "",
  email: "",
  website: "",
  nif: "",
  tituloPrincipal: "RECIBO DE PAGAMENTO",
  subtituloPropina: "PROPINAS",
  subtituloMatricula: "TAXA DE MATRÍCULA",
  subtituloConfirmacao: "TAXA DE CONFIRMAÇÃO",
  subtituloPagamento: "PAGAMENTO DE SERVIÇOS",
  textoViaOriginal: "ORIGINAL - 1ª VIA",
  textoViaCopia: "DUPLICADO - 2ª VIA",
  textoViaEscola: "VIA DA ESCOLA",
  rodapeRecibo: "Este documento serve como comprovativo de pagamento.",
  textoLegal:
    "Emitido por programa validado - FONTE: SISTEMA DE GESTÃO ESCOLAR LUKI © 2026",
  cargoResponsavel: "SECRETARIA",
  nomeResponsavel: "",
  mostrarBancos: false,
  bancos: [],
  corPrimaria: "#1a3a1a",
  corSecundaria: "#2a5a2a",
  corTexto: "#ffffff",
  mostrarLogo: true,
  logoUrl: null,
  formatoPapel: "A4",
  orientacao: "landscape",
  numeroVias: 2,
};

// Utilizadores iniciais (apenas Super Admin - fallback)
const UTILIZADORES_INICIAIS = [
  {
    id: 1,
    nome: "Super Administrador",
    email: "admin@luki.ao",
    senha: "admin123",
    role: "super_admin",
    escolaId: null,
    estado: "Activo",
    telefone: "+244 900 000 000",
    avatar: null,
    createdAt: new Date().toISOString(),
  },
];

const ESCOLAS_INICIAIS = [];

const STORAGE_KEYS = {
  TOKEN: "luki_token",
  USER: "luki_user",
  USERS: "luki_users",
  ESCOLAS: "luki_escolas",
};

// ============================================================
// ✅ HELPER: Normalizar escolaId para Number ou null
// ============================================================
const normalizarEscolaId = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const num = Number(valor);
  return Number.isNaN(num) ? null : num;
};

const inicializarDados = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(
      STORAGE_KEYS.USERS,
      JSON.stringify(UTILIZADORES_INICIAIS),
    );
  }
  if (!localStorage.getItem(STORAGE_KEYS.ESCOLAS)) {
    localStorage.setItem(
      STORAGE_KEYS.ESCOLAS,
      JSON.stringify(ESCOLAS_INICIAIS),
    );
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem(STORAGE_KEYS.TOKEN));
  const [users, setUsers] = useState([]);
  const [escolas, setEscolas] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = () => setRefreshTrigger((v) => v + 1);

  useEffect(() => {
    inicializarDados();
    const storedUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
    );
    const storedEscolas = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
    );
    setUsers(storedUsers);
    setEscolas(storedEscolas);
  }, [refreshTrigger]);

  useEffect(() => {
    const verificarAuth = () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedToken && storedUser) {
        try {
          const u = JSON.parse(storedUser);
          u.escolaId = normalizarEscolaId(u.escolaId);
          setToken(storedToken);
          setUser(u);
        } catch (error) {
          localStorage.removeItem(STORAGE_KEYS.TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };
    verificarAuth();
  }, []);

  // ==================== LOGIN ====================
  const login = async (email, senha) => {
    try {
      // Tentar login via API primeiro
      try {
        const response = await authAPI.login(email, senha);
        const { token: novoToken, user: userData } = response;

        const utilizadorFinal = {
          ...userData,
          escolaId: normalizarEscolaId(userData.escolaId || userData.escola_id),
        };

        localStorage.setItem(STORAGE_KEYS.TOKEN, novoToken);
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(utilizadorFinal),
        );
        setToken(novoToken);
        setUser(utilizadorFinal);

        return { success: true, data: utilizadorFinal };
      } catch (apiError) {
        // Fallback para login local
        console.warn("API login falhou, tentando local:", apiError.message);

        const storedUsers = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
        );
        const storedEscolas = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
        );

        const utilizador = storedUsers.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() && u.senha === senha,
        );

        if (!utilizador)
          return { success: false, message: "Email ou senha incorrectos." };
        if (utilizador.estado !== "Activo")
          return { success: false, message: "Conta inactiva ou suspensa." };

        const escolaIdNormalizado = normalizarEscolaId(utilizador.escolaId);

        if (utilizador.role !== "super_admin" && escolaIdNormalizado) {
          const escola = storedEscolas.find(
            (e) => Number(e.id) === escolaIdNormalizado,
          );
          if (!escola) {
            return {
              success: false,
              message:
                "A escola associada não foi encontrada. Contacte o suporte.",
            };
          }
          if (escola.estado !== "Activo") {
            return {
              success: false,
              message: `A escola "${escola.nome}" está com a utilização suspensa. Contacte o suporte LUKI.`,
            };
          }
        }

        const novoToken = `token_${utilizador.id}_${Date.now()}`;
        const utilizadorFinal = {
          ...utilizador,
          escolaId: escolaIdNormalizado,
        };

        localStorage.setItem(STORAGE_KEYS.TOKEN, novoToken);
        localStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(utilizadorFinal),
        );
        setToken(novoToken);
        setUser(utilizadorFinal);

        return { success: true, data: utilizadorFinal };
      }
    } catch (error) {
      return { success: false, message: "Erro ao fazer login." };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    setToken(null);
  };

  const hasPermission = (roles) => {
    if (!user) return false;
    if (!roles || roles.length === 0) return true;
    return roles.includes(user.role);
  };

  const isSuperAdmin = () => user?.role === "super_admin";
  const isAdminEscola = () => user?.role === "admin_escola";
  const isAdmin = () => ["super_admin", "admin_escola"].includes(user?.role);

  // ==================== GESTÃO DE UTILIZADORES ====================
  const criarUser = async (userData) => {
    const storedUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
    );
    if (
      storedUsers.some(
        (u) => u.email.toLowerCase() === userData.email.toLowerCase(),
      )
    ) {
      return { success: false, message: "Este email já está registado." };
    }

    const escolaIdNormalizado = normalizarEscolaId(userData.escolaId);

    if (userData.role !== "super_admin" && !escolaIdNormalizado) {
      return {
        success: false,
        message: "Selecione uma escola para este utilizador.",
      };
    }

    if (escolaIdNormalizado) {
      const storedEscolas = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
      );
      const escolaExiste = storedEscolas.some(
        (e) => Number(e.id) === escolaIdNormalizado,
      );
      if (!escolaExiste) {
        return { success: false, message: "A escola selecionada não existe." };
      }
    }

    const novoUser = {
      id: Math.max(...storedUsers.map((u) => u.id), 0) + 1,
      ...userData,
      escolaId: escolaIdNormalizado,
      estado: userData.estado || "Activo",
      avatar: null,
      createdAt: new Date().toISOString(),
    };
    const usersAtualizados = [...storedUsers, novoUser];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersAtualizados));
    setUsers(usersAtualizados);
    refresh();
    return { success: true, data: novoUser };
  };

  const actualizarUser = async (id, userData) => {
    const storedUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
    );
    if (userData.email) {
      const emailDuplicado = storedUsers.some(
        (u) =>
          u.id !== id && u.email.toLowerCase() === userData.email.toLowerCase(),
      );
      if (emailDuplicado) {
        return {
          success: false,
          message: "Este email já está registado noutro utilizador.",
        };
      }
    }

    const dadosNormalizados = { ...userData };
    if ("escolaId" in dadosNormalizados) {
      dadosNormalizados.escolaId = normalizarEscolaId(
        dadosNormalizados.escolaId,
      );
    }

    const usersAtualizados = storedUsers.map((u) =>
      u.id === id ? { ...u, ...dadosNormalizados } : u,
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersAtualizados));
    setUsers(usersAtualizados);

    if (user && user.id === id) {
      const userActualizado = usersAtualizados.find((u) => u.id === id);
      setUser(userActualizado);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userActualizado));
    }
    refresh();
    return { success: true };
  };

  const eliminarUser = async (id) => {
    if (user && user.id === id) {
      return {
        success: false,
        message: "Não pode eliminar a sua própria conta.",
      };
    }
    const storedUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
    );
    const userExiste = storedUsers.find((u) => u.id === id);
    if (!userExiste) {
      return { success: false, message: "Utilizador não encontrado." };
    }

    const usersAtualizados = storedUsers.filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersAtualizados));
    setUsers(usersAtualizados);
    refresh();
    return { success: true };
  };

  const resetarSenha = async (id, novaSenha) => {
    const storedUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
    );
    const usersAtualizados = storedUsers.map((u) =>
      u.id === id ? { ...u, senha: novaSenha } : u,
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersAtualizados));
    setUsers(usersAtualizados);
    return { success: true };
  };

  const toggleEstadoUser = async (id) => {
    if (user && user.id === id) {
      return {
        success: false,
        message: "Não pode alterar o estado da sua própria conta.",
      };
    }
    const storedUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
    );
    const usersAtualizados = storedUsers.map((u) =>
      u.id === id
        ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" }
        : u,
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersAtualizados));
    setUsers(usersAtualizados);
    refresh();
    return { success: true };
  };

  // ==================== GESTÃO DE ESCOLAS ====================
  const criarEscola = async (escolaData) => {
    const storedEscolas = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
    );
    const novaEscola = {
      id: Math.max(...storedEscolas.map((e) => Number(e.id)), 0) + 1,
      ...escolaData,
      configRecibo: {
        ...CONFIG_RECIBO_PADRAO,
        nomeInstituicao: escolaData.nome || "NOME DA INSTITUIÇÃO",
        sigla: escolaData.sigla || "ESCOLA",
        endereco: escolaData.endereco || "",
        telefone: escolaData.telefone || "",
        email: escolaData.email || "",
        nif: escolaData.nif || "",
      },
      plano: escolaData.plano || "basico",
      estado: escolaData.estado || "Activo",
      dataRegisto: new Date().toISOString(),
    };
    const escolasAtualizadas = [...storedEscolas, novaEscola];
    localStorage.setItem(
      STORAGE_KEYS.ESCOLAS,
      JSON.stringify(escolasAtualizadas),
    );
    setEscolas(escolasAtualizadas);
    refresh();
    return { success: true, data: novaEscola };
  };

  const actualizarEscola = async (id, escolaData) => {
    const idNormalizado = normalizarEscolaId(id);
    const storedEscolas = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
    );
    const escolasAtualizadas = storedEscolas.map((e) =>
      Number(e.id) === idNormalizado ? { ...e, ...escolaData } : e,
    );
    localStorage.setItem(
      STORAGE_KEYS.ESCOLAS,
      JSON.stringify(escolasAtualizadas),
    );
    setEscolas(escolasAtualizadas);
    refresh();
    return { success: true };
  };

  const eliminarEscola = async (id) => {
    const idNormalizado = normalizarEscolaId(id);
    const storedUsers = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USERS) || "[]",
    );
    const usersAssociados = storedUsers.filter(
      (u) => normalizarEscolaId(u.escolaId) === idNormalizado,
    );
    if (usersAssociados.length > 0) {
      return {
        success: false,
        message: `Não é possível eliminar. Existem ${usersAssociados.length} utilizadores associados.`,
      };
    }
    const storedEscolas = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
    );
    const escolasAtualizadas = storedEscolas.filter(
      (e) => Number(e.id) !== idNormalizado,
    );
    localStorage.setItem(
      STORAGE_KEYS.ESCOLAS,
      JSON.stringify(escolasAtualizadas),
    );
    setEscolas(escolasAtualizadas);
    refresh();
    return { success: true };
  };

  const obterEscola = (id) => {
    const idNormalizado = normalizarEscolaId(id);
    return escolas.find((e) => Number(e.id) === idNormalizado);
  };

  // ============================================================
  // CONFIGURAÇÃO DO RECIBO POR ESCOLA
  // ============================================================
  const obterConfigReciboDaEscola = (escolaId = null) => {
    const targetEscolaId =
      normalizarEscolaId(escolaId) || normalizarEscolaId(user?.escolaId);

    if (!targetEscolaId) {
      return CONFIG_RECIBO_PADRAO;
    }

    const escola = escolas.find((e) => Number(e.id) === targetEscolaId);
    if (!escola) return CONFIG_RECIBO_PADRAO;

    if (!escola.configRecibo) {
      return {
        ...CONFIG_RECIBO_PADRAO,
        nomeInstituicao: escola.nome || "NOME DA INSTITUIÇÃO",
        sigla: escola.sigla || "ESCOLA",
        endereco: escola.endereco || "",
        telefone: escola.telefone || "",
        email: escola.email || "",
        nif: escola.nif || "",
      };
    }

    return escola.configRecibo;
  };

  const actualizarConfigRecibo = async (novaConfig, escolaId = null) => {
    const targetEscolaId =
      normalizarEscolaId(escolaId) || normalizarEscolaId(user?.escolaId);

    if (!targetEscolaId) {
      return {
        success: false,
        message:
          "Nenhuma escola selecionada. Selecione uma escola para configurar.",
      };
    }

    const storedEscolas = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
    );
    let escolaEncontrada = false;
    const escolasAtualizadas = storedEscolas.map((e) => {
      if (Number(e.id) === targetEscolaId) {
        escolaEncontrada = true;
        const configAtual = e.configRecibo || CONFIG_RECIBO_PADRAO;
        return {
          ...e,
          configRecibo: {
            ...configAtual,
            ...novaConfig,
            ultimaActualizacao: new Date().toISOString(),
          },
        };
      }
      return e;
    });

    if (!escolaEncontrada) {
      return { success: false, message: "Escola não encontrada." };
    }

    localStorage.setItem(
      STORAGE_KEYS.ESCOLAS,
      JSON.stringify(escolasAtualizadas),
    );
    setEscolas(escolasAtualizadas);
    refresh();

    window.dispatchEvent(
      new CustomEvent("luki:config-recibo-updated", {
        detail: { escolaId: targetEscolaId, config: novaConfig },
      }),
    );

    return { success: true };
  };

  const resetarConfigRecibo = async (escolaId = null) => {
    const targetEscolaId =
      normalizarEscolaId(escolaId) || normalizarEscolaId(user?.escolaId);

    if (!targetEscolaId) {
      return { success: false, message: "Nenhuma escola selecionada." };
    }

    const storedEscolas = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ESCOLAS) || "[]",
    );
    const escolasAtualizadas = storedEscolas.map((e) => {
      if (Number(e.id) === targetEscolaId) {
        return {
          ...e,
          configRecibo: {
            ...CONFIG_RECIBO_PADRAO,
            nomeInstituicao: e.nome || "NOME DA INSTITUIÇÃO",
            sigla: e.sigla || "ESCOLA",
            endereco: e.endereco || "",
            telefone: e.telefone || "",
            email: e.email || "",
            nif: e.nif || "",
          },
        };
      }
      return e;
    });
    localStorage.setItem(
      STORAGE_KEYS.ESCOLAS,
      JSON.stringify(escolasAtualizadas),
    );
    setEscolas(escolasAtualizadas);
    refresh();
    return { success: true };
  };

  const configRecibo =
    user?.role === "super_admin"
      ? CONFIG_RECIBO_PADRAO
      : obterConfigReciboDaEscola();

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        users,
        escolas,
        configRecibo,
        login,
        logout,
        hasPermission,
        isSuperAdmin,
        isAdminEscola,
        isAdmin,
        criarUser,
        actualizarUser,
        eliminarUser,
        resetarSenha,
        toggleEstadoUser,
        criarEscola,
        actualizarEscola,
        eliminarEscola,
        obterEscola,
        actualizarConfigRecibo,
        resetarConfigRecibo,
        obterConfigReciboDaEscola,
        CONFIG_RECIBO_PADRAO,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};

export default AuthContext;
