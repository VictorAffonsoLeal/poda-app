"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { 
  Trees, 
  FileText, 
  UserCheck, 
  BookOpen, 
  User, 
  LogOut, 
  Bell, 
  ChevronRight,
  PlusCircle,
  X
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  
  const nomeUsuario = userData?.nome ? userData.nome.split(" ")[0] : "Cidadão";

  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("dismissedTutorial") === "true";
      setShowTutorial(!dismissed);
    }
  }, []);

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("dismissedTutorial", "true");
  };

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
      title: "Denúncia",
      description: "Relate podas irregulares, corte indevido ou árvores em situação de risco.",
      path: "/denuncia",
      icon: <span className="text-3xl">🚨</span>,
      bgIcon: "bg-rose-50 border border-rose-100/50 shadow-inner",
      accentColor: "hover:border-rose-250 hover:bg-rose-50/10"
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
    },
    {
      title: "Como Funciona?",
      description: "Guia passo a passo detalhando todas as funções e etapas do aplicativo.",
      path: "/como-funciona",
      icon: <span className="text-3xl">💡</span>,
      bgIcon: "bg-cyan-50 border border-cyan-105 shadow-inner",
      accentColor: "hover:border-cyan-200 hover:bg-cyan-50/10"
    },
    {
      title: "Feedbacks e Sugestões",
      description: "Envie críticas, sugestões, elogios ou relate falhas no portal.",
      path: "/feedback",
      icon: <span className="text-3xl">💬</span>,
      bgIcon: "bg-orange-50 border border-orange-105 shadow-inner",
      accentColor: "hover:border-orange-200 hover:bg-orange-50/10"
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
              {!showTutorial && (
                <button 
                  onClick={() => {
                    setShowTutorial(true);
                    localStorage.setItem("dismissedTutorial", "false");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold transition-all border border-white/10 hover:border-white/20 cursor-pointer"
                  title="Como funciona o aplicativo"
                >
                  <BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">Como Funciona?</span>
                </button>
              )}

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

        {showTutorial && (
          <div className="w-full bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm mb-8 relative overflow-hidden transition-all duration-300 hover:shadow-md animate-fadeIn">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100/50">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                    Como funciona o Poda Digital?
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">Siga o passo a passo para solicitar serviços ou fazer denúncias com segurança.</p>
                </div>
              </div>
              <button 
                onClick={handleDismissTutorial}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-450 hover:text-slate-750 transition-all cursor-pointer"
                title="Fechar tutorial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps Container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              
              {/* Step 1 */}
              <div className="flex gap-3 relative z-10 group">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black text-xs flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                    1
                  </span>
                  <div className="w-0.5 h-full bg-slate-100 hidden sm:block sm:h-12 mt-2"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors">1. Pedir ou Denunciar</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Use <strong>"Nova Solicitação"</strong> para poda/supressão particular, ou <strong>"Denúncia"</strong> para infrações ambientais.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3 relative z-10 group">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black text-xs flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                    2
                  </span>
                  <div className="w-0.5 h-full bg-slate-100 hidden sm:block sm:h-12 mt-2"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors">2. Vistoria Técnica</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Um engenheiro da prefeitura irá ao local avaliar a árvore e emitirá o Laudo de Autorização ou Recusa.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3 relative z-10 group">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black text-xs flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                    3
                  </span>
                  <div className="w-0.5 h-full bg-slate-100 hidden sm:block sm:h-12 mt-2"></div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors">3. Executar o Serviço</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Se autorizado, contrate um profissional credenciado em <strong>"Podadores Autorizados"</strong> para realizar o serviço com segurança.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3 relative z-10 group">
                <div className="flex flex-col items-center shrink-0">
                  <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black text-xs flex items-center justify-center shadow-inner group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-200">
                    4
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-700 group-hover:text-slate-900 transition-colors">4. Comprovar e Finalizar</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Envie fotos do serviço feito acessando o chamado em <strong>"Minhas Solicitações"</strong> para homologar e evitar multas.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

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
