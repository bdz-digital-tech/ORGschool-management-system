import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaArrowLeft, FaHome, FaSignOutAlt } from 'react-icons/fa';
import './NaoAutorizado.css';

const NaoAutorizado = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleVoltar = () => {
    navigate(-1);
  };

  const handleIrParaDashboard = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="nao-autorizado-page">
      <div className="nao-autorizado-card">
        <div className="nao-autorizado-icon">
          <FaLock />
        </div>
        <h1>Acesso Negado</h1>
        <p className="nao-autorizado-message">
          Não tem permissão para aceder a esta página.
        </p>
        {user && (
          <p className="nao-autorizado-user">
            Utilizador: <strong>{user.nome}</strong> ({user.role})
          </p>
        )}
        <div className="nao-autorizado-actions">
          <button className="btn-voltar" onClick={handleVoltar}>
            <FaArrowLeft /> Voltar
          </button>
          <button className="btn-dashboard" onClick={handleIrParaDashboard}>
            <FaHome /> Dashboard
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <FaSignOutAlt /> Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default NaoAutorizado;