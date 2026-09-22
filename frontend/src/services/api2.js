let API_BASE_URL = 'http://localhost:4000/api';

// Vite
if (typeof import.meta !== 'undefined' && import.meta.env) {
  API_BASE_URL = import.meta.env.VITE_API_URL || API_BASE_URL;
}
// Create React App
else if (typeof process !== 'undefined' && process.env) {
  API_BASE_URL = process.env.REACT_APP_API_URL || API_BASE_URL;
}

console.log('🔗 API URL:', API_BASE_URL);

// ============================================================
// HELPER: Obter token do localStorage
// ============================================================
const getToken = () => {
  return localStorage.getItem('luki_token');
};
// ============================================================
// HELPER: Fazer requisição à API
// ============================================================
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Se não autorizado, limpar token
   if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('luki_token');
    localStorage.removeItem('luki_user');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

    const data = await response.json();

  if (!response.ok) {
    throw new Error(data.erro || data.message || data.error || 'Erro na requisição');
  }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// ============================================================
// HELPER: Formatar data para o backend (DD/MM/YYYY)
// ============================================================
export const formatarDataParaBackend = (data) => {
  if (!data) return null;
  
  // Se já está no formato DD/MM/YYYY
  if (typeof data === 'string' && data.includes('/')) {
    return data;
  }
  
  const d = new Date(data);
  if (isNaN(d.getTime())) return null;
  
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
};

// ============================================================
// HELPER: Formatar data do backend para o frontend (YYYY-MM-DD)
// ============================================================
export const formatarDataDoBackend = (data) => {
  if (!data) return '';
  
  // Se já está no formato YYYY-MM-DD
  if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return data;
  }
  
  // Se está no formato DD/MM/YYYY
  if (typeof data === 'string' && data.includes('/')) {
    const [dia, mes, ano] = data.split('/');
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  const d = new Date(data);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
};

