"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

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

    const q = query(
      collection(db, "solicitacoes"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const solicitacoesArray: any[] = [];
      querySnapshot.forEach((doc) => {
        solicitacoesArray.push({ id: doc.id, ...doc.data() });
      });
      setSolicitacoes(solicitacoesArray);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar solicitacoes: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const solicitacoesFiltradas = filtro === 'Todos' 
    ? solicitacoes 
    : solicitacoes.filter(s => s.status === filtro);

  const getFilterButtonClass = (status: string) => {
    return filtro === status
      ? "px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-emerald-600 rounded-full"
      : "px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-full hover:bg-slate-100";
  };

  return (
    <section id="tela-lista-solicitacoes" className="w-full max-w-4xl mx-auto flex flex-col">
        <header className="w-full flex items-center mb-6">
            <button onClick={() => router.push("/")} className="text-slate-500 hover:text-emerald-600 mr-4">← Voltar</button>
            <h1 className="text-2xl font-bold text-slate-700">Minhas Solicitações</h1>
        </header>
        <div id="filtros-container" className="w-full flex flex-wrap gap-2 justify-center mb-4">
            <button onClick={() => setFiltro('Todos')} className={getFilterButtonClass('Todos')}>Todos</button>
            <button onClick={() => setFiltro('Em Análise')} className={getFilterButtonClass('Em Análise')}>Em Análise</button>
            <button onClick={() => setFiltro('Aprovado')} className={getFilterButtonClass('Aprovado')}>Aprovados</button>
            <button onClick={() => setFiltro('Recusado')} className={getFilterButtonClass('Recusado')}>Recusados</button>
        </div>
        <main id="container-solicitacoes" className="w-full bg-white p-4 rounded-lg shadow-md space-y-4">
            {loading ? (
                <p className="text-center text-slate-500 py-8">Carregando solicitações...</p>
            ) : solicitacoesFiltradas.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Nenhuma solicitação encontrada para este filtro.</p>
            ) : (
                solicitacoesFiltradas.map((solicitacao) => {
                    const classeStatus = solicitacao.status.toLowerCase().replace(' ', '-').replace('á', 'a');
                    const dataUltimaAtualizacao = solicitacao.historico && solicitacao.historico.length > 0 
                      ? solicitacao.historico[0].data 
                      : 'Data indisponível';
                      
                    return (
                        <div 
                            key={solicitacao.id} 
                            onClick={() => router.push(`/solicitacoes/${solicitacao.id}`)} 
                            className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                            <div className="mb-2 md:mb-0">
                                <p className="font-bold text-slate-700">{solicitacao.type} <span className="text-sm font-normal text-slate-500">#{solicitacao.id.substring(0, 6)}</span></p>
                                <p className="text-sm text-slate-600">{solicitacao.address}</p>
                                <p className="text-xs text-slate-400">Última atualização: {dataUltimaAtualizacao}</p>
                            </div>
                            <div>
                                <span className={`etiqueta-status status-${classeStatus}`}>{solicitacao.status}</span>
                            </div>
                        </div>
                    );
                })
            )}
        </main>
    </section>
  );
}
