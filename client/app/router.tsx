import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../components/shell/AppShell";
import { RequireAuth } from "../components/RequireAuth";
import { Dashboard } from "../pages/Dashboard";
import { Transacoes } from "../pages/Transacoes";
import { Contas } from "../pages/Contas";
import { Categorias } from "../pages/Categorias";
import { FormasPagamento } from "../pages/FormasPagamento";
import { Metas } from "../features/goals/MetasPage";
import { Investimentos } from "../features/investments/InvestimentosPage";
import { Relatorios } from "../features/reports/RelatoriosPage";
import { Configuracoes } from "../features/settings/ConfiguracoesPage";
import { Fechamento } from "../features/periods/FechamentoPage";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "transacoes", element: <Transacoes /> },
      { path: "contas", element: <Contas /> },
      { path: "categorias", element: <Categorias /> },
      { path: "formas-pagamento", element: <FormasPagamento /> },
      { path: "metas", element: <Metas /> },
      { path: "investimentos", element: <Investimentos /> },
      { path: "relatorios", element: <Relatorios /> },
      { path: "fechamento", element: <Fechamento /> },
      { path: "config", element: <Configuracoes /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
