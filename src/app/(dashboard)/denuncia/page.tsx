"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, setDoc, doc, query, where, getDocs, orderBy, limit, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  MapPin, 
  AlertCircle
} from "lucide-react";

const getUploadUrl = () => {
  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal && process.env.NEXT_PUBLIC_UPLOAD_URL) {
      return process.env.NEXT_PUBLIC_UPLOAD_URL;
    }
  }
  return "https://poda-app.nivl.com.br/api/upload.php";
};

export default function DenunciaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  const [tipoOcorrencia, setTipoOcorrencia] = useState("Poda Drástica / Irregular");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [referencia, setReferencia] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anonima, setAnonima] = useState(true);

  const [arquivos, setArquivos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geolocalizacao, setGeolocalizacao] = useState<{lat: number, lng: number} | null>(null);

  // Camera settings
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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
            const file = new File([blob], `denuncia-foto-${Date.now()}.jpg`, { type: "image/jpeg" });
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
          showToast("Localização GPS capturada com sucesso!", "success");
        },
        (error) => {
          console.error(error);
          showToast("Não foi possível obter sua localização. Verifique as permissões de GPS.", "error");
          setIsGettingLocation(false);
        }
      );
    } else {
      showToast("Geolocalização não é suportada por este dispositivo.", "warning");
      setIsGettingLocation(false);
    }
  };

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
          setLogradouro(data.logradouro || "");
          setBairro(data.bairro || "");
        } else {
          showToast("CEP não encontrado. Digite o endereço manualmente.", "warning");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        showToast("Erro ao conectar com o serviço de CEP.", "error");
      }
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    if (formatted.replace(/\D/g, "").length === 8) {
      buscarCep(formatted);
    }
  };

  const handleEnviarDenuncia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Você precisa estar autenticado para registrar uma denúncia.", "error");
      return;
    }

    if (!logradouro.trim() || !numero.trim() || !bairro.trim()) {
      showToast("Por favor, preencha todos os campos obrigatórios do endereço (Logradouro, Número e Bairro).", "warning");
      return;
    }

    if (arquivos.length === 0) {
      showToast("Para enviar uma denúncia ambiental, é obrigatório anexar pelo menos 1 foto como prova física.", "error");
      return;
    }

    if (!descricao.trim()) {
      showToast("Por favor, descreva detalhadamente a ocorrência.", "warning");
      return;
    }

    setIsLoading(true);

    try {
      const fullAddress = `${logradouro}, ${numero} - ${bairro}`;

      // Upload das fotos
      const urls: string[] = [];
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
          showToast("Algumas imagens não foram salvas: " + dataUpload.errors.join(", "), "warning");
        }
      } catch (error) {
        console.error("Erro no upload das imagens:", error);
        showToast("Falha ao enviar fotos ao servidor de arquivos.", "error");
        setIsLoading(false);
        return;
      }

      if (urls.length === 0) {
        showToast("Não foi possível enviar as fotos. A denúncia requer pelo menos 1 foto válida.", "error");
        setIsLoading(false);
        return;
      }

      // Geolocalizacao fallback via Nominatim
      let finalGeo = geolocalizacao;
      if (!finalGeo && logradouro) {
        try {
          const queryGeocod = `${logradouro}, ${numero}, ${bairro}, São José do Rio Preto, SP`;
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryGeocod)}`);
          const data = await res.json();
          if (data && data.length > 0) {
            finalGeo = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          }
        } catch(e) {}
      }

      // Preparar dados no mesmo formato de solicitações
      const denunciaData = {
        userId: user.uid,
        type: `Denúncia: ${tipoOcorrencia}`,
        isDenuncia: true,
        anonima,
        address: fullAddress,
        cep: cep || "Não informado",
        referencia: referencia || null,
        tipoArea: "Particular / Outros", // denúncias geralmente cobrem qualquer área de infração
        risco: tipoOcorrencia === "Árvore em situação de risco de queda" ? "Alto risco relatado por denúncia" : "Nenhum risco aparente",
        treeId: null,
        geolocalizacao: finalGeo,
        fotos: urls,
        status: "Criado",
        createdAt: serverTimestamp(),
        historico: [
          {
            data: new Date().toLocaleDateString('pt-BR'),
            status: "Criado",
            descricao: `Denúncia registrada pelo cidadão. Relato: ${descricao}`
          }
        ]
      };

      // Gerar Protocolo ID Sequencial aaaammxxxxxxxx
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, "0");
      const prefixo = `${ano}${mes}`;
      
      const startRange = `${ano}0000000000`;
      const endRange = `${ano}9999999999`;

      const q = query(
        collection(db, "solicitacoes"),
        where(documentId(), ">=", startRange),
        where(documentId(), "<=", endRange),
        orderBy(documentId(), "desc"),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      let proximoNumero = 1;
      if (!querySnapshot.empty) {
        const ultimoId = querySnapshot.docs[0].id;
        const sequenciaStr = ultimoId.substring(6);
        const ultimaSequencia = parseInt(sequenciaStr, 10);
        if (!isNaN(ultimaSequencia)) {
          proximoNumero = ultimaSequencia + 1;
        }
      }

      const sequenciaFormatada = String(proximoNumero).padStart(8, "0");
      const novoProtocoloId = `${prefixo}${sequenciaFormatada}`;

      const docRef = doc(db, "solicitacoes", novoProtocoloId);
      await setDoc(docRef, denunciaData);

      showToast(`Denúncia registrada com sucesso! Protocolo: #${novoProtocoloId}`, "success", 6000);
      router.push("/solicitacoes");

    } catch (error) {
      console.error("Erro ao salvar denúncia no Firestore:", error);
      showToast("Ocorreu um erro ao salvar a denúncia. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const selectClass = "w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-semibold text-xs sm:text-sm transition-all";
  const inputClass = "w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-medium text-xs sm:text-sm transition-all placeholder-slate-400";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-bold text-emerald-800 animate-pulse flex items-center gap-2">
          <span>🌳</span> Carregando...
        </div>
      </div>
    );
  }

  return (
    <section id="tela-formulario-denuncia" className="w-full max-w-2xl mx-auto flex flex-col animate-fadeIn pb-12">
      <header className="w-full flex items-center mb-6 border-b border-slate-200 pb-4">
        <button 
          onClick={() => router.push("/")} 
          className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-200/50 rounded-lg flex items-center justify-center mr-1 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-700">Relatar Denúncia Ambiental</h1>
          <p className="text-[10px] sm:text-xs text-slate-500 font-semibold">Canal de ouvidoria para podas drásticas, cortes ilegais ou riscos eminentes</p>
        </div>
      </header>

      <main className="w-full bg-white p-5 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
        
        {/* Warning Box */}
        <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl flex gap-3 text-rose-850">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 font-medium leading-relaxed">
            <h4 className="font-extrabold text-rose-900">Uso do Canal de Denúncias</h4>
            <p>Este espaço é reservado para relatar <strong>infrações ambientais em andamento ou já ocorridas em outras residências</strong>. Para solicitar podas da sua própria árvore, utilize o menu "Nova Solicitação" na tela inicial.</p>
          </div>
        </div>

        <form onSubmit={handleEnviarDenuncia} className="space-y-6">
          
          {/* Tipo de Ocorrência */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1">
              <span>1.</span> Tipo de Ocorrência
            </h3>
            <select 
              value={tipoOcorrencia} 
              onChange={e => setTipoOcorrencia(e.target.value)} 
              className={selectClass}
            >
              <option value="Poda Drástica / Irregular">Poda Drástica / Irregular (Corte excessivo de copa)</option>
              <option value="Supressão (Corte) não autorizada">Supressão (Corte) não autorizada de árvore</option>
              <option value="Corte mal feito / Injúria de tronco">Corte mal feito / Injúria de tronco ou raízes</option>
              <option value="Árvore em situação de risco de queda">Árvore em situação de risco de queda (Galho pesado/Inclinada)</option>
              <option value="Outros">Outras irregularidades ambientais</option>
            </select>
          </div>

          {/* Endereço */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1">
              <span>2.</span> Local da Ocorrência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">CEP</label>
                <input
                  type="text"
                  value={cep}
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Logradouro *</label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={e => setLogradouro(e.target.value)}
                  placeholder="Ex: Rua Silva Jardim"
                  required
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Número *</label>
                <input
                  type="text"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  placeholder="Nº ou S/N"
                  required
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bairro *</label>
                <input
                  type="text"
                  value={bairro}
                  onChange={e => setBairro(e.target.value)}
                  placeholder="Ex: Centro"
                  required
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-6">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ponto de Referência (Opcional)</label>
                <input 
                  type="text" 
                  value={referencia} 
                  onChange={e => setReferencia(e.target.value)} 
                  placeholder="Ex: Em frente ao mercado Silva, árvore na calçada" 
                  className={inputClass} 
                />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-800">Geolocalização GPS</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Se estiver em frente ao local, capture a posição GPS exata da infração.</p>
              </div>
              <button 
                type="button" 
                onClick={obterLocalizacao}
                disabled={isGettingLocation}
                className="whitespace-nowrap px-4 py-2.5 bg-white border border-emerald-600 hover:bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                {geolocalizacao ? "📍 GPS Capturado" : (isGettingLocation ? "Capturando..." : "📍 Capturar Minha Posição")}
              </button>
            </div>
          </div>

          {/* Fotos */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1">
              <span>3.</span> Evidências por Fotos *
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-3">Tire fotos pelo app ou escolha arquivos provando o dano/infração na árvore. Pelo menos 1 foto é obrigatória.</p>

            <div 
              onClick={() => setShowPickerModal(true)} 
              className="flex flex-col items-center justify-center px-6 py-6 pb-7 border-2 border-slate-350 border-dashed rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-slate-50/50 transition-all text-center group"
            >
              <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-650 group-hover:bg-emerald-50 transition-colors mb-3 border border-slate-200/50">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex text-xs text-slate-655 font-bold mb-1">
                <span className="text-emerald-650 group-hover:text-emerald-700">Tirar ou anexar fotos da irregularidade</span>
              </div>
              <p className="text-[10px] text-slate-500">Clique para abrir câmera interna ou galeria</p>
            </div>

            {/* Previews */}
            {arquivos.length > 0 && (
              <div className="mt-5 space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fotos adicionadas ({arquivos.length})</h4>
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
                            className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-505 text-white flex items-center justify-center transition-colors cursor-pointer"
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

          {/* Descrição */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1">
              <span>4.</span> Relato Detalhado *
            </h3>
            <textarea 
              rows={4} 
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-350 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-medium text-xs sm:text-sm transition-all resize-none placeholder-slate-400" 
              placeholder="Explique o que aconteceu. Detalhe se a poda foi feita por empresa privada, se houve corte total do tronco ou se há risco imediato de queda..."
              required
            ></textarea>
          </div>

          {/* Anonimato */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1">
              <span>5.</span> Privacidade e Identificação
            </h3>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="check-anonima" 
                  checked={anonima} 
                  onChange={e => setAnonima(e.target.checked)} 
                  className="w-5 h-5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500/20 focus:ring-1 cursor-pointer shrink-0" 
                />
                <label htmlFor="check-anonima" className="text-xs sm:text-sm text-slate-700 font-bold cursor-pointer select-none leading-tight">
                  Registrar esta denúncia sob sigilo (Denúncia Anônima)
                </label>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed pl-8 font-medium">
                {anonima 
                  ? "Ativado: Seus dados de CPF e e-mail serão protegidos e ocultados no processo municipal. Apenas a Ouvidoria terá acesso para fins de verificação interna."
                  : "Desativado: Seus dados cadastrais constarão no cabeçalho público da fiscalização."}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" /> Registrando Denúncia...
              </>
            ) : (
              "Protocolar Denúncia Ambiental"
            )}
          </button>
        </form>
      </main>

      {/* Modal Picker */}
      {showPickerModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col animate-slideUp">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">Adicionar Evidência</h3>
              <button 
                type="button"
                onClick={() => setShowPickerModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-all cursor-pointer"
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
                onClick={() => document.getElementById("input-galeria")?.click()}
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
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {selectedPreview && (
        <div className="fixed inset-0 bg-slate-950/95 z-55 flex flex-col items-center justify-center p-4 animate-fadeIn">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <span className="text-white text-xs font-bold bg-slate-900/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
              Evidência de Denúncia
            </span>
            <button 
              type="button"
              onClick={() => setSelectedPreview(null)} 
              className="text-white bg-slate-900/60 hover:bg-slate-900/85 p-2.5 rounded-full backdrop-blur-sm transition-all cursor-pointer"
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

      {/* Modal Live Camera */}
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
              >
                <div className="w-5 h-5 rounded-full bg-red-500"></div>
              </button>
              
              <div className="w-[72px]"></div>
            </div>
          </div>
        </div>
      )}

      {/* Inputs ocultos */}
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
    </section>
  );
}
