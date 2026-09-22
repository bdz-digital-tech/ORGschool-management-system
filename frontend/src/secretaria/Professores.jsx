import React, { useState } from "react";
import "./Professores.css";
import {
  FaSearch,
  FaPlus,
  FaSave,
  FaTimes,
  FaPhone,
  FaEnvelope,
  FaBook,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaArrowLeft,
  FaChevronRight,
  FaChevronLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle as FaInfo,
} from "react-icons/fa";
import { useSchool } from "../context/SchoolContext";

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

const Professores = () => {
  // Usando o contexto para acessar os dados dos professores
  const {
    professores,
    adicionarProfessor,
    atualizarProfessor,
    eliminarProfessor,
    classes: classesContexto,
  } = useSchool();
  const [aEnviar, setAEnviar] = useState(false);

  // Estados para controle de UI
  const [viewMode, setViewMode] = useState("lista");
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [busca, setBusca] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [step, setStep] = useState(0);

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

  // Estado para o formulário
  const [formData, setFormData] = useState({
    nome: "",
    sexo: "",
    dataNascimento: "",
    contacto: "",
    email: "",
    endereco: "",
    especialidade: [],
    classes: [],
    turmas: [],
    disciplinas: [],
    estado: "Ativo",
    dataContratacao: "",
    formacao: "",
  });

  // Dados mockados para selects
  const sexos = ["Masculino", "Feminino"];
  const estados = ["Ativo", "Inativo", "Licença", "Afastado"];
  const especialidades = [
    "Coordenador de Turma",
    "Coordenador de Turno",
    "Professor",
  ];

  // Disciplinas do Ensino Primário
  const disciplinasPrimario = [
    "L. Portuguesa",
    "Matemática",
    "Ciência da Natureza",
    "História",
    "Estudo do Meio",
    "Educação Manual e Plástica",
    "Expressão Motora",
    "Educação Moral e Cívica",
  ];

  // Disciplinas do Ensino Geral
  const disciplinasGeral = [
    "L. Portuguesa",
    "Matemática",
    "História",
    "Geografia",
    "Biologia",
    "Física",
    "Química",
    "Inglês",
    "Francês",
    "Empreendedorismo",
    "Educação Laboral",
    "Educação Moral e Cívica",
    "Educação Visual e Plástica",
    "Educação Física",
  ];

  const CLASSES_LISTA_FALLBACK = [
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
  const TURMAS_LISTA_FALLBACK = ["A", "B", "C"];

  const classesLista = classesContexto && classesContexto.length > 0
    ? classesContexto.map((c) => c.nome)
    : CLASSES_LISTA_FALLBACK;
  const turmasLista = classesContexto && classesContexto.length > 0
    ? [...new Set(classesContexto.flatMap((c) => (c.turmas || []).map((t) => t.nome)))]
    : TURMAS_LISTA_FALLBACK;

  // Nomes dos passos
  const stepNames = [
    "Dados Pessoais",
    "Contactos",
    "Especialidade",
    "Classe",
    "Disciplinas",
    "Resumo",
  ];

  // Funções de navegação
  const handleViewProfessor = (professor) => {
    setSelectedProfessor(professor);
    setViewMode("perfil");
    setEditMode(false);
  };

  const handleAddProfessor = () => {
    setFormData({
      nome: "",
      sexo: "",
      dataNascimento: "",
      contacto: "",
      email: "",
      endereco: "",
      especialidade: [],
      classes: [],
      turmas: [],
      disciplinas: [],
      estado: "Ativo",
      dataContratacao: new Date().toISOString().split("T")[0],
      formacao: "",
    });
    setViewMode("adicionar");
    setStep(0);
    setEditMode(false);
  };

  const handleEditProfessor = (professor) => {
    setFormData({ ...professor });
    setSelectedProfessor(professor);
    setViewMode("adicionar");
    setStep(0);
    setEditMode(true);
  };

  const handleBackToList = () => {
    setViewMode("lista");
    setSelectedProfessor(null);
    setEditMode(false);
    setStep(0);
  };

  // Funções de navegação entre passos
  const handleNextStep = () => {
    if (step === 0) {
      if (
        !formData.nome ||
        !formData.sexo ||
        !formData.dataNascimento ||
        !formData.dataContratacao ||
        !formData.formacao
      ) {
        mostrarAviso(
          "info",
          "Por favor, preencha todos os campos de Dados Pessoais antes de continuar.",
        );
        return;
      }
    } else if (step === 1) {
      if (!formData.contacto || !formData.email) {
        mostrarAviso(
          "info",
          "Por favor, preencha todos os campos de Contactos antes de continuar.",
        );
        return;
      }
    } else if (step === 2) {
      if (formData.especialidade.length === 0) {
        mostrarAviso(
          "info",
          "Por favor, selecione pelo menos uma Especialidade antes de continuar.",
        );
        return;
      }
    } else if (step === 3) {
      if (formData.classes.length === 0 || formData.turmas.length === 0) {
        mostrarAviso(
          "info",
          "Por favor, selecione pelo menos uma Classe e uma Turma antes de continuar.",
        );
        return;
      }
    } else if (step === 4) {
      if (formData.disciplinas.length === 0) {
        mostrarAviso(
          "info",
          "Por favor, selecione pelo menos uma Disciplina antes de continuar.",
        );
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Funções de formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMultiSelect = (field, value) => {
    const current = formData[field] || [];
    if (current.includes(value)) {
      setFormData({
        ...formData,
        [field]: current.filter((item) => item !== value),
      });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAEnviar(true);

    if (editMode) {
      const resultado = await atualizarProfessor(selectedProfessor.id, formData);
      setAEnviar(false);

      if (!resultado.success) {
        mostrarAviso(
          "erro",
          `Não foi possível atualizar o professor: ${resultado.message}`,
        );
        return;
      }

      const updatedProfessor = { ...selectedProfessor, ...formData };
      setSelectedProfessor(updatedProfessor);
      setViewMode("perfil");
      mostrarAviso("sucesso", `Professor ${formData.nome} atualizado com sucesso!`);
    } else {
      const resultado = await adicionarProfessor(formData);
      setAEnviar(false);

      if (!resultado.success) {
        mostrarAviso(
          "erro",
          `Não foi possível criar o professor: ${resultado.message}`,
        );
        return;
      }

      setSelectedProfessor(resultado.data);
      setViewMode("perfil");
      mostrarAviso("sucesso", `Professor ${formData.nome} criado com sucesso!`);
    }
    setEditMode(false);
    setStep(0);
  };

  // ✅ Substituído window.confirm por ConfirmModal
  const handleEliminarProfessor = (professor) => {
    abrirConfirmacao({
      titulo: "Eliminar Professor",
      mensagem: `Tem certeza que deseja eliminar o professor "${professor.nome}"?`,
      textoConfirmar: "Sim, eliminar",
      textoCancelar: "Cancelar",
      onConfirm: async () => {
        const resultado = await eliminarProfessor(professor.id);
        if (!resultado.success) {
          mostrarAviso(
            "erro",
            `Não foi possível eliminar o professor: ${resultado.message}`,
          );
          return;
        }
        if (selectedProfessor && selectedProfessor.id === professor.id) {
          setSelectedProfessor(null);
          setViewMode("lista");
        }
        mostrarAviso("sucesso", `Professor ${professor.nome} eliminado com sucesso!`);
      },
    });
  };

  // Filtrar professores
  const professoresFiltrados = professores.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.especialidade.some((e) =>
        e.toLowerCase().includes(busca.toLowerCase()),
      ) ||
      p.disciplinas.some((d) => d.toLowerCase().includes(busca.toLowerCase())),
  );

  // Renderização condicional
  if (viewMode === "adicionar") {
    return (
      <>
        <div className="professores-container">
          <div className="professores-header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              {editMode ? "Editar Professor" : "Adicionar Novo Professor"}
            </h2>
            <div className="step-indicator">
              {stepNames.map((name, index) => (
                <React.Fragment key={index}>
                  <span className={`step ${step >= index ? "active" : ""}`}>
                    {index + 1}
                  </span>
                  {index < stepNames.length - 1 && (
                    <span className="step-line"></span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmit}>
              {/* PASSO 1: Dados Pessoais */}
              {step === 0 && (
                <div className="form-step">
                  <h3>Dados Pessoais</h3>
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
                      <label>Sexo *</label>
                      <select
                        name="sexo"
                        value={formData.sexo}
                        onChange={handleChange}
                        required
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
                      <label>Data de Nascimento *</label>
                      <input
                        type="date"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Data de Contratação *</label>
                      <input
                        type="date"
                        name="dataContratacao"
                        value={formData.dataContratacao}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                      >
                        {estados.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group full-width">
                      <label>Formação Académica *</label>
                      <input
                        type="text"
                        name="formacao"
                        value={formData.formacao}
                        onChange={handleChange}
                        placeholder="Ex: Licenciatura em Matemática - UAN"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 2: Contactos */}
              {step === 1 && (
                <div className="form-step">
                  <h3>Contactos</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Contacto *</label>
                      <input
                        type="tel"
                        name="contacto"
                        value={formData.contacto}
                        onChange={handleChange}
                        placeholder="+244 900 000 000"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="professor@escola.ao"
                        required
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Endereço</label>
                      <input
                        type="text"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        placeholder="Rua, Bairro, Cidade"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3: Especialidade */}
              {step === 2 && (
                <div className="form-step">
                  <h3>Especialidade</h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Selecione a(s) Especialidade(s) *</label>
                      <div className="multi-select-grid especialidades-grid">
                        {especialidades.map((esp) => (
                          <label
                            key={esp}
                            className="multi-select-item especialidade-item"
                          >
                            <input
                              type="checkbox"
                              checked={(formData.especialidade || []).includes(
                                esp,
                              )}
                              onChange={() =>
                                handleMultiSelect("especialidade", esp)
                              }
                            />
                            <span>{esp}</span>
                          </label>
                        ))}
                      </div>
                      <small className="form-hint">
                        Pode selecionar múltiplas especialidades
                      </small>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 4: Classe */}
              {step === 3 && (
                <div className="form-step">
                  <h3>Classe e Turma</h3>
                  <p className="step-description">
                    Selecione a classe e turma onde o professor irá lecionar.
                  </p>
                  <div className="classes-turmas-grid">
                    <div className="multi-select-group">
                      <h4>Classes *</h4>
                      <div className="multi-select-grid">
                        {classesLista.map((cls) => (
                          <label key={cls} className="multi-select-item">
                            <input
                              type="checkbox"
                              checked={(formData.classes || []).includes(cls)}
                              onChange={() => handleMultiSelect("classes", cls)}
                            />
                            <span>{cls}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="multi-select-group">
                      <h4>Turmas *</h4>
                      <div className="multi-select-grid">
                        {turmasLista.map((turma) => (
                          <label key={turma} className="multi-select-item">
                            <input
                              type="checkbox"
                              checked={(formData.turmas || []).includes(turma)}
                              onChange={() => handleMultiSelect("turmas", turma)}
                            />
                            <span>Turma {turma}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 5: Disciplinas */}
              {step === 4 && (
                <div className="form-step">
                  <h3>Disciplinas</h3>
                  <p className="step-description">
                    Selecione as disciplinas que o professor irá lecionar.
                  </p>

                  <div className="multi-select-container">
                    <div className="disciplinas-group">
                      <h4>Disciplinas do Ensino Primário</h4>
                      <div className="multi-select-grid">
                        {disciplinasPrimario.map((disc) => (
                          <label key={disc} className="multi-select-item">
                            <input
                              type="checkbox"
                              checked={(formData.disciplinas || []).includes(
                                disc,
                              )}
                              onChange={() =>
                                handleMultiSelect("disciplinas", disc)
                              }
                            />
                            <span>{disc}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="disciplinas-group">
                      <h4>Disciplinas do Ensino Geral</h4>
                      <div className="multi-select-grid">
                        {disciplinasGeral.map((disc) => (
                          <label key={disc} className="multi-select-item">
                            <input
                              type="checkbox"
                              checked={(formData.disciplinas || []).includes(
                                disc,
                              )}
                              onChange={() =>
                                handleMultiSelect("disciplinas", disc)
                              }
                            />
                            <span>{disc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 6: Resumo */}
              {step === 5 && (
                <div className="form-step">
                  <h3>Resumo do Professor</h3>
                  <p className="step-description">
                    Revise todos os dados antes de guardar.
                  </p>
                  <div className="resumo-container">
                    <div className="resumo-section">
                      <h4>Dados Pessoais</h4>
                      <div className="resumo-grid">
                        <div className="resumo-item">
                          <span className="resumo-label">Nome:</span>
                          <span className="resumo-value">
                            {formData.nome || "—"}
                          </span>
                        </div>
                        <div className="resumo-item">
                          <span className="resumo-label">Sexo:</span>
                          <span className="resumo-value">
                            {formData.sexo || "—"}
                          </span>
                        </div>
                        <div className="resumo-item">
                          <span className="resumo-label">Data Nascimento:</span>
                          <span className="resumo-value">
                            {formData.dataNascimento
                              ? new Date(
                                  formData.dataNascimento,
                                ).toLocaleDateString("pt-AO")
                              : "—"}
                          </span>
                        </div>
                        <div className="resumo-item">
                          <span className="resumo-label">Data Contratação:</span>
                          <span className="resumo-value">
                            {formData.dataContratacao
                              ? new Date(
                                  formData.dataContratacao,
                                ).toLocaleDateString("pt-AO")
                              : "—"}
                          </span>
                        </div>
                        <div className="resumo-item">
                          <span className="resumo-label">Estado:</span>
                          <span
                            className={`resumo-value estado-badge ${formData.estado?.toLowerCase()}`}
                          >
                            {formData.estado || "—"}
                          </span>
                        </div>
                        <div className="resumo-item">
                          <span className="resumo-label">Formação:</span>
                          <span className="resumo-value">
                            {formData.formacao || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="resumo-section">
                      <h4>Contactos</h4>
                      <div className="resumo-grid">
                        <div className="resumo-item">
                          <span className="resumo-label">Contacto:</span>
                          <span className="resumo-value">
                            {formData.contacto || "—"}
                          </span>
                        </div>
                        <div className="resumo-item">
                          <span className="resumo-label">Email:</span>
                          <span className="resumo-value">
                            {formData.email || "—"}
                          </span>
                        </div>
                        <div className="resumo-item full-width">
                          <span className="resumo-label">Endereço:</span>
                          <span className="resumo-value">
                            {formData.endereco || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="resumo-section">
                      <h4>Especialidade</h4>
                      <div className="resumo-tags">
                        {formData.especialidade &&
                        formData.especialidade.length > 0 ? (
                          formData.especialidade.map((esp, idx) => (
                            <span
                              key={idx}
                              className="resumo-tag especialidade-tag"
                            >
                              {esp}
                            </span>
                          ))
                        ) : (
                          <span className="resumo-value">—</span>
                        )}
                      </div>
                    </div>

                    <div className="resumo-section">
                      <h4>Classes e Turmas</h4>
                      <div className="resumo-grid">
                        <div className="resumo-item">
                          <span className="resumo-label">Classes:</span>
                          <div className="resumo-tags">
                            {formData.classes && formData.classes.length > 0 ? (
                              formData.classes.map((cls, idx) => (
                                <span key={idx} className="resumo-tag classe-tag">
                                  {cls}
                                </span>
                              ))
                            ) : (
                              <span className="resumo-value">—</span>
                            )}
                          </div>
                        </div>
                        <div className="resumo-item">
                          <span className="resumo-label">Turmas:</span>
                          <div className="resumo-tags">
                            {formData.turmas && formData.turmas.length > 0 ? (
                              formData.turmas.map((turma, idx) => (
                                <span key={idx} className="resumo-tag turma-tag">
                                  Turma {turma}
                                </span>
                              ))
                            ) : (
                              <span className="resumo-value">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="resumo-section">
                      <h4>Disciplinas</h4>
                      <div className="resumo-tags">
                        {formData.disciplinas &&
                        formData.disciplinas.length > 0 ? (
                          formData.disciplinas.map((disc, idx) => (
                            <span key={idx} className="resumo-tag disciplina-tag">
                              {disc}
                            </span>
                          ))
                        ) : (
                          <span className="resumo-value">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-actions">
                {step > 0 && (
                  <button
                    type="button"
                    className="btn-prev"
                    onClick={handlePrevStep}
                  >
                    <FaChevronLeft /> Anterior
                  </button>
                )}
                {step < 5 ? (
                  <button
                    type="button"
                    className="btn-next"
                    onClick={handleNextStep}
                  >
                    Seguinte <FaChevronRight />
                  </button>
                ) : (
                  <button type="submit" className="btn-save" disabled={aEnviar}>
                    <FaSave /> {aEnviar ? "A gravar..." : editMode ? "Atualizar" : "Guardar"}
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
        <AvisoModal aviso={aviso} onClose={fecharAviso} />
        <ConfirmModal
          confirmacao={confirmacao}
          onConfirm={confirmar}
          onCancel={fecharConfirmacao}
        />
      </>
    );
  }

  if (viewMode === "perfil" && selectedProfessor) {
    return (
      <>
        <div className="professores-container">
          <div className="professores-header">
            <h2>
              <button className="btn-back" onClick={handleBackToList}>
                <FaArrowLeft />
              </button>
              Perfil do Professor
            </h2>
            <div className="header-actions">
              <button
                className="btn-edit"
                onClick={() => handleEditProfessor(selectedProfessor)}
                style={{padding:'8px 18px', backgroundColor:'#2e2c2c'}}
              >
                Editar
              </button>
              <button
                className="btn-delete"
                onClick={() => handleEliminarProfessor(selectedProfessor)}
                style={{padding:'8px 18px', backgroundColor:'#2e2c2c'}}
              >
                Eliminar
              </button>
            </div>
          </div>

          <div className="perfil-container">
            <div
              className="perfil-header"
              onClick={() => handleViewProfessor(selectedProfessor)}
              style={{ cursor: "pointer" }}
            >
              <div className="perfil-avatar">
                <FaChalkboardTeacher size={60} />
              </div>
              <div className="perfil-info">
                <h3>{selectedProfessor.nome}</h3>
                <div className="perfil-badges">
                  <span
                    className={`estado-badge ${selectedProfessor.estado.toLowerCase()}`}
                  >
                    {selectedProfessor.estado}
                  </span>
                  {selectedProfessor.especialidade &&
                    selectedProfessor.especialidade.map((esp, idx) => (
                      <span key={idx} className="especialidade-badge">
                        {esp}
                      </span>
                    ))}
                </div>
                <div className="perfil-contactos">
                  <span>
                    <FaPhone /> {selectedProfessor.contacto}
                  </span>
                  <span>
                    <FaEnvelope /> {selectedProfessor.email}
                  </span>
                </div>
              </div>
            </div>

            <div className="perfil-content">
              <div className="perfil-sidebar">
                <div className="perfil-card">
                  <h4>Dados Pessoais</h4>
                  <div className="perfil-field">
                    <label>Sexo:</label>
                    <span>{selectedProfessor.sexo}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Data Nascimento:</label>
                    <span>
                      {new Date(
                        selectedProfessor.dataNascimento,
                      ).toLocaleDateString("pt-AO")}
                    </span>
                  </div>
                  <div className="perfil-field">
                    <label>Data Contratação:</label>
                    <span>
                      {new Date(
                        selectedProfessor.dataContratacao,
                      ).toLocaleDateString("pt-AO")}
                    </span>
                  </div>
                  <div className="perfil-field">
                    <label>Formação:</label>
                    <span>{selectedProfessor.formacao}</span>
                  </div>
                </div>

                <div className="perfil-card">
                  <h4>Contactos</h4>
                  <div className="perfil-field">
                    <label>Contacto:</label>
                    <span>{selectedProfessor.contacto}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Email:</label>
                    <span>{selectedProfessor.email}</span>
                  </div>
                  <div className="perfil-field">
                    <label>Endereço:</label>
                    <span>{selectedProfessor.endereco || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="perfil-main">
                <div className="perfil-card">
                  <h3>Especialidades</h3>
                  <div className="tags-container">
                    {selectedProfessor.especialidade &&
                    selectedProfessor.especialidade.length > 0 ? (
                      selectedProfessor.especialidade.map((esp, idx) => (
                        <span key={idx} className="tag-item especialidade-tag">
                          <FaGraduationCap /> {esp}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted">
                        Nenhuma especialidade atribuída
                      </p>
                    )}
                  </div>
                </div>

                <div className="perfil-card">
                  <h3>Classes e Turmas</h3>
                  <div className="classes-turmas-info">
                    <div className="info-group">
                      <h5>Classes</h5>
                      <div className="tags-container">
                        {selectedProfessor.classes &&
                        selectedProfessor.classes.length > 0 ? (
                          selectedProfessor.classes.map((cls, idx) => (
                            <span key={idx} className="tag-item classe-tag">
                              {cls}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted">Nenhuma classe atribuída</p>
                        )}
                      </div>
                    </div>
                    <div className="info-group">
                      <h5>Turmas</h5>
                      <div className="tags-container">
                        {selectedProfessor.turmas &&
                        selectedProfessor.turmas.length > 0 ? (
                          selectedProfessor.turmas.map((turma, idx) => (
                            <span key={idx} className="tag-item turma-tag">
                              Turma {turma}
                            </span>
                          ))
                        ) : (
                          <p className="text-muted">Nenhuma turma atribuída</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="perfil-card">
                  <h3>Disciplinas</h3>
                  <div className="tags-container">
                    {selectedProfessor.disciplinas &&
                    selectedProfessor.disciplinas.length > 0 ? (
                      selectedProfessor.disciplinas.map((disc, idx) => (
                        <span key={idx} className="tag-item disciplina-tag">
                          <FaBook /> {disc}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted">Nenhuma disciplina atribuída</p>
                    )}
                  </div>
                </div>
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

  // View: Lista de Professores
  return (
    <>
      <div className="professores-container">
        <div className="professores-header">
          <h2 style={{fontWeight:'bold', fontSize:'32.5px'}}>
            Gestão de Professores
          </h2>
          <div className="header-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome, especialidade ou disciplina..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <button className="btn-add" onClick={handleAddProfessor}>
              <FaPlus /> Novo Professor
            </button>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            <div className="table-title">
              <span>Lista de Professores</span>
              <span className="count">
                {professoresFiltrados.length} professores
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Especialidade</th>
                  <th>Disciplinas</th>
                  <th>Estado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {professoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-message">
                      Nenhum professor encontrado
                    </td>
                  </tr>
                ) : (
                  professoresFiltrados.map((professor) => (
                    <tr
                      key={professor.id}
                      className="clickable-row"
                      onClick={() => handleViewProfessor(professor)}
                    >
                      <td>
                        <strong>{professor.nome}</strong>
                      </td>
                      <td>
                        <div className="tags-mini">
                          {professor.especialidade &&
                            professor.especialidade.slice(0, 2).map((e, i) => (
                              <span
                                key={i}
                                className="tag-mini especialidade-mini"
                              >
                                {e}
                              </span>
                            ))}
                          {professor.especialidade &&
                            professor.especialidade.length > 2 && (
                              <span className="tag-mini">
                                +{professor.especialidade.length - 2}
                              </span>
                            )}
                        </div>
                      </td>
                      <td>
                        <div className="tags-mini">
                          {professor.disciplinas &&
                            professor.disciplinas.slice(0, 2).map((d, i) => (
                              <span key={i} className="tag-mini">
                                {d}
                              </span>
                            ))}
                          {professor.disciplinas &&
                            professor.disciplinas.length > 2 && (
                              <span className="tag-mini">
                                +{professor.disciplinas.length - 2}
                              </span>
                            )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`estado-badge ${professor.estado.toLowerCase()}`}
                        >
                          {professor.estado}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="btn-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProfessor(professor);
                          }}
                          style={{padding:'8px 13px', backgroundColor:'#151414'}}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminarProfessor(professor);
                          }}
                          style={{padding:'8px 13px', backgroundColor:'#151414'}}
                          >
                          Eliminar
                          
                        </button>
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

export default Professores;