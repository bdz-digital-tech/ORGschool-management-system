import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, escolasAPI } from '../services/api';
import { CONFIG_RECIBO_PADRAO } from '../config/reciboConfigPadrao';

const AuthContext = createContext();

const TOKEN_KEY = 'luki_token';
const USER_KEY = 'luki_user';
const ESCOLA_KEY = 'luki_escola';

// Junta os dados da escola (nome/endereço/telefone/email/configRecibo) com os defeitos do recibo
function mapEscolaParaConfigRecibo(escola) {
  if (!escola) return CONFIG_RECIBO_PADRAO;
  return {
    ...CONFIG_RECIBO_PADRAO,
    ...(escola.configRecibo || {}),
    nomeInstituicao: escola.configRecibo?.nomeInstituicao || escola.nome || CONFIG_RECIBO_PADRAO.nomeInstituicao,
    endereco: escola.configRecibo?.endereco || escola.endereco || CONFIG_RECIBO_PADRAO.endereco,
    telefone: escola.configRecibo?.telefone || escola.telefone || CONFIG_RECIBO_PADRAO.telefone,
    email: escola.configRecibo?.email || escola.email || CONFIG_RECIBO_PADRAO.email,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [escolas, setEscolas] = useState([]); // escolas já conhecidas (pelo menos a do próprio utilizador)
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Ao iniciar a app, recupera a sessão guardada (se existir)
  useEffect(() => {
    async function hidratar() {
      const tokenGuardado = localStorage.getItem(TOKEN_KEY);
      const userGuardado = localStorage.getItem(USER_KEY);
      const escolaGuardada = localStorage.getItem(ESCOLA_KEY);

      if (!tokenGuardado || !userGuardado) {
        setCarregando(false);
        return;
      }

      try {
        setToken(tokenGuardado);
        setUser(JSON.parse(userGuardado));
        if (escolaGuardada) {
          setEscolas([JSON.parse(escolaGuardada)]);
        } else if (authAPI.me) {
          // Sessão antiga sem escola guardada — busca ao backend
          const resposta = await authAPI.me();
          if (resposta?.escola) {
            setEscolas([resposta.escola]);
            localStorage.setItem(ESCOLA_KEY, JSON.stringify(resposta.escola));
          }
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ESCOLA_KEY);
      }
      setCarregando(false);
    }
    hidratar();
  }, []);

  const login = async (email, senha) => {
    setErro(null);
    try {
      const resposta = await authAPI.login(email, senha);
      // Backend devolve { token, user: {...}, escola: {...} }
      localStorage.setItem(TOKEN_KEY, resposta.token);
      localStorage.setItem(USER_KEY, JSON.stringify(resposta.user));
      if (resposta.escola) {
        localStorage.setItem(ESCOLA_KEY, JSON.stringify(resposta.escola));
        setEscolas([resposta.escola]);
      }
      setToken(resposta.token);
      setUser(resposta.user);
      return { success: true };
    } catch (error) {
      setErro(error.message);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ESCOLA_KEY);
    setToken(null);
    setUser(null);
    setEscolas([]);
  };

  // Config do recibo da escola actual (a mais usada — não precisa de id)
  const configRecibo = escolas.length > 0 ? mapEscolaParaConfigRecibo(escolas[0]) : null;

  // Usado pelo ReciboUnificado — é SÍNCRONA de propósito (lê da cache em memória,
  // nunca busca à API no momento, para não travar o render)
  const obterConfigReciboDaEscola = useCallback(
    (escolaId) => {
      const escola = escolas.find((e) => e.id === escolaId);
      return mapEscolaParaConfigRecibo(escola || escolas[0]);
    },
    [escolas]
  );

  // Actualizar os dados/config de recibo da própria escola (ecrã de configurações)
  const atualizarEscola = async (escolaId, dados) => {
    try {
      const escolaAtualizada = await escolasAPI.atualizar(escolaId, dados);
      setEscolas((prev) =>
        prev.map((e) => (e.id === escolaId ? escolaAtualizada : e))
      );
      if (escolas[0]?.id === escolaId) {
        localStorage.setItem(ESCOLA_KEY, JSON.stringify(escolaAtualizada));
      }
      return { success: true, data: escolaAtualizada };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        carregando,
        erro,
        login,
        logout,
        escolas,
        configRecibo,
        CONFIG_RECIBO_PADRAO,
        obterConfigReciboDaEscola,
        atualizarEscola,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
