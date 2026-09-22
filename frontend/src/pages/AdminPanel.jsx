import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaUsers,
  FaSchool,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPlus,
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaUserShield,
  FaBuilding,
  FaFileInvoiceDollar,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaGlobe,
  FaIdCard,
  FaPalette,
  FaChartLine,
  FaPowerOff,
  FaLock,
  FaDatabase,
  FaShieldAlt,
  FaSignOutAlt,
  FaHome,
  FaHeading,
  FaRedo,
  FaFileSignature,
  FaUniversity,
  FaSync,
  FaUpload,
  FaImage,
} from "react-icons/fa";
import "./AdminPanel.css";
import logo from "../assets/LUKI B.png";




// ✅ Helper local
const normalizarEscolaId = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  const num = Number(valor);
  return Number.isNaN(num) ? null : num;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const {
    user,
    logout,
    users,
    escolas,
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
    CONFIG_RECIBO_PADRAO,
    refresh,
  } = useAuth();

  const [activeTab, setActiveTab] = useState("visao-geral");
  const [viewMode, setViewMode] = useState("lista");
  const [selectedItem, setSelectedItem] = useState(null);
  const [busca, setBusca] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState(null);

  const logoInputRef = useRef(null);

  const [userForm, setUserForm] = useState({
    nome: "",
    email: "",
    senha: "",
    role: "secretaria",
    escolaId: "",
    estado: "Activo",
    telefone: "",
  });

  const [escolaForm, setEscolaForm] = useState({
    nome: "",
    sigla: "",
    nif: "",
    endereco: "",
    cidade: "",
    provincia: "",
    telefone: "",
    email: "",
    website: "",
    plano: "basico",
    estado: "Activo",
  });

  const [reciboForm, setReciboForm] = useState(CONFIG_RECIBO_PADRAO);

  // ✅ Carregar config quando a escola selecionada muda
  useEffect(() => {
    if (escolaSelecionadaId) {
      const escola = escolas.find(
        (e) => Number(e.id) === Number(escolaSelecionadaId),
      );
      if (escola) {
        setReciboForm(
          escola.configRecibo || {
            ...CONFIG_RECIBO_PADRAO,
            nomeInstituicao: escola.nome,
            sigla: escola.sigla || "ESCOLA",
            endereco: escola.endereco || "",
            telefone: escola.telefone || "",
            email: escola.email || "",
            nif: escola.nif || "",
          },
        );
      }
    }
  }, [escolaSelecionadaId, escolas]);

  const roles = [
    { value: "super_admin", label: "Super Administrador" },
    { value: "admin_escola", label: "Administrador de Escola" },
    { value: "secretaria", label: "Secretária" },
    { value: "professor", label: "Professor" },
  ];

  const planos = [
    { value: "basico", label: "Básico" },
    { value: "profissional", label: "Profissional" },
    { value: "premium", label: "Premium" },
  ];

  useEffect(() => {
    if (feedback.message) {
      const timer = setTimeout(
        () => setFeedback({ type: "", message: "" }),
        5000,
      );
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // ==================== SEGURANÇA ====================
  if (user?.role !== "super_admin") {
    return (
      <div className="admin-page-standalone">
        <div className="access-denied-full">
          <FaLock />
          <h2>Acesso Restrito</h2>
          <p>Este painel é exclusivo dos criadores do sistema LUKI.</p>
          <button onClick={() => navigate("/")} className="btn-voltar-sistema">
            <FaHome /> Voltar ao Sistema
          </button>
        </div>
      </div>
    );
  }

  // ==================== ESTATÍSTICAS ====================
  const totalUtilizadores = users.length;
  const totalEscolas = escolas.length;
  const escolasActivas = escolas.filter((e) => e.estado === "Activo").length;
  const escolasInactivas = escolas.filter((e) => e.estado !== "Activo").length;
  const utilizadoresActivos = users.filter((u) => u.estado === "Activo").length;

  const escolasPorPlano = {
    basico: escolas.filter((e) => e.plano === "basico").length,
    profissional: escolas.filter((e) => e.plano === "profissional").length,
    premium: escolas.filter((e) => e.plano === "premium").length,
  };

  // ==================== HANDLERS ====================
  const handleLogout = () => {
    if (window.confirm("Deseja sair do painel?")) {
      logout();
      navigate("/login");
    }
  };

  const handleVoltarSistema = () => navigate("/");

  // --- UTILIZADORES ---
  const handleNovoUser = () => {
    setUserForm({
      nome: "",
      email: "",
      senha: "",
      role: "secretaria",
      escolaId: "",
      estado: "Activo",
      telefone: "",
    });
    setViewMode("novoUser");
    setEditMode(false);
    setShowPassword(false);
  };

  const handleEditUser = (u) => {
    setUserForm({
      nome: u.nome,
      email: u.email,
      senha: "",
      role: u.role,
      escolaId: u.escolaId != null ? String(u.escolaId) : "",
      estado: u.estado,
      telefone: u.telefone || "",
    });
    setSelectedItem(u);
    setViewMode("novoUser");
    setEditMode(true);
    setShowPassword(false);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    if (!userForm.nome || !userForm.email) {
      setFeedback({
        type: "error",
        message: "Preencha todos os campos obrigatórios.",
      });
      return;
    }
    if (!editMode && !userForm.senha) {
      setFeedback({
        type: "error",
        message: "A senha é obrigatória para novos utilizadores.",
      });
      return;
    }
    if (!editMode && userForm.senha.length < 6) {
      setFeedback({
        type: "error",
        message: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    // ✅ Normalizar escolaId
    const escolaIdNormalizado = normalizarEscolaId(userForm.escolaId);

    if (userForm.role !== "super_admin" && !escolaIdNormalizado) {
      setFeedback({
        type: "error",
        message: "Selecione uma escola para este utilizador.",
      });
      return;
    }

    const dadosEnviar = {
      ...userForm,
      escolaId: userForm.role === "super_admin" ? null : escolaIdNormalizado,
    };

    let result;
    if (editMode) {
      const dados = { ...dadosEnviar };
      if (!dados.senha) delete dados.senha;
      result = await actualizarUser(selectedItem.id, dados);
    } else {
      result = await criarUser(dadosEnviar);
    }

    if (result.success) {
      setFeedback({
        type: "success",
        message: editMode
          ? "Utilizador actualizado!"
          : "Utilizador criado! Será encaminhado para o ambiente da sua escola.",
      });
      setViewMode("lista");
      setSelectedItem(null);
    } else {
      setFeedback({ type: "error", message: result.message });
    }
  };

  // ✅ CORRIGIDO: nome correto da função
  const handleEliminarUser = async (u) => {
    if (window.confirm(`Eliminar utilizador "${u.nome}"?`)) {
      const result = await eliminarUser(u.id);
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.success ? "Utilizador eliminado!" : result.message,
      });
    }
  };

  const handleToggleEstadoUser = async (u) => {
    const result = await toggleEstadoUser(u.id);
    setFeedback({
      type: result.success ? "success" : "error",
      message: result.success ? "Estado alterado!" : result.message,
    });
  };

  const handleResetSenha = async (u) => {
    const novaSenha = window.prompt(`Nova senha para "${u.nome}":`);
    if (novaSenha) {
      if (novaSenha.length < 6) {
        setFeedback({
          type: "error",
          message: "A senha deve ter pelo menos 6 caracteres.",
        });
        return;
      }
      const result = await resetarSenha(u.id, novaSenha);
      if (result.success)
        setFeedback({ type: "success", message: "Senha resetada!" });
    }
  };

  // --- ESCOLAS ---
  const handleNovaEscola = () => {
    setEscolaForm({
      nome: "",
      sigla: "",
      nif: "",
      endereco: "",
      cidade: "",
      provincia: "",
      telefone: "",
      email: "",
      website: "",
      plano: "basico",
      estado: "Activo",
    });
    setViewMode("novaEscola");
    setEditMode(false);
  };

  const handleEditEscola = (e) => {
    setEscolaForm({
      nome: e.nome,
      sigla: e.sigla || "",
      nif: e.nif || "",
      endereco: e.endereco || "",
      cidade: e.cidade || "",
      provincia: e.provincia || "",
      telefone: e.telefone || "",
      email: e.email || "",
      website: e.website || "",
      plano: e.plano || "basico",
      estado: e.estado || "Activo",
    });
    setSelectedItem(e);
    setViewMode("novaEscola");
    setEditMode(true);
  };

  const handleSubmitEscola = async (e) => {
    e.preventDefault();
    if (!escolaForm.nome) {
      setFeedback({
        type: "error",
        message: "O nome da escola é obrigatório.",
      });
      return;
    }
    let result;
    if (editMode) {
      result = await actualizarEscola(selectedItem.id, escolaForm);
    } else {
      result = await criarEscola(escolaForm);
    }
    if (result.success) {
      setFeedback({
        type: "success",
        message: editMode
          ? "Escola actualizada!"
          : "Escola criada com ambiente próprio!",
      });
      setViewMode("lista");
      setSelectedItem(null);
    } else {
      setFeedback({ type: "error", message: result.message });
    }
  };

  const handleEliminarEscola = async (e) => {
    if (
      window.confirm(
        `Eliminar escola "${e.nome}"?\n\n⚠️ Certifique-se de que não há utilizadores associados.`,
      )
    ) {
      const result = await eliminarEscola(e.id);
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.success ? "Escola eliminada!" : result.message,
      });
    }
  };

  const handleToggleEstadoEscola = async (escola) => {
    const novoEstado = escola.estado === "Activo" ? "Suspenso" : "Activo";
    const msg =
      novoEstado === "Activo"
        ? `ACTIVAR utilização para "${escola.nome}"?`
        : `SUSPENDER utilização para "${escola.nome}"? Os utilizadores não conseguirão fazer login.`;
    if (window.confirm(msg)) {
      const result = await actualizarEscola(escola.id, { estado: novoEstado });
      if (result.success) {
        setFeedback({
          type: "success",
          message:
            novoEstado === "Activo" ? "Escola activada!" : "Escola suspensa!",
        });
      }
    }
  };

  const handleConfigurarRecibo = (escola) => {
    setEscolaSelecionadaId(Number(escola.id));
    setActiveTab("recibo");
  };

  // --- RECIBO ---
  const handleReciboChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReciboForm({
      ...reciboForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        message: "Por favor, selecione um ficheiro de imagem válido.",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: "A imagem é muito grande. Máximo 2MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReciboForm({
        ...reciboForm,
        logoUrl: event.target.result,
        mostrarLogo: true,
      });
      setFeedback({
        type: "success",
        message: "✅ Logo carregado! Não esqueça de guardar.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    if (window.confirm("Remover o logo da instituição?")) {
      setReciboForm({ ...reciboForm, logoUrl: null });
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSubmitRecibo = async (e) => {
    e.preventDefault();

    if (!escolaSelecionadaId) {
      setFeedback({
        type: "error",
        message: "⚠️ Selecione uma escola antes de guardar.",
      });
      return;
    }

    const result = await actualizarConfigRecibo(
      reciboForm,
      escolaSelecionadaId,
    );

    if (result.success) {
      setFeedback({
        type: "success",
        message: `✅ Configuração guardada para "${obterEscola(escolaSelecionadaId)?.nome}"! Será aplicada apenas aos recibos desta escola.`,
      });
    } else {
      setFeedback({ type: "error", message: result.message });
    }
  };

  const handleResetRecibo = async () => {
    if (!escolaSelecionadaId) return;
    if (
      window.confirm("Restaurar configurações padrão do recibo desta escola?")
    ) {
      const result = await resetarConfigRecibo(escolaSelecionadaId);
      if (result.success) {
        setFeedback({
          type: "success",
          message: "✅ Configurações restauradas!",
        });
        if (logoInputRef.current) logoInputRef.current.value = "";
      }
    }
  };

  const handleAddBanco = () => {
    setReciboForm({
      ...reciboForm,
      bancos: [
        ...(reciboForm.bancos || []),
        { banco: "", conta: "", iban: "", moeda: "Kz" },
      ],
    });
  };

  const handleRemoveBanco = (idx) => {
    setReciboForm({
      ...reciboForm,
      bancos: reciboForm.bancos.filter((_, i) => i !== idx),
    });
  };

  const handleBancoChange = (idx, field, value) => {
    const novosBancos = [...reciboForm.bancos];
    novosBancos[idx] = { ...novosBancos[idx], [field]: value };
    setReciboForm({ ...reciboForm, bancos: novosBancos });
  };

  // --- FILTROS ---
  const usersFiltrados = users.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      u.role.toLowerCase().includes(busca.toLowerCase()),
  );

  const escolasFiltradas = escolas.filter(
    (e) =>
      e.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (e.sigla && e.sigla.toLowerCase().includes(busca.toLowerCase())) ||
      (e.cidade && e.cidade.toLowerCase().includes(busca.toLowerCase())),
  );

  const getRoleLabel = (role) =>
    roles.find((r) => r.value === role)?.label || role;
  const getPlanoLabel = (plano) =>
    planos.find((p) => p.value === plano)?.label || plano;

  const handleBackToList = () => {
    setViewMode("lista");
    setSelectedItem(null);
    setEditMode(false);
  };

  // ==================== RENDER FORMS ====================
  if (viewMode === "novoUser") {
    return (
      <div className="admin-page-standalone">
        <AdminHeader
          title={editMode ? "Editar Utilizador" : "Novo Utilizador"}
          onBack={handleBackToList}
          onLogout={handleLogout}
          onHome={handleVoltarSistema}
        />
        <div className="standalone-content">
          {feedback.message && (
            <div className={`admin-feedback ${feedback.type}`}>
              {feedback.type === "success" ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
          <div className="admin-form-container">
            <div className="admin-info-box">
              <FaUserShield />
              <div>
                <h3>Atribuição de Escola</h3>
                <p>
                  Ao criar um utilizador, associe-o a uma escola. Todos os dados
                  que ele criar (alunos, matrículas, pagamentos) ficarão
                  isolados nessa escola.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmitUser}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    value={userForm.nome}
                    onChange={(e) =>
                      setUserForm({ ...userForm, nome: e.target.value })
                    }
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaEnvelope /> Email *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    placeholder="email@exemplo.ao"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaPhone /> Telefone
                  </label>
                  <input
                    type="tel"
                    value={userForm.telefone}
                    onChange={(e) =>
                      setUserForm({ ...userForm, telefone: e.target.value })
                    }
                    placeholder="+244 900 000 000"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaKey /> {editMode ? "Nova Senha (opcional)" : "Senha *"}
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={userForm.senha}
                      onChange={(e) =>
                        setUserForm({ ...userForm, senha: e.target.value })
                      }
                      placeholder={
                        editMode ? "Nova senha" : "Mínimo 6 caracteres"
                      }
                      required={!editMode}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <FaUserShield /> Perfil *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                {userForm.role !== "super_admin" && (
                  <div className="form-group">
                    <label>
                      <FaSchool /> Escola *
                    </label>
                    <select
                      value={userForm.escolaId}
                      onChange={(e) =>
                        setUserForm({ ...userForm, escolaId: e.target.value })
                      }
                      required
                    >
                      <option value="">-- Selecione a escola --</option>
                      {escolas.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nome}
                        </option>
                      ))}
                    </select>
                    {escolas.length === 0 && (
                      <small style={{ color: "#e74c3c", marginTop: "0.3rem" }}>
                        ⚠️ Crie uma escola primeiro na aba "Escolas Cliente"
                      </small>
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={userForm.estado}
                    onChange={(e) =>
                      setUserForm({ ...userForm, estado: e.target.value })
                    }
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <FaSave /> {editMode ? "Actualizar" : "Criar"}
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
      </div>
    );
  }

  if (viewMode === "novaEscola") {
    return (
      <div className="admin-page-standalone">
        <AdminHeader
          title={editMode ? "Editar Escola" : "Nova Escola"}
          onBack={handleBackToList}
          onLogout={handleLogout}
          onHome={handleVoltarSistema}
        />
        <div className="standalone-content">
          {feedback.message && (
            <div className={`admin-feedback ${feedback.type}`}>
              {feedback.type === "success" ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
          <div className="admin-form-container">
            <div className="admin-info-box">
              <FaShieldAlt />
              <div>
                <h3>Criação de Nova Escola</h3>
                <p>
                  Ao criar uma escola, é criado automaticamente um{" "}
                  <strong>ambiente isolado</strong> com a sua própria
                  configuração de recibo. Depois crie um utilizador para essa
                  escola.
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmitEscola}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>
                    <FaSchool /> Nome da Escola *
                  </label>
                  <input
                    type="text"
                    value={escolaForm.nome}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, nome: e.target.value })
                    }
                    placeholder="Ex: Escola Primária Modelo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sigla</label>
                  <input
                    type="text"
                    value={escolaForm.sigla}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, sigla: e.target.value })
                    }
                    placeholder="Ex: EPM"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaIdCard /> NIF
                  </label>
                  <input
                    type="text"
                    value={escolaForm.nif}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, nif: e.target.value })
                    }
                    placeholder="5001234567"
                  />
                </div>
                <div className="form-group full-width">
                  <label>
                    <FaMapMarkerAlt /> Endereço
                  </label>
                  <input
                    type="text"
                    value={escolaForm.endereco}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, endereco: e.target.value })
                    }
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    value={escolaForm.cidade}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, cidade: e.target.value })
                    }
                    placeholder="Luanda"
                  />
                </div>
                <div className="form-group">
                  <label>Província</label>
                  <input
                    type="text"
                    value={escolaForm.provincia}
                    onChange={(e) =>
                      setEscolaForm({
                        ...escolaForm,
                        provincia: e.target.value,
                      })
                    }
                    placeholder="Luanda"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaPhone /> Telefone
                  </label>
                  <input
                    type="tel"
                    value={escolaForm.telefone}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, telefone: e.target.value })
                    }
                    placeholder="+244 222 333 444"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaEnvelope /> Email
                  </label>
                  <input
                    type="email"
                    value={escolaForm.email}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, email: e.target.value })
                    }
                    placeholder="escola@exemplo.ao"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <FaGlobe /> Website
                  </label>
                  <input
                    type="text"
                    value={escolaForm.website}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, website: e.target.value })
                    }
                    placeholder="www.escola.ao"
                  />
                </div>
                <div className="form-group">
                  <label>Plano</label>
                  <select
                    value={escolaForm.plano}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, plano: e.target.value })
                    }
                  >
                    {planos.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={escolaForm.estado}
                    onChange={(e) =>
                      setEscolaForm({ ...escolaForm, estado: e.target.value })
                    }
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">
                  <FaSave /> {editMode ? "Actualizar" : "Criar Escola"}
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
      </div>
    );
  }

  // ==================== LISTA PRINCIPAL ====================
  return (
    <div className="admin-page-standalone">
      <header className="admin-standalone-header">
        <div className="admin-header-left">
          <div className="logo admin-logo">
            <img src={logo} alt="LUKI Logo" className="logo-image" />
          </div>
          <div className="admin-header-title">
            <h1>Painel de Controlo LUKI</h1>
            <span>Gerenciado - BDZ-DIGITAL TEC</span>
          </div>
        </div>
        <div className="admin-header-right">
          <div className="admin-user-badge">
            <FaUserShield />
            <div>
              <strong>{user?.nome}</strong>
              <span>Super Admin</span>
            </div>
          </div>
          <button
            className="btn-header-action"
            onClick={handleVoltarSistema}
            title="Voltar ao Sistema"
          >
            <FaHome />
          </button>
          <button
            className="btn-header-action btn-header-logout"
            onClick={handleLogout}
            title="Sair"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      <div className="admin-standalone-body">
        {feedback.message && (
          <div className={`admin-feedback ${feedback.type}`}>
            {feedback.type === "success" ? (
              <FaCheckCircle />
            ) : (
              <FaTimesCircle />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "visao-geral" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("visao-geral");
              setBusca("");
            }}
          >
            <FaChartLine /> Visão Geral
          </button>
          <button
            className={`admin-tab ${activeTab === "escolas" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("escolas");
              setBusca("");
            }}
          >
            <FaSchool /> Escolas Cliente{" "}
            <span className="tab-badge">{escolas.length}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === "utilizadores" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("utilizadores");
              setBusca("");
            }}
          >
            <FaUsers /> Utilizadores{" "}
            <span className="tab-badge">{users.length}</span>
          </button>
          <button
            className={`admin-tab ${activeTab === "recibo" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("recibo");
              setBusca("");
            }}
          >
            <FaFileInvoiceDollar /> Configuração de Recibo
          </button>
        </div>

        {/* ==================== TAB: VISÃO GERAL ==================== */}
        {activeTab === "visao-geral" && (
          <div className="admin-content">
            <div className="stats-grid">
              <div className="stat-card-admin">
                <div
                  className="stat-icon"
                  style={{
                    background: "rgba(52, 152, 219, 0.15)",
                    color: "#3498db",
                  }}
                >
                  <FaSchool />
                </div>
                <div className="stat-info">
                  <span className="stat-valor">{totalEscolas}</span>
                  <span className="stat-label">Escolas Cliente</span>
                  <span className="stat-sub">
                    {escolasActivas} activas · {escolasInactivas} inactivas
                  </span>
                </div>
              </div>
              <div className="stat-card-admin">
                <div
                  className="stat-icon"
                  style={{
                    background: "rgba(46, 204, 113, 0.15)",
                    color: "#2ecc71",
                  }}
                >
                  <FaUsers />
                </div>
                <div className="stat-info">
                  <span className="stat-valor">{totalUtilizadores}</span>
                  <span className="stat-label">Utilizadores</span>
                  <span className="stat-sub">
                    {utilizadoresActivos} activos
                  </span>
                </div>
              </div>
              <div className="stat-card-admin">
                <div
                  className="stat-icon"
                  style={{
                    background: "rgba(155, 89, 182, 0.15)",
                    color: "#9b59b6",
                  }}
                >
                  <FaDatabase />
                </div>
                <div className="stat-info">
                  <span className="stat-valor">{escolasPorPlano.premium}</span>
                  <span className="stat-label">Plano Premium</span>
                  <span className="stat-sub">
                    {escolasPorPlano.profissional} profissional
                  </span>
                </div>
              </div>
              <div className="stat-card-admin">
                <div
                  className="stat-icon"
                  style={{
                    background: "rgba(241, 196, 15, 0.15)",
                    color: "#f1c40f",
                  }}
                >
                  <FaCheckCircle />
                </div>
                <div className="stat-info">
                  <span className="stat-valor">
                    {escolasPorPlano.basico +
                      escolasPorPlano.profissional +
                      escolasPorPlano.premium}
                  </span>
                  <span className="stat-label">Total Planos</span>
                  <span className="stat-sub">Distribuição de clientes</span>
                </div>
              </div>
            </div>

            <div className="admin-info-box" style={{ marginTop: "1.5rem" }}>
              <FaShieldAlt />
              <div>
                <h3>🔒 Sistema Multi-Escola com Isolamento Total</h3>
                <p>
                  Cada escola criada tem um{" "}
                  <strong>ambiente completamente isolado</strong>. Os dados de
                  uma escola (alunos, matrículas, pagamentos, recibos){" "}
                  <strong>nunca</strong> se misturam com os de outra.
                </p>
                <p style={{ marginTop: "0.5rem", color: "#3498db" }}>
                  <strong>Como funciona:</strong> Ao criar uma escola, é criada
                  uma configuração de recibo própria. Depois, crie um utilizador
                  (admin_escola) associado a essa escola. Quando ele faz login,
                  vê apenas os dados da sua escola.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: ESCOLAS ==================== */}
        {activeTab === "escolas" && (
          <div className="admin-content">
            <div className="admin-toolbar">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome, sigla ou cidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <button className="btn-add" onClick={handleNovaEscola}>
                <FaPlus /> Nova Escola
              </button>
            </div>

            <div className="escolas-grid">
              {escolasFiltradas.length === 0 ? (
                <div className="empty-state">
                  <FaSchool size={48} />
                  <p>Nenhuma escola registada ainda</p>
                  <button
                    className="btn-add"
                    onClick={handleNovaEscola}
                    style={{ marginTop: "1rem" }}
                  >
                    <FaPlus /> Criar Primeira Escola
                  </button>
                </div>
              ) : (
                escolasFiltradas.map((e) => {
                  const usersDaEscola = users.filter(
                    (u) => normalizarEscolaId(u.escolaId) === Number(e.id),
                  );
                  return (
                    <div
                      key={e.id}
                      className={`escola-card ${e.estado !== "Activo" ? "escola-suspensa" : ""}`}
                    >
                      <div className="escola-card-header">
                        <div className="escola-icon">
                          <FaBuilding />
                        </div>
                        <div className="escola-info">
                          <h3>{e.nome}</h3>
                          <span className="escola-sigla">
                            {e.sigla || "S/S"}
                          </span>
                        </div>
                        <span
                          className={`estado-badge ${e.estado.toLowerCase()}`}
                        >
                          {e.estado}
                        </span>
                      </div>
                      <div className="escola-card-body">
                        {e.endereco && (
                          <p>
                            <FaMapMarkerAlt /> {e.endereco}
                            {e.cidade && `, ${e.cidade}`}
                          </p>
                        )}
                        {e.telefone && (
                          <p>
                            <FaPhone /> {e.telefone}
                          </p>
                        )}
                        {e.email && (
                          <p>
                            <FaEnvelope /> {e.email}
                          </p>
                        )}
                        <p>
                          <FaFileInvoiceDollar /> Plano:{" "}
                          <strong>{getPlanoLabel(e.plano)}</strong>
                        </p>
                        <p>
                          <FaUsers /> <strong>{usersDaEscola.length}</strong>{" "}
                          utilizador(es) associado(s)
                        </p>
                      </div>
                      <div className="escola-card-actions">
                        <button
                          className="btn-edit"
                          onClick={() => handleEditEscola(e)}
                        >
                          <FaEdit /> Editar
                        </button>
                        <button
                          className="btn-recibo"
                          onClick={() => handleConfigurarRecibo(e)}
                        >
                          <FaFileInvoiceDollar /> Recibo
                        </button>
                        <button
                          className={
                            e.estado === "Activo"
                              ? "btn-suspender"
                              : "btn-ativar"
                          }
                          onClick={() => handleToggleEstadoEscola(e)}
                        >
                          <FaPowerOff />{" "}
                          {e.estado === "Activo" ? "Suspender" : "Activar"}
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleEliminarEscola(e)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB: UTILIZADORES ==================== */}
        {activeTab === "utilizadores" && (
          <div className="admin-content">
            <div className="admin-toolbar">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou perfil..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <button className="btn-add" onClick={handleNovoUser}>
                <FaUserPlus /> Novo Utilizador
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th>Escola</th>
                    <th>Estado</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-message">
                        Nenhum utilizador encontrado
                      </td>
                    </tr>
                  ) : (
                    usersFiltrados.map((u) => {
                      const escola =
                        u.escolaId != null
                          ? escolas.find(
                              (e) => Number(e.id) === Number(u.escolaId),
                            )
                          : null;
                      return (
                        <tr key={u.id}>
                          <td>
                            <strong>{u.nome}</strong>
                            {u.id === user?.id && (
                              <span className="self-badge">(você)</span>
                            )}
                          </td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-badge role-${u.role}`}>
                              {getRoleLabel(u.role)}
                            </span>
                          </td>
                          <td>{escola ? escola.nome : "— (Global)"}</td>
                          <td>
                            <span
                              className={`estado-badge ${u.estado.toLowerCase()}`}
                            >
                              {u.estado}
                            </span>
                          </td>
                          <td className="actions">
                            <button
                              className="btn-action btn-view"
                              onClick={() => handleEditUser(u)}
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-action btn-key"
                              onClick={() => handleResetSenha(u)}
                              title="Resetar Senha"
                            >
                              <FaKey />
                            </button>
                            <button
                              className={`btn-action ${u.estado === "Activo" ? "btn-disable" : "btn-enable"}`}
                              onClick={() => handleToggleEstadoUser(u)}
                              disabled={u.id === user?.id}
                            >
                              {u.estado === "Activo" ? (
                                <FaTimesCircle />
                              ) : (
                                <FaCheckCircle />
                              )}
                            </button>
                            {/* ✅ CORRIGIDO: nome correto */}
                            <button
                              className="btn-action btn-delete"
                              onClick={() => handleEliminarUser(u)}
                              disabled={u.id === user?.id}
                              title="Eliminar"
                            >
                              <FaTrash />
                            </button>
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

        {/* ==================== TAB: RECIBO ==================== */}
        {activeTab === "recibo" && (
          <div className="admin-content">
            <div className="admin-info-box">
              <FaFileInvoiceDollar />
              <div style={{ flex: 1 }}>
                <h3>Configuração de Recibo por Escola</h3>
                <p>
                  Selecione uma escola abaixo para configurar o recibo dela.
                  Cada escola tem a sua própria configuração (nome, logo, cores,
                  etc.).
                </p>
              </div>
            </div>

            <div className="escola-selector">
              <label>🏫 Selecionar Escola:</label>
              <select
                value={escolaSelecionadaId || ""}
                onChange={(e) =>
                  setEscolaSelecionadaId(Number(e.target.value) || null)
                }
              >
                <option value="">-- Selecione uma escola --</option>
                {escolas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome} {e.sigla ? `(${e.sigla})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {!escolaSelecionadaId ? (
              <div
                className="empty-state"
                style={{
                  padding: "3rem",
                  background: "#131813",
                  borderRadius: "14px",
                  border: "1px dashed #2ecc71",
                }}
              >
                <FaSchool
                  size={64}
                  style={{ color: "#2ecc71", opacity: 0.5 }}
                />
                <h3 style={{ color: "#fff", marginTop: "1rem" }}>
                  Selecione uma Escola
                </h3>
                <p style={{ color: "#b0b0b0" }}>
                  Escolha uma escola acima para configurar o recibo dela.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmitRecibo}
                className="recibo-config-form"
              >
                {/* LOGO */}
                <div className="config-section">
                  <h3 className="config-section-title">
                    <FaImage /> Logo da Instituição
                  </h3>
                  <div className="logo-upload-area">
                    <div className="logo-preview-box">
                      {reciboForm.logoUrl ? (
                        <img
                          src={reciboForm.logoUrl}
                          alt="Logo"
                          className="logo-preview-img"
                        />
                      ) : (
                        <div className="logo-placeholder">
                          <FaImage />
                          <span>Sem logo</span>
                        </div>
                      )}
                    </div>
                    <div className="logo-upload-controls">
                      <p className="logo-info-text">
                        Carregue o logotipo da instituição (PNG, JPG, SVG).
                        <br />
                        <strong>Tamanho máx:</strong> 2MB.
                      </p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        style={{ display: "none" }}
                        id="logo-upload"
                      />
                      <div className="logo-buttons">
                        <label htmlFor="logo-upload" className="btn-upload">
                          <FaUpload />{" "}
                          {reciboForm.logoUrl
                            ? "Substituir Logo"
                            : "Carregar Logo"}
                        </label>
                        {reciboForm.logoUrl && (
                          <button
                            type="button"
                            className="btn-remove-logo"
                            onClick={handleRemoveLogo}
                          >
                            <FaTrash /> Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="form-group full-width"
                    style={{ marginTop: "1rem" }}
                  >
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="mostrarLogo"
                        checked={reciboForm.mostrarLogo !== false}
                        onChange={handleReciboChange}
                      />
                      Mostrar logo no cabeçalho do recibo
                    </label>
                  </div>
                </div>

                {/* CABEÇALHO */}
                <div className="config-section">
                  <h3 className="config-section-title">
                    <FaHeading /> Cabeçalho do Recibo
                  </h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Nome da Instituição *</label>
                      <input
                        type="text"
                        name="nomeInstituicao"
                        value={reciboForm.nomeInstituicao || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Subtítulo da Instituição</label>
                      <input
                        type="text"
                        name="subtituloInstituicao"
                        value={reciboForm.subtituloInstituicao || ""}
                        onChange={handleReciboChange}
                        placeholder="GESTÃO ESCOLAR INTEGRADA"
                      />
                    </div>
                    <div className="form-group">
                      <label>Sigla</label>
                      <input
                        type="text"
                        name="sigla"
                        value={reciboForm.sigla || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>NIF</label>
                      <input
                        type="text"
                        name="nif"
                        value={reciboForm.nif || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Endereço</label>
                      <input
                        type="text"
                        name="endereco"
                        value={reciboForm.endereco || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Telefone</label>
                      <input
                        type="text"
                        name="telefone"
                        value={reciboForm.telefone || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Segundo Telefone</label>
                      <input
                        type="text"
                        name="telefone2"
                        value={reciboForm.telefone2 || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="text"
                        name="email"
                        value={reciboForm.email || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Website</label>
                      <input
                        type="text"
                        name="website"
                        value={reciboForm.website || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                  </div>
                </div>

                {/* TEXTOS */}
                <div className="config-section">
                  <h3 className="config-section-title">
                    <FaFileSignature /> Textos do Recibo
                  </h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Título Principal</label>
                      <input
                        type="text"
                        name="tituloPrincipal"
                        value={reciboForm.tituloPrincipal || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subtítulo - Propina</label>
                      <input
                        type="text"
                        name="subtituloPropina"
                        value={reciboForm.subtituloPropina || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subtítulo - Matrícula</label>
                      <input
                        type="text"
                        name="subtituloMatricula"
                        value={reciboForm.subtituloMatricula || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subtítulo - Confirmação</label>
                      <input
                        type="text"
                        name="subtituloConfirmacao"
                        value={reciboForm.subtituloConfirmacao || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Subtítulo - Outros Pagamentos</label>
                      <input
                        type="text"
                        name="subtituloPagamento"
                        value={reciboForm.subtituloPagamento || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Texto da 1ª Via</label>
                      <input
                        type="text"
                        name="textoViaOriginal"
                        value={reciboForm.textoViaOriginal || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Texto da 2ª Via</label>
                      <input
                        type="text"
                        name="textoViaCopia"
                        value={reciboForm.textoViaCopia || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Cargo do Responsável</label>
                      <input
                        type="text"
                        name="cargoResponsavel"
                        value={reciboForm.cargoResponsavel || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Nome do Responsável</label>
                      <input
                        type="text"
                        name="nomeResponsavel"
                        value={reciboForm.nomeResponsavel || ""}
                        onChange={handleReciboChange}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Rodapé do Recibo</label>
                      <textarea
                        name="rodapeRecibo"
                        value={reciboForm.rodapeRecibo || ""}
                        onChange={handleReciboChange}
                        rows="2"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Texto Legal</label>
                      <textarea
                        name="textoLegal"
                        value={reciboForm.textoLegal || ""}
                        onChange={handleReciboChange}
                        rows="2"
                      />
                    </div>
                  </div>
                </div>

                {/* CORES */}
                <div className="config-section">
                  <h3 className="config-section-title">
                    <FaPalette /> Cores do Recibo
                  </h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Cor Primária</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          name="corPrimaria"
                          value={reciboForm.corPrimaria || "#1a3a1a"}
                          onChange={handleReciboChange}
                        />
                        <input
                          type="text"
                          name="corPrimaria"
                          value={reciboForm.corPrimaria || ""}
                          onChange={handleReciboChange}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Cor Secundária</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          name="corSecundaria"
                          value={reciboForm.corSecundaria || "#2a5a2a"}
                          onChange={handleReciboChange}
                        />
                        <input
                          type="text"
                          name="corSecundaria"
                          value={reciboForm.corSecundaria || ""}
                          onChange={handleReciboChange}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Cor do Texto</label>
                      <div className="color-input-wrapper">
                        <input
                          type="color"
                          name="corTexto"
                          value={reciboForm.corTexto || "#ffffff"}
                          onChange={handleReciboChange}
                        />
                        <input
                          type="text"
                          name="corTexto"
                          value={reciboForm.corTexto || ""}
                          onChange={handleReciboChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BANCOS */}
                <div className="config-section">
                  <h3 className="config-section-title">
                    <FaUniversity /> Coordenadas Bancárias
                  </h3>
                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="mostrarBancos"
                        checked={reciboForm.mostrarBancos || false}
                        onChange={handleReciboChange}
                      />
                      Mostrar coordenadas bancárias no recibo
                    </label>
                  </div>

                  {reciboForm.mostrarBancos && (
                    <div className="bancos-list">
                      {(reciboForm.bancos || []).map((b, idx) => (
                        <div key={idx} className="banco-item">
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Banco</label>
                              <input
                                type="text"
                                value={b.banco}
                                onChange={(e) =>
                                  handleBancoChange(
                                    idx,
                                    "banco",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Conta</label>
                              <input
                                type="text"
                                value={b.conta}
                                onChange={(e) =>
                                  handleBancoChange(
                                    idx,
                                    "conta",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                            <div className="form-group full-width">
                              <label>IBAN</label>
                              <input
                                type="text"
                                value={b.iban}
                                onChange={(e) =>
                                  handleBancoChange(idx, "iban", e.target.value)
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Moeda</label>
                              <input
                                type="text"
                                value={b.moeda}
                                onChange={(e) =>
                                  handleBancoChange(
                                    idx,
                                    "moeda",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-remove-banco"
                            onClick={() => handleRemoveBanco(idx)}
                          >
                            <FaTrash /> Remover
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-add-banco"
                        onClick={handleAddBanco}
                      >
                        <FaPlus /> Adicionar Banco
                      </button>
                    </div>
                  )}
                </div>

                {/* PREVIEW */}
                <div className="config-section">
                  <h3 className="config-section-title">
                    <FaEye /> Pré-visualização
                  </h3>
                  <div
                    className="recibo-preview-live"
                    style={{ borderTop: `6px solid ${reciboForm.corPrimaria}` }}
                  >
                    <div
                      className="preview-header"
                      style={{
                        background: reciboForm.corPrimaria,
                        color: reciboForm.corTexto,
                      }}
                    >
                      <div className="preview-logo">
                        {reciboForm.mostrarLogo !== false &&
                        reciboForm.logoUrl ? (
                          <img
                            src={reciboForm.logoUrl}
                            alt="Logo"
                            className="preview-logo-img"
                          />
                        ) : reciboForm.mostrarLogo !== false ? (
                          <div className="preview-logo-circle">
                            {reciboForm.sigla || "LUKI"}
                          </div>
                        ) : null}
                        <div className="preview-inst-info">
                          <h2>{reciboForm.nomeInstituicao}</h2>
                          {reciboForm.subtituloInstituicao && (
                            <p style={{ fontSize: "0.75rem", opacity: 0.9 }}>
                              {reciboForm.subtituloInstituicao}
                            </p>
                          )}
                          <p>{reciboForm.endereco}</p>
                          <p>
                            {reciboForm.telefone} | {reciboForm.email}
                          </p>
                        </div>
                      </div>
                      <div className="preview-titulo">
                        <h3>{reciboForm.tituloPrincipal}</h3>
                        <p>{reciboForm.subtituloPagamento}</p>
                      </div>
                    </div>
                    <div className="preview-body">
                      <div className="preview-vias">
                        <div
                          className="preview-via"
                          style={{ borderColor: reciboForm.corSecundaria }}
                        >
                          <strong>{reciboForm.textoViaCopia}</strong>
                        </div>
                        <div
                          className="preview-via"
                          style={{ borderColor: reciboForm.corSecundaria }}
                        >
                          <strong>{reciboForm.textoViaOriginal}</strong>
                        </div>
                      </div>
                      <p className="preview-rodape">
                        {reciboForm.rodapeRecibo}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    <FaSave /> Guardar Configurações desta Escola
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={handleResetRecibo}
                  >
                    <FaRedo /> Restaurar Padrão
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== HEADER COMPONENT ====================
const AdminHeader = ({ title, onBack, onLogout, onHome }) => (
  <header className="admin-standalone-header">
    <div className="admin-header-left">
      <button className="btn-header-action" onClick={onBack}>
        <FaArrowLeft />
      </button>
      <div className="admin-header-title">
        <h1>{title}</h1>
      </div>
    </div>
    <div className="admin-header-right">
      <button className="btn-header-action" onClick={onHome} title="Sistema">
        <FaHome />
      </button>
      <button
        className="btn-header-action btn-header-logout"
        onClick={onLogout}
        title="Sair"
      >
        <FaSignOutAlt />
      </button>
    </div>
  </header>
);

export default AdminPanel;
