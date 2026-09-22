import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaSchool,
  FaExclamationTriangle,
  FaUserShield,
} from "react-icons/fa";
import "./Login.css";
import logo from "../assets/LUKI B.png";


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user) {
      // APENAS super_admin vai para o painel admin
      if (user.role === "super_admin") {
        navigate("/admin-panel-luki", { replace: true });
      } else {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    }
  }, [user, navigate, location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email || !formData.senha) {
      setError("Por favor, preencha todos os campos.");
      setLoading(false);
      return;
    }

    const result = await login(formData.email, formData.senha);

    if (result.success) {
      if (result.data.role === "super_admin") {
        navigate("/admin-panel-luki", { replace: true });
      } else {
        // admin_escola, secretaria, professor → sistema normal
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    }
  };

  const preencherDemo = (tipo) => {
    if (tipo === "admin") {
      setFormData({ email: "admin@luki.ao", senha: "admin123" });
    } else if (tipo === "escola") {
      setFormData({ email: "escola@luki.ao", senha: "escola123" });
    } else if (tipo === "secretaria") {
      setFormData({ email: "secretaria@luki.ao", senha: "secre123" });
    }
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-shape login-shape-1"></div>
        <div className="login-shape login-shape-2"></div>
        <div className="login-shape login-shape-3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <img src={logo} alt="LUKI Logo" className="logo-image" />
            </div>
            <p>Gestão Escolar Integrada</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope /> Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu.email@exemplo.ao"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha">
                <FaLock /> Senha
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="senha"
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Digite a sua senha"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <span className="btn-loading">A entrar...</span>
              ) : (
                <>
                  <FaSignInAlt /> Entrar no Sistema
                </>
              )}
            </button>
          </form>

          <div className="login-demo">
            <div className="demo-header">
              <FaUserShield />
              <span>Acesso Rápido (Demo)</span>
            </div>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-btn demo-super"
                onClick={() => preencherDemo("admin")}
              >
                Super Admin
              </button>
              <button
                type="button"
                className="demo-btn demo-escola"
                onClick={() => preencherDemo("escola")}
              >
                Admin Escola
              </button>
              <button
                type="button"
                className="demo-btn demo-secretaria"
                onClick={() => preencherDemo("secretaria")}
              >
                Secretária
              </button>
            </div>
            <p className="demo-info">
              Clique para preencher automaticamente as credenciais
            </p>
          </div>

          <div className="login-footer">
            <p>© 2026 LUKI - Sistema de Gestão Escolar</p>
            <p className="version">Versão 1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
