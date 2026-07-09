"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

const getUploadUrl = () => {
  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal && process.env.NEXT_PUBLIC_UPLOAD_URL) {
      return process.env.NEXT_PUBLIC_UPLOAD_URL;
    }
  }
  return "/api/upload.php";
};
import { useToast } from "@/context/ToastContext";
import { 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  X, 
  Upload, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  FileText 
} from "lucide-react";

function DetalheSolicitacaoContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { showToast } = useToast();
  
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [solicitacao, setSolicitacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSendingReanalise, setIsSendingReanalise] = useState(false);
  const [isSendingComprovacao, setIsSendingComprovacao] = useState(false);

  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      setShowPickerModal(false);
    } catch (err) {
      console.error("Erro ao acessar a câmera: ", err);
      showToast("Não foi possível abrir a câmera interna. Usando seletor do sistema.", "warning");
      setShowPickerModal(false);
      document.getElementById("input-camera")?.click();
    }
  };

  const pararCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturarFoto = () => {
    const video = document.getElementById("webcam-video") as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `foto-camera-${Date.now()}.jpg`, { type: "image/jpeg" });
            adicionarArquivos([file]);
            pararCamera();
          }
        }, "image/jpeg", 0.9);
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraActive, cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const adicionarArquivos = (novosArquivos: File[]) => {
    setArquivos(prev => [...prev, ...novosArquivos]);
    showToast(`${novosArquivos.length} foto(s) adicionada(s) com sucesso.`, "success");
    setShowPickerModal(false);
  };

  const removerArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
    showToast("Foto removida.", "info");
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

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
      <section className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-12">
        <div className="text-sm font-semibold text-slate-500 animate-pulse flex items-center gap-2">
          <span>🌳</span> Carregando detalhes...
        </div>
      </section>
    );
  }

  if (!solicitacao) {
    return (
      <section className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-12 text-center">
        <span className="text-4xl block mb-2">😕</span>
        <h1 className="text-xl font-bold text-slate-800">Solicitação não encontrada</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">O protocolo informado não foi localizado em nossa base de dados.</p>
        <button 
          onClick={() => router.push("/solicitacoes")} 
          className="mt-6 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold py-2.5 px-6 rounded-xl text-xs transition-colors cursor-pointer"
        >
          Voltar para Lista
        </button>
      </section>
    );
  }

  const solicitarReanalise = async () => {
    const novaJustificativa = (document.getElementById('reanalise-justificativa') as HTMLTextAreaElement)?.value;
    if (!novaJustificativa) {
        showToast('Preencha a nova justificativa.', 'warning');
        return;
    }
    
    setIsSendingReanalise(true);
    try {
      const docRef = doc(db, "solicitacoes", id!);
      
      const novasUrls: string[] = [];
      if (arquivos.length > 0) {
        const formDataUpload = new FormData();
        if (user) formDataUpload.append("userId", user.uid);
        arquivos.forEach((arquivo) => {
          formDataUpload.append("files[]", arquivo);
        });

        try {
          const resUpload = await fetch(getUploadUrl(), {
            method: "POST",
            body: formDataUpload,
          });
          const dataUpload = await resUpload.json();
          if (dataUpload.urls) {
            novasUrls.push(...dataUpload.urls);
          }
        } catch (error) {
          console.error("Erro no upload das imagens de reanálise:", error);
        }
      }

      const novoHistorico = [
        {
          data: new Date().toLocaleDateString('pt-BR'),
          status: 'Em Análise',
          descricao: `Pedido de reanálise recebido. Nova justificativa: ${novaJustificativa}${novasUrls.length > 0 ? " (Novas fotos anexadas)" : ""}`
        },
        ...solicitacao.historico
      ];

      const updatePayload: any = {
        status: 'Em Análise',
        historico: novoHistorico
      };

      if (novasUrls.length > 0) {
        updatePayload.fotos = [...(solicitacao.fotos || []), ...novasUrls];
      }

      await updateDoc(docRef, updatePayload);

      showToast('Pedido de reanálise enviado com sucesso.', 'success');
      router.push("/solicitacoes");
    } catch (e) {
      console.error("Erro ao atualizar a solicitação: ", e);
      showToast("Erro ao pedir reanálise.", 'error');
    } finally {
      setIsSendingReanalise(false);
    }
  };

  const enviarComprovacaoPoda = async () => {
    if (arquivos.length === 0) {
      showToast('Por favor, adicione pelo menos uma foto de comprovação.', 'warning');
      return;
    }

    setIsSendingComprovacao(true);
    try {
      const docRef = doc(db, "solicitacoes", id!);
      const novasUrls: string[] = [];

      const formDataUpload = new FormData();
      if (user) formDataUpload.append("userId", user.uid);
      arquivos.forEach((arquivo) => {
        formDataUpload.append("files[]", arquivo);
      });

      try {
        const resUpload = await fetch(getUploadUrl(), {
          method: "POST",
          body: formDataUpload,
        });
        const dataUpload = await resUpload.json();
        if (dataUpload.urls) {
          novasUrls.push(...dataUpload.urls);
        }
      } catch (error) {
        console.error("Erro no upload das imagens de comprovação:", error);
        throw new Error("Falha ao enviar arquivos para o servidor.");
      }

      if (novasUrls.length === 0) {
        throw new Error("Nenhuma foto foi enviada com sucesso.");
      }

      const novasFotos = novasUrls.map(url => ({
        url,
        autor: "usuario_corte",
        data: new Date().toLocaleDateString('pt-BR')
      }));

      const novoHistorico = [
        {
          data: new Date().toLocaleDateString('pt-BR'),
          status: 'Aguardando Validação',
          descricao: `Comprovação de execução enviada. Fotos pós-corte anexadas.`
        },
        ...solicitacao.historico
      ];

      const updatePayload: any = {
        status: 'Aguardando Validação',
        historico: novoHistorico,
        fotos: [...(solicitacao.fotos || []), ...novasFotos]
      };

      await updateDoc(docRef, updatePayload);

      showToast('Comprovação de execução enviada com sucesso!', 'success');
      router.push("/solicitacoes");
    } catch (e: any) {
      console.error("Erro ao enviar comprovação de poda:", e);
      showToast(e.message || "Erro ao enviar comprovação.", 'error');
    } finally {
      setIsSendingComprovacao(false);
    }
  };

  const classeStatus = solicitacao.status.toLowerCase().replace(' ', '-').replace('á', 'a');

  return (
    <section id="tela-detalhe-solicitacao" className="w-full max-w-2xl mx-auto flex flex-col animate-fadeIn">
        <header className="w-full flex items-center mb-6 border-b border-slate-200 pb-4">
            <button 
              onClick={() => router.push("/solicitacoes")} 
              className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-200/50 rounded-lg flex items-center justify-center mr-1 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Detalhe da Solicitação</h1>
              <p className="text-[10px] sm:text-xs text-slate-500">Histórico detalhado e andamento do chamado</p>
            </div>
        </header>

        {/* Main Details Card */}
        <main id="container-detalhe-solicitacao" className="w-full bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
            
            {/* Solicitation Info Section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1.5 min-w-0">
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {solicitacao.type || "Solicitação de Serviço"}
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 truncate">{solicitacao.address}</h2>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Protocolo: #{/^\d{14}$/.test(solicitacao.id) ? solicitacao.id : solicitacao.id.substring(0, 8)}
                  </p>
                </div>
                
                <div className="flex-shrink-0 self-start sm:self-center">
                  <span className={`etiqueta-status status-${classeStatus}`}>{solicitacao.status}</span>
                </div>
            </div>
            
            {/* Aviso de Ação Requerida para Status Aprovado */}
            {solicitacao.status === 'Aprovado' && (
              <div className="bg-amber-50 border border-amber-250 p-4 rounded-xl flex gap-3 text-amber-900 text-xs shadow-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-amber-955">Ação Necessária: Enviar Foto de Comprovação</h4>
                  <p className="leading-relaxed font-semibold">
                    Sua solicitação foi **Aprovada** pelo município! Para finalizar o chamado, você precisa executar o serviço e **enviar a foto da árvore podada** usando o formulário de comprovação no final desta página.
                  </p>
                </div>
              </div>
            )}

            {solicitacao.status === 'Concluído' && solicitacao.concederCertificado === true && (
              <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-950 shadow-sm relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-10 text-7xl pointer-events-none select-none">🏆</div>
                <div className="flex gap-3 items-start">
                  <span className="text-2xl shrink-0 mt-0.5">🌱</span>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-emerald-900 text-sm">Certificado de Agradecimento Disponível!</h4>
                    <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                      Muito obrigado por sua contribuição com o meio ambiente! Sua solicitação foi concluída e a prefeitura emitiu um **Certificado de Reconhecimento**.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCertificateModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-all shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1 hover:scale-[1.02] transform active:scale-95"
                >
                  <span>🏆 Ver Certificado</span>
                </button>
              </div>
            )}

            {/* Timeline Tracking */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-emerald-650" /> Linha do Tempo do Pedido
              </h3>
              
              <div className="timeline pl-6 pt-2">
                {solicitacao.historico?.map((evento: any, index: number) => {
                  const classeStatusEvento = evento.status.toLowerCase().replace(' ', '-').replace('á', 'a');
                  return (
                    <div key={index} className="timeline-item">
                        <div className={`timeline-dot status-${classeStatusEvento}`}></div>
                        <div className="pl-4 pb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{evento.data}</p>
                            <p className="font-bold text-slate-800 text-sm sm:text-base mt-0.5">{evento.status}</p>
                            <p className="text-slate-650 text-xs sm:text-sm mt-1 leading-relaxed font-medium">{evento.descricao}</p>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Proof of Execution Block (If status is Aprovado) */}
            {solicitacao.status === 'Aprovado' && (
                <div className="border-t mt-6 pt-6 border-dashed border-emerald-250 bg-emerald-50/10 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Camera className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                      <h3 className="text-sm sm:text-base font-extrabold">Comprovação de Execução da Poda</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sua solicitação de poda foi autorizada. Após realizar a execução do serviço de poda/corte no local, você **deve enviar fotos da árvore cortada/podada** como comprovação para que o município possa homologar e concluir o seu chamado.
                    </p>
                    
                    <div className="space-y-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Fotos de Comprovação pós-corte <span className="text-red-500">*</span></label>
                            
                            {/* Photo Upload Area */}
                            <div 
                              onClick={() => setShowPickerModal(true)} 
                              className="flex flex-col items-center justify-center px-6 pt-6 pb-7 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-slate-50/50 transition-all text-center group"
                            >
                              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors mb-3 border border-slate-200/50">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div className="flex text-xs text-slate-600 font-semibold mb-1">
                                <span className="text-emerald-600 group-hover:text-emerald-700 font-bold">Adicionar fotos do corte</span>
                              </div>
                              <p className="text-[10px] text-slate-500">Tire uma foto ou selecione do aparelho</p>
                            </div>

                            {/* Selected Previews Grid */}
                            {arquivos.length > 0 && (
                              <div className="mt-5 space-y-2.5">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fotos Selecionadas ({arquivos.length})</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {arquivos.map((file, idx) => {
                                    const fileUrl = URL.createObjectURL(file);
                                    return (
                                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 group">
                                        <img 
                                          src={fileUrl} 
                                          alt={`Preview ${idx}`} 
                                          className="w-full h-full object-cover" 
                                        />
                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <button 
                                            type="button" 
                                            onClick={() => setSelectedPreview(fileUrl)} 
                                            title="Visualizar Foto"
                                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => removerArquivo(idx)} 
                                            title="Remover Foto"
                                            className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                         </div>

                         <button 
                           onClick={enviarComprovacaoPoda} 
                           disabled={isSendingComprovacao || arquivos.length === 0}
                           className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md mt-4 cursor-pointer"
                         >
                           {isSendingComprovacao ? (
                             <>
                               <Loader2 className="w-4.5 h-4.5 animate-spin" /> Enviando Comprovação...
                             </>
                           ) : (
                             "Enviar Comprovação de Poda"
                           )}
                         </button>
                    </div>
                </div>
            )}

            {/* Reanalysis Block (If status is Recusado) */}
            {solicitacao.status === 'Recusado' && (
                <div className="border-t mt-6 pt-6 border-dashed border-red-200/80 bg-red-50/10 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
                      <h3 className="text-sm sm:text-base font-extrabold">Solicitar Reanálise de Parecer</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Seu pedido foi indeferido pelo técnico. Caso possua novos argumentos, documentos ou fotos adicionais provando que o espécime necessita de intervenção, preencha o formulário abaixo.
                    </p>
                    
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="reanalise-justificativa" className="block text-xs font-bold text-slate-600 uppercase mb-1">Nova Justificativa <span className="text-red-500">*</span></label>
                            <textarea 
                              id="reanalise-justificativa" 
                              rows={4} 
                              className="w-full px-3 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-medium text-xs sm:text-sm transition-all resize-none placeholder-slate-450" 
                              placeholder="Apresente seus novos argumentos técnicos ou de risco de queda..."
                            ></textarea>
                         </div>

                         <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Anexar Novas Fotos</label>
                            
                            {/* Photo Upload Area */}
                            <div 
                              onClick={() => setShowPickerModal(true)} 
                              className="flex flex-col items-center justify-center px-6 pt-6 pb-7 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-slate-50/50 transition-all text-center group"
                            >
                              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors mb-3 border border-slate-200/50">
                                <Upload className="w-5 h-5" />
                              </div>
                              <div className="flex text-xs text-slate-600 font-semibold mb-1">
                                <span className="text-emerald-600 group-hover:text-emerald-700 font-bold">Adicionar novas fotos</span>
                              </div>
                              <p className="text-[10px] text-slate-500">Tire uma foto ou selecione do aparelho</p>
                            </div>

                            {/* Selected Previews Grid */}
                            {arquivos.length > 0 && (
                              <div className="mt-5 space-y-2.5">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fotos Selecionadas ({arquivos.length})</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {arquivos.map((file, idx) => {
                                    const fileUrl = URL.createObjectURL(file);
                                    return (
                                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 group">
                                        <img 
                                          src={fileUrl} 
                                          alt={`Preview ${idx}`} 
                                          className="w-full h-full object-cover" 
                                        />
                                        {/* Actions Overlay */}
                                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          <button 
                                            type="button" 
                                            onClick={() => setSelectedPreview(fileUrl)} 
                                            title="Visualizar Foto"
                                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => removerArquivo(idx)} 
                                            title="Remover Foto"
                                            className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        
                                        {/* Touch Fallbacks */}
                                        <div className="absolute bottom-2 left-2 right-2 flex justify-between md:hidden gap-1">
                                          <button 
                                            type="button" 
                                            onClick={() => setSelectedPreview(fileUrl)} 
                                            className="flex-1 py-1 rounded bg-slate-900/80 text-white text-[9px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                                          >
                                            <Eye className="w-3 h-3" /> Ver
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => removerArquivo(idx)} 
                                            className="flex-1 py-1 rounded bg-red-600/80 text-white text-[9px] font-bold flex items-center justify-center gap-0.5 cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" /> Excluir
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                         </div>

                         <button 
                           onClick={solicitarReanalise} 
                           disabled={isSendingReanalise}
                           className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md mt-4 cursor-pointer"
                         >
                           {isSendingReanalise ? (
                             <>
                               <Loader2 className="w-4.5 h-4.5 animate-spin" /> Enviando Pedido...
                             </>
                           ) : (
                             "Enviar Pedido de Reanálise"
                           )}
                         </button>
                    </div>
                </div>
            )}
        </main>

        {/* Modal: Select camera or gallery */}
        {showPickerModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col animate-slideUp">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">Adicionar Foto</h3>
                <button 
                  type="button"
                  onClick={() => setShowPickerModal(false)} 
                  className="text-slate-400 hover:text-slate-650 p-1.5 rounded-lg hover:bg-slate-200/50 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Body Options */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={iniciarCamera}
                  className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all text-center cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 transition-colors border border-emerald-100/50">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">Tirar Foto</span>
                  <span className="text-[10px] text-slate-500 mt-1 font-medium">Usar a câmera</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("input-galeria")?.click();
                  }}
                  className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all text-center cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 mb-3 transition-colors border border-blue-100/50">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">Galeria</span>
                  <span className="text-[10px] text-slate-500 mt-1 font-medium">Escolher arquivo</span>
                </button>
              </div>
              
              <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowPickerModal(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-250 text-slate-600 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Fullscreen Photo Preview */}
        {selectedPreview && (
          <div className="fixed inset-0 bg-slate-950/95 z-55 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
              <span className="text-white text-xs font-bold bg-slate-900/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Visualizando Anexo
              </span>
              <button 
                type="button"
                onClick={() => setSelectedPreview(null)} 
                className="text-white bg-slate-900/60 hover:bg-slate-900/80 p-2.5 rounded-full backdrop-blur-sm transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="max-w-full max-h-[85vh] flex items-center justify-center">
              <img 
                src={selectedPreview} 
                alt="Visualização do anexo" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" 
              />
            </div>
          </div>
        )}

        {/* Modal: Live Camera Stream Capture */}
        {isCameraActive && (
          <div className="fixed inset-0 bg-slate-950/98 z-55 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-black flex flex-col items-center">
              {/* Webcam view */}
              <div className="relative w-full aspect-[3/4] bg-slate-900 flex items-center justify-center">
                <video 
                  ref={videoRef}
                  id="webcam-video"
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Guidelines grid overlay */}
                <div className="absolute inset-6 border border-dashed border-white/20 rounded-2xl pointer-events-none"></div>
              </div>
              
              {/* Webcam Controls */}
              <div className="w-full bg-slate-900 p-6 flex items-center justify-between gap-4">
                <button 
                  type="button" 
                  onClick={pararCamera}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all border border-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                
                <button 
                  type="button" 
                  onClick={capturarFoto}
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-900 shadow-lg border-4 border-slate-800 focus:outline-none transition-all transform active:scale-95 cursor-pointer"
                  title="Capturar Foto"
                >
                  <div className="w-5 h-5 rounded-full bg-red-500"></div>
                </button>
                
                <div className="w-[72px]"></div> {/* spacer spacing */}
              </div>
            </div>
          </div>
        )}
        
        {/* Hidden file inputs available globally */}
        <input 
          id="input-galeria" 
          type="file" 
          accept="image/*" 
          multiple 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) {
              adicionarArquivos(Array.from(e.target.files));
            }
            e.target.value = "";
          }} 
        />
        <input 
          id="input-camera" 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) {
              adicionarArquivos(Array.from(e.target.files));
            }
            e.target.value = "";
          }} 
        />

        {/* Modal: Certificado Ambiental */}
        {showCertificateModal && (
          <div className="fixed inset-0 bg-slate-950/80 z-55 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl transition-all flex flex-col relative animate-fadeIn max-h-[90vh]">
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowCertificateModal(false)} 
                className="absolute top-4 right-4 text-slate-450 hover:text-slate-750 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer z-10 print:hidden"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Printable Certificate Area */}
              <div id="print-certificate" className="p-8 sm:p-12 flex flex-col items-center justify-between text-center border-8 border-double border-emerald-700 m-4 rounded-2xl relative overflow-hidden bg-gradient-to-b from-stone-50 via-white to-stone-50 shadow-inner">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-50 rounded-br-full opacity-30 border-r border-b border-emerald-100"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-50 rounded-tl-full opacity-30 border-l border-t border-emerald-100"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-10 pointer-events-none"></div>

                <style dangerouslySetInnerHTML={{__html: `
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #print-certificate, #print-certificate * {
                      visibility: visible;
                    }
                    #print-certificate {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      height: auto;
                      border: 8px double #047857 !important;
                      margin: 0 !important;
                      box-shadow: none !important;
                      background: white !important;
                      padding: 3rem !important;
                    }
                  }
                `}} />

                {/* Header */}
                <div className="space-y-2 flex flex-col items-center">
                  <span className="text-4xl block">🌳</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Prefeitura Municipal de São José do Rio Preto</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Secretaria Municipal de Meio Ambiente e Urbanismo</p>
                </div>

                {/* Main title */}
                <div className="my-6">
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-slate-800 tracking-tight">
                    Certificado de Reconhecimento Ambiental
                  </h2>
                  <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-emerald-600 to-transparent mx-auto mt-2"></div>
                </div>

                {/* Body Content */}
                <div className="space-y-4 max-w-lg">
                  <p className="text-xs sm:text-sm text-slate-500 italic font-medium">
                    A Secretaria Municipal de Meio Ambiente e Urbanismo confere o presente selo verde a
                  </p>
                  
                  {/* Citizen Name */}
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight font-serif">
                    {solicitacao.requesterName || user?.displayName || "Cidadão Consciente"}
                  </h3>
                  
                  {/* Narrative paragraph */}
                  <p className="text-xs sm:text-sm text-slate-650 leading-relaxed font-semibold px-4">
                    Como reconhecimento por sua valiosa contribuição cidadã com a manutenção, arborização urbana e preservação do ecossistema local, tendo homologado e concluído com sucesso a poda/supressão ambiental no endereço:
                  </p>
                  
                  {/* Address */}
                  <p className="text-xs font-black text-slate-800 bg-slate-100 py-2 px-4 rounded-xl border border-slate-200 inline-block max-w-md">
                    📍 {solicitacao.address}
                  </p>
                  
                  {/* Protocol and Date */}
                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                    Protocolo: #{/^\d{14}$/.test(solicitacao.id) ? solicitacao.id : solicitacao.id.substring(0, 8)} • Concluído em {solicitacao.dataFinalizacao || new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Seal / Footer Signature Area */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 w-full max-w-md pt-4 border-t border-slate-100">
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 bg-amber-50 rounded-full border-4 border-double border-amber-500 flex items-center justify-center text-amber-600 shadow-md">
                      <span className="text-2xl">🏅</span>
                    </div>
                    <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest mt-1">Selo Verde Cidadão</span>
                  </div>

                  <div className="text-center">
                    <div className="w-40 border-b border-slate-300 mx-auto mt-4"></div>
                    <p className="text-[10px] font-bold text-slate-700 mt-1">Secretaria Municipal de Meio Ambiente</p>
                    <p className="text-[8px] text-slate-400 font-medium">Gestão de Arborização Urbana</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3 justify-end print:hidden">
                <button 
                  type="button" 
                  onClick={() => setShowCertificateModal(false)}
                  className="py-2.5 px-5 bg-slate-100 hover:bg-slate-250 text-slate-600 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  onClick={() => window.print()}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🖨️ Imprimir ou Salvar PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
    </section>
  );
}

export default function DetalheSolicitacaoPage() {
  return (
    <Suspense fallback={
      <section className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-12">
        <p className="text-sm font-semibold text-slate-500 animate-pulse">Carregando...</p>
      </section>
    }>
      <DetalheSolicitacaoContent />
    </Suspense>
  );
}
