import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "./Login.css";
import logo from "../assets/LUKI B.png";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setAEnviar(true);

    const resultado = await login(email, senha);

    setAEnviar(false);
    if (resultado.success) {
      navigate('/');
    } else {
      setErro(resultado.message || 'Não foi possível entrar. Verifica o email e a senha.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#1a1a1a', color: '#e8e8e8', fontFamily: 'Inter, sans-serif',
    }}>

      <form onSubmit={handleSubmit} style={{
        background: '#222', padding: '2rem', borderRadius: '1.2rem', width: '100%', maxWidth: 390,
        border: '1px solid #3b3b3b', display: 'flex', flexDirection: 'column', gap: '1rem',
      }}>

        <div className="login-header" style={{marginTop:'-15px'}}>
          <div className="login-logo">
            <img src={logo} alt="LUKI Logo" className="logo-image" />
          </div>
          <p>Gestão Escolar Integrada</p>
        </div>

        <h2 style={{ marginBottom: '0.4rem', fontWeight:'bold' , fontSize:'23px' }}>Entrar</h2>

        {erro && (
          <div style={{ background: '#3a2a2a', color: '#d08080', padding: '0.6rem 1rem', borderRadius: '0.6rem', fontSize: '0.9rem' }}>
            {erro}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#b0b0b0' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ background: '#2a2a2a', border: '1px solid #3b3b3b', borderRadius: '0.6rem', padding: '0.6rem 0.8rem', color: '#e8e8e8' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#b0b0b0' }}>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={{ background: '#2a2a2a', border: '1px solid #3b3b3b', borderRadius: '0.6rem', padding: '0.6rem 0.8rem', color: '#e8e8e8' }}
          />
        </div>

        <button
          type="submit"
          disabled={aEnviar}
          style={{
            background: '#2c5a2c', color: '#f0f0f0', border: '1px solid #3a6a3a',
            padding: '0.7rem', borderRadius: '0.6rem', cursor: 'pointer', fontWeight: 500,
          }}
        >
          {aEnviar ? 'A entrar...' : 'Entrar'}
        </button>

        <div className="login-footer">
          <p>© 2026 LUKI - Sistema de Gestão Escolar</p>
          <p className="version">Versão 1.0.0</p>
        </div>

      </form>
    </div>
  );
};

export default Login;
