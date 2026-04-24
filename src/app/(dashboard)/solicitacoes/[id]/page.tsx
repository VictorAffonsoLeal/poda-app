"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DetalheSolicitacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolicitacao = async () => {
      try {
        const docRef = doc(db, "solicitacoes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSolicitacao({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("Documento não encontrado!");
        }
      } catch (e) {
        console.error("Erro ao buscar documento:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSolicitacao();
  }, [id]);

  if (loading) {
    return (
      <section className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8">
        <p className="text-slate-500">Carregando detalhes...</p>
      </section>
    );
  }

  if (!solicitacao) {
    return (
      <section className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold text-slate-700">Solicitação não encontrada</h1>
        <button onClick={() => router.push("/solicitacoes")} className="mt-4 text-emerald-600 hover:underline">Voltar</button>
      </section>
    );
  }

  const solicitarReanalise = async () => {
    const novaJustificativa = (document.getElementById('reanalise-justificativa') as HTMLTextAreaElement)?.value;
    if (!novaJustificativa) {
        alert('Preencha a nova justificativa.');
        return;
    }
    
    try {
      const docRef = doc(db, "solicitacoes", id);
      
      const novoHistorico = [
        {
          data: new Date().toLocaleDateString('pt-BR'),
          status: 'Em Análise',
          descricao: `Pedido de reanálise recebido. Nova justificativa: ${novaJustificativa}`
        },
        ...solicitacao.historico
      ];

      await updateDoc(docRef, {
        status: 'Em Análise',
        historico: novoHistorico
      });

      alert('Pedido de reanálise enviado.');
      router.push("/solicitacoes");
    } catch (e) {
      console.error("Erro ao atualizar a solicitação: ", e);
      alert("Erro ao pedir reanálise.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArquivos(Array.from(e.target.files));
    }
  };

  return (
    <section id="tela-detalhe-solicitacao" className="w-full max-w-2xl mx-auto flex flex-col">
        <header className="w-full flex items-center mb-6">
            <button onClick={() => router.push("/solicitacoes")} className="text-slate-500 hover:text-emerald-600 mr-4">← Voltar</button>
            <h1 className="text-2xl font-bold text-slate-700">Detalhe da Solicitação</h1>
        </header>
        <main id="container-detalhe-solicitacao" className="w-full bg-white p-6 rounded-lg shadow-md">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">{solicitacao.type}</h2>
                <p className="text-sm text-slate-500">Protocolo: #{solicitacao.id.substring(0, 6)}</p>
                <p className="text-sm text-slate-500">Endereço: {solicitacao.address}</p>
            </div>
            
            <div className="timeline">
              {solicitacao.historico?.map((evento: any, index: number) => {
                const classeStatus = evento.status.toLowerCase().replace(' ', '-').replace('á', 'a');
                return (
                  <div key={index} className="timeline-item">
                      <div className={`timeline-dot status-${classeStatus}`}></div>
                      <div className="pl-4">
                          <p className="text-sm text-slate-500">{evento.data}</p>
                          <p className="font-bold text-slate-700">{evento.status}</p>
                          <p className="text-slate-600 text-sm">{evento.descricao}</p>
                      </div>
                  </div>
                );
              })}
            </div>

            {solicitacao.status === 'Recusado' && (
                <div className="border-t mt-6 pt-6 border-dashed border-red-300">
                    <h3 className="text-lg font-bold text-red-700 mb-4">Solicitar Reanálise</h3>
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="reanalise-justificativa" className="block text-sm font-medium text-slate-600">Nova Justificativa</label>
                            <textarea id="reanalise-justificativa" rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" placeholder="Apresente novos argumentos..."></textarea>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-600">Anexar Novas Fotos</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <div className="text-4xl text-slate-400">📷</div>
                                    <div className="flex text-sm text-slate-600">
                                        <label htmlFor="reanalise-upload-arquivo" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                                            <span>Carregar arquivos</span><input id="reanalise-upload-arquivo" type="file" className="sr-only" multiple onChange={handleFileChange} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div id="lista-arquivos-reanalise" className="mt-2 text-sm text-slate-600">
                              {arquivos.length > 0 && (
                                <>
                                  <ul className="list-disc pl-5 mt-1">
                                    {arquivos.map((file, i) => <li key={i}>{file.name}</li>)}
                                  </ul>
                                </>
                              )}
                            </div>
                         </div>
                         <button onClick={solicitarReanalise} className="w-full bg-orange-500 text-white py-2.5 px-4 rounded-md hover:bg-orange-600 font-semibold">Enviar Pedido de Reanálise</button>
                    </div>
                </div>
            )}
        </main>
    </section>
  );
}
