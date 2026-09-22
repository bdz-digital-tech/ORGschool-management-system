import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./secretaria/Dashboard";
import Alunos from "./secretaria/Alunos";
import Professores from "./secretaria/Professores";
import Matriculas from "./secretaria/Matriculas";
import Pagamentos from "./secretaria/Pagamentos";
import ClassesTurmas from "./secretaria/ClassesTurmas";
import AnoLectivo from "./secretaria/AnoLectivo";
import Comunicados from "./secretaria/Comunicados";
import Consultas from "./secretaria/Consultas";
import Relatorios from "./secretaria/Relatorios";
import Login from "./pages/Login";
import NaoAutorizado from "./pages/NaoAutorizado";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from "./components/ProtectedRoute";
import { SchoolProvider } from "./context/SchoolContext";
import { AuthProvider } from "./context/AuthContext";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <Routes>
          {/* ==================== ROTAS PÚBLICAS ==================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/nao-autorizado" element={<NaoAutorizado />} />

          {/* ==================== PAINEL ADMIN (PÁGINA INDEPENDENTE) ==================== */}
          {/* Acessível apenas via URL direto: /admin-panel-luki */}
          {/* Não tem sidebar do sistema, é uma página completa e autónoma */}
          <Route
            path="/admin-panel-luki"
            element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* ==================== SISTEMA PRINCIPAL ==================== */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          >
            <Route path="alunos" element={<Alunos />} />
            <Route path="professores" element={<Professores />} />
            <Route path="matriculas" element={<Matriculas />} />
            <Route path="pagamentos" element={<Pagamentos />} />
            <Route path="classes-turmas" element={<ClassesTurmas />} />
            <Route path="ano-lectivo" element={<AnoLectivo />} />
            <Route path="comunicados" element={<Comunicados />} />
            <Route path="consultas" element={<Consultas />} />
            <Route path="relatorios" element={<Relatorios />} />
          </Route>

          {/* ==================== FALLBACK ==================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SchoolProvider>
    </AuthProvider>
  );
}

export default App;