"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  ClipboardList, 
  Plus
} from "lucide-react";

export default function ListaSolicitacoesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [filtro, setFiltro] = useState('Todos');
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const resultsMap = new Map<string, any>();

    const emitMerged = () => {
      const merged = Array.from(resultsMap.values()).sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setSolicitacoes(merged);
      setLoading(false);
    };

    const q1 = query(
      collection(db, "solicitacoes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const q2 = query(
      collection(db, "solicitacoes"),
      where("solicitantesAdicionais", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub1 = onSnapshot(q1, (snap) => {
      snap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      emitMerged();
    }, (error) => {
      console.error("Erro ao buscar solicitações (q1): ", error);
      setLoading(false);
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      snap.forEach(doc => resultsMap.set(doc.id, { id: doc.id, ...doc.data() }));
      emitMerged();
    }, (error) => {
      console.warn("Aviso ao buscar solicitações adicionais (q2): ", error);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  const solicitacoesFiltradas = filtro === 'Todos' 
    ? solicitacoes 
    : solicitacoes.filter(s => s.status === filtro);

  const getFilterButtonClass = (status: string) => {
    return filtro === status
      ? "px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 border border-emerald-600 rounded-xl shadow-sm transform scale-[1.02] transition-all cursor-pointer"
      : "px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer";
  };

  return (
    <section id="tela-lista-solicitacoes" className="w-full max-w-4xl mx-auto flex flex-col animate-fadeIn">
        <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => router.push("/")} 
                  className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-200/50 rounded-lg flex items-center justify-center mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Minhas Solicitações</h1>
                  <p className="text-[10px] sm:text-xs text-slate-500">Histórico de solicitações de poda registradas na prefeitura</p>
                </div>
            </div>
            
            <button 
              onClick={() => router.push("/nova-solicitacao")}
              className="bg-emerald-600 text-white py-2.5 px-4 rounded-xl hover:bg-emerald-700 active:bg-emerald-800 transition-all font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm self-start sm:self-center cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" /> Nova Solicitação
            </button>
        </header>

        {/* Tab Filters */}
        <div id="filtros-container" className="w-full flex flex-wrap gap-2 justify-start mb-6">
            <button onClick={() => setFiltro('Todos')} className={getFilterButtonClass('Todos')}>Todos</button>
            <button onClick={() => setFiltro('Em Análise')} className={getFilterButtonClass('Em Análise')}>Em Análise</button>
            <button onClick={() => setFiltro('Aprovado')} className={getFilterButtonClass('Aprovado')}>Aprovados</button>
            <button onClick={() => setFiltro('Recusado')} className={getFilterButtonClass('Recusado')}>Recusados</button>
        </div>

        {/* List Body */}
        <main id="container-solicitacoes" className="w-full bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-200/60 space-y-4">
            {loading ? (
                <div className="py-12 text-center text-slate-500 text-sm font-semibold animate-pulse">
                  Carregando solicitações...
                </div>
            ) : solicitacoesFiltradas.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-slate-700 text-sm sm:text-base">Nenhum chamado encontrado</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Nenhuma solicitação de poda registrada corresponde a este filtro no momento.
                  </p>
                </div>
            ) : (
                <div className="space-y-3">
                  {solicitacoesFiltradas.map((solicitacao) => {
                      const classeStatus = solicitacao.status.toLowerCase().replace(' ', '-').replace('á', 'a');
                      const dataUltimaAtualizacao = solicitacao.historico && solicitacao.historico.length > 0 
                        ? solicitacao.historico[0].data 
                        : 'Data indisponível';
                      const isReforco = solicitacao.userId !== user?.uid;
                        
                      return (
                          <div 
                              key={solicitacao.id} 
                              onClick={() => router.push(`/solicitacoes/detalhe?id=${solicitacao.id}`)} 
                              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border border-slate-100 rounded-2xl hover:bg-slate-50/50 hover:border-slate-200 transition-all cursor-pointer gap-4 relative overflow-hidden group"
                          >
                              <div className="space-y-1.5 flex-1 min-w-0">
                                  <p className="font-bold text-slate-750 text-sm sm:text-base flex flex-wrap items-center gap-x-2 gap-y-1">
                                    {solicitacao.type}{" "}
                                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                      #{solicitacao.id.substring(0, 6)}
                                    </span>
                                    {isReforco && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-150 rounded-full px-2 py-0.5">
                                        🔗 Apoio de vizinhança
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 font-medium truncate max-w-md">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                    <span>{solicitacao.address}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3 text-slate-350" />
                                    Última atualização: {dataUltimaAtualizacao}
                                  </p>
                              </div>
                              <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                                  <span className={`etiqueta-status status-${classeStatus}`}>{solicitacao.status}</span>
                                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-650 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                              </div>
                          </div>
                      );
                  })}
                </div>
            )}
        </main>
    </section>
  );
}
