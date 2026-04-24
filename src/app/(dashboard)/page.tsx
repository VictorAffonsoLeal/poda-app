"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  
  const nomeUsuario = userData?.nome ? userData.nome.split(" ")[0] : "Cidadão";

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const efetuarLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error("Erro ao sair", e);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <section id="tela-principal" className="w-full max-w-4xl mx-auto flex flex-col">
        <header className="w-full flex justify-between items-center p-4 bg-white shadow-md rounded-lg mb-6">
            <div>
                <h1 id="saudacao-usuario" className="text-xl font-bold text-slate-700">Olá, {nomeUsuario}!</h1>
                <p className="text-sm text-slate-500">O que você precisa fazer hoje?</p>
            </div>
            <button onClick={efetuarLogout} className="text-sm text-slate-500 hover:text-emerald-600 font-semibold">Sair</button>
        </header>
        <main className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div onClick={() => router.push("/nova-solicitacao")} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow text-center">
                <div className="text-4xl text-emerald-500 mb-3">🌳</div>
                <h2 className="text-lg font-bold text-slate-700">Nova Solicitação</h2>
                <p className="text-sm text-slate-500">Peça uma poda, supressão ou fiscalização de um serviço.</p>
            </div>
            <div onClick={() => router.push("/solicitacoes")} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow text-center">
                <div className="text-4xl text-emerald-500 mb-3">📋</div>
                <h2 className="text-lg font-bold text-slate-700">Minhas Solicitações</h2>
                <p className="text-sm text-slate-500">Acompanhe o andamento dos seus pedidos.</p>
            </div>
            <div onClick={() => router.push("/prestadores")} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow text-center">
                <div className="text-4xl text-emerald-500 mb-3">👷‍♂️</div>
                <h2 className="text-lg font-bold text-slate-700">Podadores Autorizados</h2>
                <p className="text-sm text-slate-500">Consulte empresas credenciadas pela prefeitura para podas particulares.</p>
            </div>
            <div onClick={() => router.push("/orientacoes")} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow text-center">
                <div className="text-4xl text-blue-500 mb-3">📚</div>
                <h2 className="text-lg font-bold text-slate-700">Manual de Boas Práticas</h2>
                <p className="text-sm text-slate-500">Aprenda as regras da prefeitura e saiba como evitar multas.</p>
            </div>
            <div onClick={() => router.push("/perfil")} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-shadow text-center">
                <div className="text-4xl text-emerald-500 mb-3">👤</div>
                <h2 className="text-lg font-bold text-slate-700">Meus Dados</h2>
                <p className="text-sm text-slate-500">Visualize e edite suas informações pessoais e de endereço.</p>
            </div>
        </main>
    </section>
  );
}