// ============================================================
// API: ALUNOS
// ============================================================
export const alunosAPI = {
  // Listar todos os alunos
  listar: async () => {
    return apiRequest('/alunos');
  },

  // Buscar aluno por ID
  buscar: async (id) => {
    return apiRequest(`/alunos/${id}`);
  },

  // Criar novo aluno
  criar: async (dados) => {
    const payload = {
      nome: dados.nome,
      sexo: dados.sexo || null,
      data_nascimento: formatarDataParaBackend(dados.dataNascimento || dados.data_nascimento),
      bi: dados.bi || null,
      contacto: dados.contacto || null,
      email: dados.email || null,
      encarregado: dados.encarregado || null,
      contacto_encarregado: dados.contactoEncarregado || dados.contacto_encarregado || null,
      email_encarregado: dados.emailEncarregado || dados.email_encarregado || null,
      parentesco: dados.parentesco || null,
      turma_id: dados.turmaId || dados.turma_id || null,
      classe_id: dados.classeId || dados.classe_id || null,
      // Nomes (o backend resolve para turma_id/classe_id quando os IDs não vêm preenchidos)
      turma: dados.turma || null,
      classe: dados.classe || null,
      ano_lectivo: dados.anoLectivo || dados.ano_lectivo || null,
      estado: dados.estado || 'Ativo',
      data_matricula: formatarDataParaBackend(dados.dataMatricula || dados.data_matricula),
    };

    return apiRequest('/alunos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Atualizar aluno
  atualizar: async (id, dados) => {
    const payload = {
      nome: dados.nome,
      sexo: dados.sexo || null,
      data_nascimento: formatarDataParaBackend(dados.dataNascimento || dados.data_nascimento),
      bi: dados.bi || null,
      contacto: dados.contacto || null,
      email: dados.email || null,
      encarregado: dados.encarregado || null,
      contacto_encarregado: dados.contactoEncarregado || dados.contacto_encarregado || null,
      email_encarregado: dados.emailEncarregado || dados.email_encarregado || null,
      parentesco: dados.parentesco || null,
      turma_id: dados.turmaId || dados.turma_id || null,
      classe_id: dados.classeId || dados.classe_id || null,
      turma: dados.turma || null,
      classe: dados.classe || null,
      ano_lectivo: dados.anoLectivo || dados.ano_lectivo || null,
      estado: dados.estado || 'Ativo',
      data_matricula: formatarDataParaBackend(dados.dataMatricula || dados.data_matricula),
    };

    return apiRequest(`/alunos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Eliminar aluno
  eliminar: async (id) => {
    return apiRequest(`/alunos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// API: PROFESSORES
// ============================================================
export const professoresAPI = {
  listar: async () => {
    return apiRequest('/professores');
  },

  buscar: async (id) => {
    return apiRequest(`/professores/${id}`);
  },

  criar: async (dados) => {
    const payload = {
      nome: dados.nome,
      sexo: dados.sexo || null,
      data_nascimento: formatarDataParaBackend(dados.dataNascimento || dados.data_nascimento),
      contacto: dados.contacto || null,
      email: dados.email || null,
      endereco: dados.endereco || null,
      especialidade: Array.isArray(dados.especialidade) 
        ? dados.especialidade.join(', ') 
        : dados.especialidade || null,
      data_contratacao: formatarDataParaBackend(dados.dataContratacao || dados.data_contratacao),
      formacao: dados.formacao || null,
      experiencia: dados.experiencia || null,
      observacoes: dados.observacoes || null,
      estado: dados.estado || 'Ativo',
      disciplinas: Array.isArray(dados.disciplinas) ? dados.disciplinas : [],
      classes: Array.isArray(dados.classes) ? dados.classes : [],
      turmas: Array.isArray(dados.turmas) ? dados.turmas : [],
    };

    return apiRequest('/professores', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  atualizar: async (id, dados) => {
    const payload = {
      nome: dados.nome,
      sexo: dados.sexo || null,
      data_nascimento: formatarDataParaBackend(dados.dataNascimento || dados.data_nascimento),
      contacto: dados.contacto || null,
      email: dados.email || null,
      endereco: dados.endereco || null,
      especialidade: Array.isArray(dados.especialidade) 
        ? dados.especialidade.join(', ') 
        : dados.especialidade || null,
      data_contratacao: formatarDataParaBackend(dados.dataContratacao || dados.data_contratacao),
      formacao: dados.formacao || null,
      experiencia: dados.experiencia || null,
      observacoes: dados.observacoes || null,
      estado: dados.estado || 'Ativo',
      disciplinas: Array.isArray(dados.disciplinas) ? dados.disciplinas : [],
      classes: Array.isArray(dados.classes) ? dados.classes : [],
      turmas: Array.isArray(dados.turmas) ? dados.turmas : [],
    };

    return apiRequest(`/professores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  eliminar: async (id) => {
    return apiRequest(`/professores/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// API: MATRÍCULAS
// ============================================================
export const matriculasAPI = {
  listar: async () => {
    return apiRequest('/matriculas');
  },

  buscar: async (id) => {
    return apiRequest(`/matriculas/${id}`);
  },

  criar: async (dados) => {
    const payload = {
      alunoId: dados.alunoId,
      anoLectivo: dados.anoLectivo,
      classeId: dados.classeId || dados.classe_id,
      turmaId: dados.turmaId || dados.turma_id,
      // Nomes (o backend resolve para classeId/turmaId quando os IDs não vêm preenchidos)
      classe: dados.classe || null,
      turma: dados.turma || null,
      turno: dados.turno || 'Manhã',
      dataMatricula: formatarDataParaBackend(dados.dataMatricula || dados.data_matricula),
      taxaMatricula: Number(dados.taxaMatricula || dados.taxa_matricula || 0),
      estadoPagamento: dados.estadoPagamento || 'Pendente',
      estado: dados.estado || 'Pendente',
      formaPagamento: dados.formaPagamento || null,
      funcionario: dados.funcionario || null,
      observacoes: dados.observacoes || null,
    };

    return apiRequest('/matriculas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  atualizar: async (id, dados) => {
    const payload = {
      alunoId: dados.alunoId,
      anoLectivo: dados.anoLectivo,
      classeId: dados.classeId || dados.classe_id,
      turmaId: dados.turmaId || dados.turma_id,
      classe: dados.classe || null,
      turma: dados.turma || null,
      turno: dados.turno,
      dataMatricula: formatarDataParaBackend(dados.dataMatricula || dados.data_matricula),
      taxaMatricula: Number(dados.taxaMatricula || dados.taxa_matricula || 0),
      estadoPagamento: dados.estadoPagamento,
      estado: dados.estado,
      observacoes: dados.observacoes || null,
    };

    return apiRequest(`/matriculas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  eliminar: async (id) => {
    return apiRequest(`/matriculas/${id}`, {
      method: 'DELETE',
    });
  },

  transferir: async (id, { novaTurmaId, motivo }) => {
    return apiRequest(`/matriculas/${id}/transferir`, {
      method: 'POST',
      body: JSON.stringify({ novaTurmaId, motivo }),
    });
  },

   renovar: async (id, anoLectivo) => {
    return apiRequest(`/matriculas/${id}/renovar`, {
      method: 'POST',
      body: JSON.stringify({ anoLectivo }),
    });
  },

  cancelar: async (id, motivo) => {
    return apiRequest(`/matriculas/${id}/cancelar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo }),
    });
  },
};

// ============================================================
// API: CONFIRMAÇÕES (reconfirmação de matrícula)
// ============================================================
export const confirmacoesAPI = {
  listar: async () => {
    return apiRequest('/confirmacoes');
  },

  buscar: async (id) => {
    return apiRequest(`/confirmacoes/${id}`);
  },

  criar: async (dados) => {
    return apiRequest('/confirmacoes', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  atualizar: async (id, dados) => {
    return apiRequest(`/confirmacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  },

  confirmar: async (id) => {
    return apiRequest(`/confirmacoes/${id}/confirmar`, {
      method: 'PATCH',
    });
  },

  rejeitar: async (id) => {
    return apiRequest(`/confirmacoes/${id}/rejeitar`, {
      method: 'PATCH',
    });
  },

  eliminar: async (id) => {
    return apiRequest(`/confirmacoes/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// API: PAGAMENTOS
// ============================================================
export const pagamentosAPI = {
  listar: async () => {
    return apiRequest('/pagamentos');
  },

  buscar: async (id) => {
    return apiRequest(`/pagamentos/${id}`);
  },

  criar: async (dados) => {
    const payload = {
      alunoId: dados.alunoId,
      data: formatarDataParaBackend(dados.data) || formatarDataParaBackend(new Date()),
      valor: Number(dados.valor || 0),
      valorBase: dados.valorBase != null ? Number(dados.valorBase) : null,
      multa: Number(dados.multa || 0),
      propinaMensal: dados.propinaMensal != null ? Number(dados.propinaMensal) : null,
      mesesSelecionados: Array.isArray(dados.mesesSelecionados) ? dados.mesesSelecionados : [],
      status: dados.status || 'Pendente',
      tipo: dados.tipo || 'Propina',
      formaPagamento: dados.formaPagamento || 'Dinheiro',
      referencia: dados.referencia || null,
      funcionario: dados.funcionario || null,
      mesReferencia: dados.mesReferencia || null,
    };

    return apiRequest('/pagamentos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  atualizar: async (id, dados) => {
    const payload = {
      alunoId: dados.alunoId,
      data: formatarDataParaBackend(dados.data),
      valor: Number(dados.valor || 0),
      valorBase: dados.valorBase != null ? Number(dados.valorBase) : null,
      multa: Number(dados.multa || 0),
      propinaMensal: dados.propinaMensal != null ? Number(dados.propinaMensal) : null,
      mesesSelecionados: Array.isArray(dados.mesesSelecionados) ? dados.mesesSelecionados : [],
      status: dados.status || 'Pendente',
      tipo: dados.tipo || 'Propina',
      formaPagamento: dados.formaPagamento || 'Dinheiro',
      referencia: dados.referencia || null,
      funcionario: dados.funcionario || null,
      mesReferencia: dados.mesReferencia || null,
    };

    return apiRequest(`/pagamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  eliminar: async (id) => {
    return apiRequest(`/pagamentos/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// API: AUTENTICAÇÃO
// ============================================================
export const authAPI = {
  login: async (email, senha) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
  },

  registar: async (dados) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignorar erro de logout
    }
    localStorage.removeItem('luki_token');
    localStorage.removeItem('luki_user');
  },
};

// ============================================================
// API: ESCOLAS
// ============================================================
export const escolasAPI = {
  listar: async () => {
    return apiRequest('/escolas');
  },

  buscar: async (id) => {
    return apiRequest(`/escolas/${id}`);
  },

  criar: async (dados) => {
    return apiRequest('/escolas', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  atualizar: async (id, dados) => {
    return apiRequest(`/escolas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  },

  eliminar: async (id) => {
    return apiRequest(`/escolas/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
export const classesAPI = {
  listar: async (anoLectivo) => {
    const query = anoLectivo ? `?anoLectivo=${encodeURIComponent(anoLectivo)}` : '';
    return apiRequest(`/classes${query}`);
  },

  criar: async (dados) => {
    return apiRequest('/classes', {
      method: 'POST',
      body: JSON.stringify({ nome: dados.nome, anoLectivo: dados.anoLectivo }),
    });
  },

  atualizar: async (id, dados) => {
    return apiRequest(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nome: dados.nome, anoLectivo: dados.anoLectivo }),
    });
  },

  eliminar: async (id) => {
    return apiRequest(`/classes/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// API: TURMAS
// ============================================================
export const turmasAPI = {
  listar: async (classeId) => {
    const query = classeId ? `?classeId=${classeId}` : '';
    return apiRequest(`/turmas${query}`);
  },

  buscar: async (id) => {
    return apiRequest(`/turmas/${id}`);
  },

  criar: async (dados) => {
    const payload = {
      nome: dados.nome,
      classeId: dados.classeId,
      turno: dados.turno || 'Manhã',
      sala: dados.sala || null,
      professorResponsavelId: dados.professorResponsavelId || null,
      capacidadeMaxima: Number(dados.capacidadeMaxima) || 30,
    };
    return apiRequest('/turmas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  atualizar: async (id, dados) => {
    const payload = {
      nome: dados.nome,
      turno: dados.turno,
      sala: dados.sala,
      professorResponsavelId: dados.professorResponsavelId || null,
      capacidadeMaxima: dados.capacidadeMaxima ? Number(dados.capacidadeMaxima) : undefined,
    };
    return apiRequest(`/turmas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  eliminar: async (id) => {
    return apiRequest(`/turmas/${id}`, { method: 'DELETE' });
  },

  transferirAluno: async (turmaOrigemId, { alunoId, turmaDestinoId, motivo }) => {
    return apiRequest(`/turmas/${turmaOrigemId}/transferir-aluno`, {
      method: 'POST',
      body: JSON.stringify({ alunoId, turmaDestinoId, motivo }),
    });
  },
};

// ============================================================
// API: COMUNICADOS
// ============================================================
export const comunicadosAPI = {
  listar: async () => {
    return apiRequest('/comunicados');
  },

  criar: async (dados) => {
    return apiRequest('/comunicados', {
      method: 'POST',
      body: JSON.stringify(dados),
    });
  },

  atualizar: async (id, dados) => {
    return apiRequest(`/comunicados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados),
    });
  },

  marcarLido: async (id) => {
    return apiRequest(`/comunicados/${id}/lido`, { method: 'PATCH' });
  },

  eliminar: async (id) => {
    return apiRequest(`/comunicados/${id}`, { method: 'DELETE' });
  },
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
const api = {
  alunos: alunosAPI,
  professores: professoresAPI,
  matriculas: matriculasAPI,
  pagamentos: pagamentosAPI,
  classes: classesAPI,
  turmas: turmasAPI,
  comunicados: comunicadosAPI,
  confirmacoes: confirmacoesAPI,
  auth: authAPI,
  escolas: escolasAPI,
  formatarDataParaBackend,
  formatarDataDoBackend,
};

export default api;