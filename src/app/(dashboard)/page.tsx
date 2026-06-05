"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect } from "react";
import { 
  Trees, 
  FileText, 
  UserCheck, 
  BookOpen, 
  User, 
  LogOut, 
  Bell, 
  ChevronRight,
  PlusCircle
} from "lucide-react";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-bold text-emerald-800 animate-pulse flex items-center gap-2">
          <span>🌳</span> Carregando Painel...
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Nova Solicitação",
      description: "Peça uma poda, supressão ou fiscalização de um serviço.",
      path: "/nova-solicitacao",
      icon: <span className="text-3xl">🌳</span>,
      bgIcon: "bg-emerald-50 border border-emerald-100/50 shadow-inner",
      accentColor: "hover:border-emerald-250 hover:bg-emerald-50/10"
    },
    {
      title: "Minhas Solicitações",
      description: "Acompanhe o andamento dos seus pedidos.",
      path: "/solicitacoes",
      icon: <span className="text-3xl">📋</span>,
      bgIcon: "bg-blue-50 border border-blue-105 shadow-inner",
      accentColor: "hover:border-blue-200 hover:bg-blue-50/10"
    },
    {
      title: "Podadores Autorizados",
      description: "Consulte empresas credenciadas pela prefeitura para podas particulares.",
      path: "/prestadores",
      icon: <span className="text-3xl">👷‍♂️</span>,
      bgIcon: "bg-amber-50 border border-amber-105 shadow-inner",
      accentColor: "hover:border-amber-200 hover:bg-amber-50/10"
    },
    {
      title: "Legislação e Penalização",
      description: "Aprenda as regras da prefeitura e saiba como evitar multas.",
      path: "/orientacoes",
      icon: <span className="text-3xl">📚</span>,
      bgIcon: "bg-purple-50 border border-purple-105 shadow-inner",
      accentColor: "hover:border-purple-200 hover:bg-purple-50/10"
    },
    {
      title: "Meus Dados",
      description: "Visualize e edite suas informações pessoais e de endereço.",
      path: "/perfil",
      icon: <span className="text-3xl">👤</span>,
      bgIcon: "bg-teal-50 border border-teal-105 shadow-inner",
      accentColor: "hover:border-teal-200 hover:bg-teal-50/10"
    }
  ];

  return (
    <section id="tela-principal" className="w-full max-w-4xl mx-auto flex flex-col animate-fadeIn">
        {/* Modern Welcome Banner */}
        <header className="w-full bg-gradient-to-r from-emerald-800 to-teal-850 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-8 border border-emerald-900/50 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10 text-[180px] pointer-events-none select-none">🌲</div>
            
            <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Portal do Cidadão
                  </span>
                </div>
                <h1 id="saudacao-usuario" className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  Olá, {nomeUsuario}!
                </h1>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                  Bem-vindo ao Poda Digital. O que você precisa fazer hoje?
                </p>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              {/* Notifications Button */}
              <button 
                onClick={() => router.push("/notificacoes")}
                className="flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/10 hover:border-white/20 transition-all shadow-sm cursor-pointer"
                title="Notificações"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Logout Button */}
              <button 
                onClick={efetuarLogout} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-750 text-white text-xs sm:text-sm font-bold transition-all border border-emerald-600/50 shadow-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
        </header>

        {/* Action Grid */}
        <main className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <div 
                key={index}
                onClick={() => router.push(item.path)} 
                className={`bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between ${item.accentColor} group`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 ${item.bgIcon}`}>
                    {item.icon}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-700 mb-1.5 transition-colors group-hover:text-slate-900">
                    {item.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-emerald-700 transition-colors">
                  <span>Acessar</span>
                  <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
        </main>
    </section>
  );
}
