"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, updateDoc, doc, getDocs, query, where, arrayUnion, serverTimestamp } from "firebase/firestore";
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
  AlertTriangle, 
  Loader2,
  FileText,
  CheckCircle2,
  ClipboardList,
  Map
} from "lucide-react";

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [documentoAnuencia, setDocumentoAnuencia] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

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

  // Clean up camera stream on unmount
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

  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [justificativaOutros, setJustificativaOutros] = useState("");

  const motivosPadrao = [
    "Galhos secos ou com risco de queda",
    "Obstrução da rede elétrica ou fiação",
    "Obstrução de sinalização de trânsito ou iluminação",
    "Galhos atingindo telhado ou estrutura do imóvel",
    "Raízes danificando calçada, muro ou tubulação",
    "Árvore inclinada com risco de tombamento",
    "Árvore morta ou visivelmente doente/apodrecida",
    "Presença de pragas (cupins/brocas) no tronco",
    "Poda de limpeza ou equilíbrio da copa"
  ];

  const handleMotivoChange = (motivo: string) => {
    setMotivosSelecionados(prev => 
      prev.includes(motivo) ? prev.filter(m => m !== motivo) : [...prev, motivo]
    );
  };
  
  const [formData, setFormData] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    bairro: ""
  });
  const [treeId, setTreeId] = useState("");
  const [referencia, setReferencia] = useState("");
  const [tipoServico, setTipoServico] = useState("Solicitação de Poda de Árvore");
  const [tipoArea, setTipoArea] = useState("Particular");
  const [risco, setRisco] = useState("Nenhum risco aparente");
  
  // Novas flags
  const [imovelAlugado, setImovelAlugado] = useState(false);
  const [anuenciaProprietario, setAnuenciaProprietario] = useState(false);
  const [cienteCompensacao, setCienteCompensacao] = useState(false);

  const [geolocalizacao, setGeolocalizacao] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const obterLocalizacao = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocalizacao({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsGettingLocation(false);
          showToast("Localização obtida com sucesso!", "success");
        },
        (error) => {
          console.error(error);
          showToast("Não foi possível obter sua localização. Verifique as permissões do navegador.", "error");
          setIsGettingLocation(false);
        }
      );
    } else {
      showToast("Geolocalização não suportada no seu navegador.", "warning");
      setIsGettingLocation(false);
    }
  };

  // CEP helpers
  const formatCEP = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.substring(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
  };

  const buscarCep = async (cepValor: string) => {
    const cepClean = cepValor.replace(/\D/g, "");
    if (cepClean.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
          }));
        } else {
          showToast("CEP não encontrado. Preencha o endereço manualmente.", "warning");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        showToast("Erro ao conectar com o serviço de CEP.", "error");
      }
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep: formatted }));
    if (formatted.replace(/\D/g, "").length === 8) {
      buscarCep(formatted);
    }
  };

  useEffect(() => {
    if (userData && userData.endereco) {
      setFormData(userData.endereco);
    }
  }, [userData]);

  const handleAbrirConfirmacao = () => {
    if (!user) {
      showToast("Você precisa estar logado para enviar uma solicitação.", "error");
      return;
    }

    if (!formData.logradouro?.trim() || !formData.numero?.trim() || !formData.bairro?.trim()) {
      showToast("Por favor, preencha todos os campos obrigatórios do endereço (Logradouro, Número e Bairro).", "warning");
      return;
    }

    let justificativaFinal = motivosSelecionados.join(", ");
    if (motivosSelecionados.includes("Outros") && justificativaOutros) {
        justificativaFinal = justificativaFinal ? `${justificativaFinal}, Outros: ${justificativaOutros}` : `Outros: ${justificativaOutros}`;
    }

    if (!justificativaFinal.trim()) {
        showToast('Selecione pelo menos um motivo para a solicitação.', 'warning');
        return;
    }

    if (tipoServico === "Solicitação de Supressão (Corte)" && !cienteCompensacao) {
      showToast("Para solicitar supressão, é obrigatório concordar com a compensação ambiental.", "warning");
      return;
    }

    if (imovelAlugado && !anuenciaProprietario) {
      showToast("Para imóveis alugados, é obrigatório confirmar a anuência do proprietário.", "warning");
      return;
    }

    if (imovelAlugado && anuenciaProprietario && !documentoAnuencia) {
      showToast("Anexe o documento de autorização assinado pelo proprietário.", "warning");
      return;
    }

    setShowConfirmModal(true);
  };

  const enviarSolicitacao = async () => {
    if (!user) {
      showToast("Você precisa estar logado para enviar uma solicitação.", "error");
      return;
    }

    let justificativaFinal = motivosSelecionados.join(", ");
    if (motivosSelecionados.includes("Outros") && justificativaOutros) {
        justificativaFinal = justificativaFinal ? `${justificativaFinal}, Outros: ${justificativaOutros}` : `Outros: ${justificativaOutros}`;
    }

    if (!justificativaFinal) {
        showToast('Selecione pelo menos um motivo para a solicitação.', 'warning');
        return;
    }

    if (tipoServico === "Solicitação de Supressão (Corte)" && !cienteCompensacao) {
      showToast("Para solicitar supressão, é obrigatório concordar com a compensação ambiental.", "warning");
      return;
    }

    if (imovelAlugado && !anuenciaProprietario) {
      showToast("Para imóveis alugados, é obrigatório confirmar a anuência do proprietário.", "warning");
      return;
    }

    if (imovelAlugado && anuenciaProprietario && !documentoAnuencia) {
      showToast("Anexe o documento de autorização assinado pelo proprietário.", "warning");
      return;
    }
    
    setIsLoading(true);

    try {
      const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}`;

      // CHECAGEM DE DUPLICIDADE
      let duplicateQuery;
      if (treeId) {
        duplicateQuery = query(collection(db, "solicitacoes"), where("treeId", "==", treeId), where("status", "in", ["Criado", "Em Análise", "Aprovado"]));
      } else {
        duplicateQuery = query(collection(db, "solicitacoes"), where("address", "==", fullAddress), where("status", "in", ["Criado", "Em Análise", "Aprovado"]));
      }

      const duplicateSnapshot = await getDocs(duplicateQuery);

      // Upload das fotos para a Hostinger via PHP
      const urls: string[] = [];
      if (arquivos.length > 0) {
        const formDataUpload = new FormData();
        formDataUpload.append("userId", user.uid);
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
            urls.push(...dataUpload.urls);
          }
          if (dataUpload.errors && dataUpload.errors.length > 0) {
            console.error("Erros no upload das fotos:", dataUpload.errors);
            showToast("Algumas fotos não foram salvas: " + dataUpload.errors.join(", "), "warning");
          }
        } catch (error) {
          console.error("Erro no upload das imagens:", error);
          showToast("Erro ao enviar as imagens para o servidor. A solicitação continuará sem fotos.", "warning");
        }
      }

      // Upload do documento de anuência para a Hostinger via PHP
      let urlDocumentoAnuencia: string | null = null;
      if (documentoAnuencia) {
        const formDataDoc = new FormData();
        formDataDoc.append("userId", user.uid);
        formDataDoc.append("files[]", documentoAnuencia);
        try {
          const resDoc = await fetch(getUploadUrl(), {
            method: "POST",
            body: formDataDoc,
          });
          const dataDoc = await resDoc.json();
          if (dataDoc.urls && dataDoc.urls.length > 0) {
            urlDocumentoAnuencia = dataDoc.urls[0];
          } else {
            const errorMsg = dataDoc.errors && dataDoc.errors.length > 0 
              ? dataDoc.errors.join(", ") 
              : "Erro desconhecido no servidor de arquivos.";
            console.error("Erro no upload do documento de anuência:", dataDoc);
            showToast("Erro ao salvar o documento: " + errorMsg, "error");
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Erro no upload do documento de anuência:", error);
          showToast("Erro ao enviar o documento de autorização. Tente novamente.", "error");
          setIsLoading(false);
          return;
        }
      }

      if (!duplicateSnapshot.empty) {
        // ENCONTROU DUPLICIDADE
        const existingDoc = duplicateSnapshot.docs[0];
        const existingId = existingDoc.id;

        const reforcoEntry = {
          data: new Date().toLocaleDateString('pt-BR'),
          status: existingDoc.data().status,
          descricao: `[REFORÇO] Novo pedido registrado para esta árvore. Motivos: ${justificativaFinal}`
        };

        const updatePayload: any = {
          historico: arrayUnion(reforcoEntry),
          solicitantesAdicionais: arrayUnion(user.uid)
        };

        if (urls.length > 0) {
          updatePayload.fotos = arrayUnion(...urls);
        }

        await updateDoc(doc(db, "solicitacoes", existingId), updatePayload);
        
        showToast(`Identificamos que já existe um chamado em andamento para esta árvore (Protocolo #${existingId}). Sua justificativa e fotos foram anexadas ao processo principal como um REFORÇO para dar mais peso ao pedido!`, "info", 8000);
        setShowConfirmModal(false);
        router.push("/solicitacoes");
        return;
      }

      // Geocoding fallback Nominatim
      let finalGeo = geolocalizacao;
      if (!finalGeo && formData.logradouro) {
        try {
          const query = `${formData.logradouro}, ${formData.numero}, ${formData.bairro}, São José do Rio Preto, SP`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            finalGeo = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        } catch(e) {}
      }

      const solicitacaoData = {
        userId: user.uid,
        type: tipoServico,
        address: fullAddress,
        cep: formData.cep || "Não informado",
        referencia,
        tipoArea,
        risco,
        treeId: treeId || null,
        imovelAlugado,
        anuenciaProprietario: imovelAlugado ? anuenciaProprietario : null,
        documentoAnuencia: urlDocumentoAnuencia,
        cienteCompensacao: tipoServico === "Solicitação de Supressão (Corte)" ? cienteCompensacao : null,
        geolocalizacao: finalGeo,
        fotos: urls,
        status: 'Criado',
        createdAt: serverTimestamp(),
        historico: [
          {
            data: new Date().toLocaleDateString('pt-BR'),
            status: 'Criado',
            descricao: `Solicitação criada. Motivos: ${justificativaFinal}`
          }
        ]
      };
      
      const docRef = await addDoc(collection(db, "solicitacoes"), solicitacaoData);
      showToast(`Solicitação enviada com sucesso! Protocolo: #${docRef.id}`, "success");
      setShowConfirmModal(false);
      router.push("/solicitacoes");
    } catch (e) {
      console.error("Erro ao salvar no Firestore: ", e);
      showToast('Erro ao enviar a solicitação. Tente novamente.', "error");
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass = "w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-semibold text-xs sm:text-sm transition-all";
  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-medium text-xs sm:text-sm transition-all placeholder-slate-400";

  return (
    <section id="tela-formulario" className="w-full max-w-2xl mx-auto flex flex-col animate-fadeIn">
        <header className="w-full flex items-center mb-6 border-b border-slate-200 pb-4">
            <button 
              onClick={() => router.push("/")} 
              className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-200/50 rounded-lg flex items-center justify-center mr-1 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Nova Solicitação</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">Preencha os dados abaixo para pedir vistoria de poda/supressão</p>
            </div>
        </header>

        <main className="w-full bg-white p-5 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Tipo de Serviço</h3>
                    <select value={tipoServico} onChange={e => setTipoServico(e.target.value)} className={selectClass}>
                        <option value="Solicitação de Poda de Árvore">Solicitação de Poda de Árvore</option>
                        <option value="Solicitação de Supressão (Corte)">Solicitação de Supressão (Corte)</option>
                        <option value="Solicitação de Fiscalização de Serviço Realizado">Solicitação de Fiscalização de Serviço Realizado</option>
                    </select>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Tipo de Área</h3>
                    <select value={tipoArea} onChange={e => setTipoArea(e.target.value)} className={selectClass}>
                        <option value="Particular">Particular (Ex: Dentro do meu quintal)</option>
                        <option value="Municipal">Municipal (Ex: Calçada, Praça pública)</option>
                        <option value="Federal">Federal</option>
                        <option value="APP / Rural">APP (Área de Preservação Permanente) ou Rural</option>
                    </select>
                </div>
            </div>

            {tipoArea === "APP / Rural" && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex gap-3 text-red-800">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div className="text-xs">
                  <h4 className="font-extrabold text-red-900">Atenção: Exigência da CETESB</h4>
                  <p className="mt-1 leading-relaxed font-medium">
                    Intervenções em áreas de APP ou Rurais dependem de autorização do órgão estadual (<a href="https://cetesb.sp.gov.br" target="_blank" rel="noopener noreferrer" className="underline font-bold text-red-800">CETESB</a>). O município necessita da licença estadual apresentada para emitir o deferimento.
                  </p>
                </div>
              </div>
            )}
            
            <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Endereço do Serviço</h3>
                <p className="text-[11px] text-slate-400 font-semibold mb-3">Pré-preenchido com seu cadastro. Altere caso precise solicitar para outro local.</p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                     <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-slate-650 uppercase mb-1">CEP</label>
                       <input
                         type="text"
                         id="formulario-cep"
                         value={formData.cep}
                         onChange={handleCepChange}
                         placeholder="00000-000"
                         maxLength={9}
                         className={inputClass}
                       />
                     </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-655 uppercase mb-1">Logradouro</label>
                      <input
                        type="text"
                        id="formulario-logradouro"
                        value={formData.logradouro}
                        onChange={e => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                        placeholder="Nome da rua/avenida"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-650 uppercase mb-1">Número</label>
                      <input
                        type="text"
                        id="formulario-numero"
                        value={formData.numero}
                        onChange={e => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                        placeholder="Nº"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-slate-650 uppercase mb-1">Bairro</label>
                      <input
                        type="text"
                        id="formulario-bairro"
                        value={formData.bairro}
                        onChange={e => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                        placeholder="Nome do bairro"
                        className={inputClass}
                      />
                    </div>
                    <div className="md:col-span-6">
                        <label className="block text-xs font-bold text-slate-650 uppercase mb-1">Ponto de Referência (Opcional)</label>
                        <input 
                          type="text" 
                          value={referencia} 
                          onChange={e => setReferencia(e.target.value)} 
                          placeholder="Ex: Próximo à padaria central, casa de muro azul..." 
                          className={inputClass} 
                        />
                    </div>
                </div>
                
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-slate-800">Geolocalização do Célular</h4>
                    <p className="text-[10px] text-slate-450 font-semibold">Ajude a vistoria enviando as coordenadas GPS exatas.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={obterLocalizacao}
                    disabled={isGettingLocation || geolocalizacao !== null}
                    className="whitespace-nowrap px-4 py-2.5 bg-white border border-emerald-600 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {geolocalizacao ? "📍 Capturado com Sucesso" : (isGettingLocation ? "Capturando..." : "📍 Usar Meu GPS")}
                  </button>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Justificativa / Motivos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {motivosPadrao.map((motivo, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-colors">
                      <input 
                        type="checkbox" 
                        id={`motivo-${index}`} 
                        checked={motivosSelecionados.includes(motivo)}
                        onChange={() => handleMotivoChange(motivo)}
                        className="mt-0.5 w-4.5 h-4.5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500/20 focus:ring-1 cursor-pointer" 
                      />
                      <label htmlFor={`motivo-${index}`} className="text-xs sm:text-sm text-slate-650 font-medium cursor-pointer leading-tight select-none">
                        {motivo}
                      </label>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-150 transition-colors">
                      <input 
                        type="checkbox" 
                        id="motivo-outros" 
                        checked={motivosSelecionados.includes("Outros")}
                        onChange={() => handleMotivoChange("Outros")}
                        className="mt-0.5 w-4.5 h-4.5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500/20 focus:ring-1 cursor-pointer" 
                      />
                      <label htmlFor="motivo-outros" className="text-xs sm:text-sm font-bold text-slate-700 cursor-pointer leading-tight select-none">
                        Outros / Mais Detalhes
                      </label>
                    </div>
                </div>

                {motivosSelecionados.includes("Outros") && (
                  <div className="mt-2 animate-fadeIn">
                    <label htmlFor="outro-motivo-texto" className="block text-xs font-bold text-slate-600 uppercase mb-1">Descreva detalhadamente:</label>
                    <textarea 
                      id="outro-motivo-texto" 
                      rows={4} 
                      value={justificativaOutros}
                      onChange={e => setJustificativaOutros(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-medium text-xs sm:text-sm transition-all resize-none placeholder-slate-400" 
                      placeholder="Explique detalhadamente o problema ou solicitação aqui..."
                    ></textarea>
                  </div>
                )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Termos e Anuências</h3>
                
                {tipoServico === "Solicitação de Supressão (Corte)" && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
                    <input type="checkbox" id="check-compensacao" checked={cienteCompensacao} onChange={e => setCienteCompensacao(e.target.checked)} className="mt-1 w-5 h-5 text-emerald-600 rounded-md border-emerald-300 focus:ring-emerald-500/20 focus:ring-1 cursor-pointer shrink-0" />
                    <label htmlFor="check-compensacao" className="text-xs sm:text-sm text-emerald-900 font-semibold cursor-pointer select-none leading-relaxed">
                      Estou ciente de que a <strong>Supressão (Corte)</strong> exige compensação ambiental obrigatória (plantio de mudas ou doação de espécies nativas ao Viveiro Municipal), nos moldes da Lei Municipal nº 13.031.
                    </label>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="check-alugado" checked={imovelAlugado} onChange={e => setImovelAlugado(e.target.checked)} className="w-4.5 h-4.5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500/20 focus:ring-1 cursor-pointer shrink-0" />
                    <label htmlFor="check-alugado" className="text-xs sm:text-sm text-slate-700 font-bold cursor-pointer select-none">O imóvel relacionado ao serviço é alugado?</label>
                  </div>
                  
                  {imovelAlugado && (
                    <div className="pl-6 pt-3 border-t border-slate-200 mt-2 space-y-4 animate-fadeIn">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" id="check-anuencia" checked={anuenciaProprietario} onChange={e => setAnuenciaProprietario(e.target.checked)} className="mt-1 w-5 h-5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500/20 focus:ring-1 cursor-pointer shrink-0" />
                        <label htmlFor="check-anuencia" className="text-xs sm:text-sm text-slate-750 font-semibold cursor-pointer select-none leading-relaxed">
                          Declaro ter a <strong>autorização assinada pelo proprietário</strong> para efetuar este pedido de intervenção na árvore.
                        </label>
                      </div>

                      {anuenciaProprietario && (
                        <div className="space-y-4 animate-fadeIn">
                          {/* Modelo de Autorização */}
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-amber-600 text-base">📄</span>
                              <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Modelo de Carta de Anuência</h5>
                            </div>
                            <p className="text-[10px] text-amber-700 font-semibold mb-2">Copie, edite, assine e tire uma foto do documento:</p>
                            <div className="bg-white border border-amber-250 rounded-xl p-4 font-mono text-[10px] sm:text-xs text-slate-650 leading-relaxed whitespace-pre-line select-all shadow-inner">{`São José do Rio Preto, [DATA].

Eu, [NOME DO PROPRIETÁRIO], CPF nº [CPF], proprietário do imóvel na [ENDEREÇO DO IMÓVEL], autorizo o locatário [NOME DO INQUILINO] a solicitar junto à Prefeitura a poda/supressão da árvore localizada no imóvel citado.

_________________________________
Assinatura do Proprietário`}</div>
                          </div>

                          {/* Upload do arquivo */}
                          <div>
                            <label className="block text-xs font-bold text-slate-650 uppercase mb-1">
                              Anexar documento de anuência <span className="text-red-500">*</span>
                            </label>
                            {documentoAnuencia ? (
                              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-250 rounded-xl px-4 py-2.5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="text-emerald-600 text-base">✅</span>
                                  <span className="text-xs sm:text-sm text-emerald-800 font-bold truncate max-w-xs">{documentoAnuencia.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDocumentoAnuencia(null)}
                                  className="text-xs text-red-500 hover:text-red-700 font-bold whitespace-nowrap cursor-pointer ml-3"
                                >
                                  Remover
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor="input-documento-anuencia"
                                className="flex flex-col items-center justify-center w-full px-4 py-5 border-2 border-dashed border-amber-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl cursor-pointer transition-all text-center group"
                              >
                                <span className="text-xl mb-1">📎</span>
                                <span className="text-xs font-bold text-slate-600">Selecionar arquivo de anuência</span>
                                <span className="text-[9px] text-slate-400 mt-0.5">JPG, PNG ou PDF de até 10MB</span>
                                <input
                                  id="input-documento-anuencia"
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                      setDocumentoAnuencia(e.target.files[0]);
                                      showToast("Documento de autorização anexado!", "success");
                                    }
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex gap-3 text-red-800">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                            <p className="text-[10px] sm:text-xs font-medium leading-relaxed">
                              <strong>Aviso importante:</strong> O documento será avaliado. O envio de um documento inválido ou que não corresponda à anuência assinada implicará no <strong>indeferimento imediato</strong> da solicitação.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <Camera className="w-4.5 h-4.5 text-emerald-600" /> Fotos da Árvore e Localização
                </h3>
                
                {/* Upload Fotos */}
                <div 
                  onClick={() => setShowPickerModal(true)} 
                  className="mt-1 flex flex-col items-center justify-center px-6 pt-6 pb-7 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-slate-50/50 transition-all text-center group"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors mb-3 border border-slate-200/50">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="flex text-xs text-slate-655 font-bold mb-1">
                    <span className="text-emerald-650 group-hover:text-emerald-700">Adicionar foto da árvore</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Tire uma foto na hora ou selecione de seus arquivos</p>
                </div>

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

                {/* Previews das fotos */}
                {arquivos.length > 0 && (
                  <div className="mt-5 space-y-2.5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fotos Adicionadas ({arquivos.length})</h4>
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
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => setSelectedPreview(fileUrl)} 
                                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => removerArquivo(idx)} 
                                className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
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

              {/* Botão Principal de Confirmação */}
              <button 
                onClick={handleAbrirConfirmacao} 
                disabled={isLoading} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md mt-8 cursor-pointer font-sans"
              >
                Revisar e Enviar Requerimento
              </button>
        </main>

        {/* Modal: Camera / Gallery Selector */}
        {showPickerModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col animate-slideUp">
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
                  <span className="text-[10px] text-slate-500 mt-1 font-medium">Escolher do celular</span>
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

        {/* Modal: Fullscreen Preview */}
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

        {/* Modal: Webcam capture stream */}
        {isCameraActive && (
          <div className="fixed inset-0 bg-slate-950/98 z-55 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl bg-black flex flex-col items-center">
              <div className="relative w-full aspect-[3/4] bg-slate-900 flex items-center justify-center">
                <video 
                  ref={videoRef}
                  id="webcam-video"
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-6 border border-dashed border-white/20 rounded-2xl pointer-events-none"></div>
              </div>
              
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
                
                <div className="w-[72px]"></div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn font-sans">
            <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200 animate-scaleIn">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Confirme seus dados</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">Revise as informações antes de enviar</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowConfirmModal(false)} 
                  className="text-slate-400 hover:text-slate-650 p-1.5 rounded-lg hover:bg-slate-200/50 transition-all cursor-pointer"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Conteúdo com scroll */}
              <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
                
                {/* Tipo de serviço e área */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tipo de Serviço</span>
                    <span className="font-bold text-slate-800 leading-tight">{tipoServico}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tipo de Área</span>
                    <span className="font-bold text-slate-800 leading-tight">{tipoArea}</span>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                    <Map className="w-4 h-4 text-emerald-650" /> Endereço do Serviço
                  </h4>
                  <div className="pl-5 space-y-1">
                    <p className="font-semibold text-slate-800">
                      {formData.logradouro}, {formData.numero}
                    </p>
                    <p className="text-slate-600 font-medium">
                      Bairro: {formData.bairro} — CEP: {formData.cep || "Não informado"}
                    </p>
                    {referencia && (
                      <p className="text-slate-500 text-xs font-semibold italic">
                        Ref: {referencia}
                      </p>
                    )}
                    <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100/80">
                      <span>📍 GPS:</span> 
                      {geolocalizacao ? (
                        <span className="text-emerald-700 font-bold">Coordenadas capturadas ({geolocalizacao.lat.toFixed(6)}, {geolocalizacao.lng.toFixed(6)})</span>
                      ) : (
                        <span className="text-slate-500">Não capturado (será estimado pelo endereço)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Justificativa e Motivos */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-emerald-650" /> Motivos & Justificativa
                  </h4>
                  <div className="pl-5 space-y-2">
                    {motivosSelecionados.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {motivosSelecionados.map((mot, i) => (
                          <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] font-bold">
                            {mot}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-500 font-bold text-xs">Nenhum motivo selecionado</p>
                    )}
                    {motivosSelecionados.includes("Outros") && justificativaOutros && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-650 leading-relaxed italic">
                        "{justificativaOutros}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Documentos e Anexos */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-655" /> Documentos e Fotos
                  </h4>
                  <div className="pl-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📸</span>
                      <span className="font-semibold text-slate-700">
                        {arquivos.length === 0 ? (
                          <span className="text-amber-600 font-bold">Nenhuma foto adicionada (Opcional, mas recomendado)</span>
                        ) : (
                          `${arquivos.length} foto(s) selecionada(s) para envio`
                        )}
                      </span>
                    </div>

                    {imovelAlugado && (
                      <div className="flex items-center gap-2">
                        <span className="text-base">📄</span>
                        <span className="font-semibold text-slate-700">
                          Imóvel Alugado — Autorização do proprietário:{" "}
                          {documentoAnuencia ? (
                            <span className="text-emerald-700 font-bold">Anexada ({documentoAnuencia.name})</span>
                          ) : (
                            <span className="text-red-600 font-bold">Não anexada</span>
                          )}
                        </span>
                      </div>
                    )}

                    {tipoServico === "Solicitação de Supressão (Corte)" && (
                      <div className="flex items-center gap-2">
                        <span className="text-base">🌳</span>
                        <span className="font-semibold text-slate-700">
                          Compensação Ambiental:{" "}
                          {cienteCompensacao ? (
                            <span className="text-emerald-700 font-bold">Ciente e de acordo</span>
                          ) : (
                            <span className="text-red-650 font-bold">Não aceito</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aviso final */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-900">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-650 mt-0.5" />
                  <p className="text-[11px] sm:text-xs font-semibold leading-relaxed">
                    Certifique-se de que todas as informações acima estão corretas. Uma vez enviado, o pedido será analisado pela equipe da Secretaria de Meio Ambiente.
                  </p>
                </div>

              </div>

              {/* Rodapé com botões de ação */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Voltar e Editar
                </button>
                <button
                  type="button"
                  onClick={enviarSolicitacao}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    "Confirmar e Enviar"
                  )}
                </button>
              </div>

            </div>
          </div>
        )}
    </section>
  );
}
