"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Camera, 
  ImageIcon, 
  Upload, 
  Trash2, 
  Eye, 
  X, 
  Loader2 
} from "lucide-react";

const getUploadUrl = () => {
  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (isLocal && process.env.NEXT_PUBLIC_UPLOAD_URL) {
      return process.env.NEXT_PUBLIC_UPLOAD_URL;
    }
  }
  return "/api/upload.php";
};

export default function FeedbackPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { showToast } = useToast();

  const [tipo, setTipo] = useState("Sugestão");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const adicionarArquivos = (novosArquivos: File[]) => {
    setArquivos(prev => [...prev, ...novosArquivos]);
    showToast(`${novosArquivos.length} foto(s) anexada(s).`, "success");
    setShowPickerModal(false);
  };

  const removerArquivo = (index: number) => {
    setArquivos(prev => prev.filter((_, i) => i !== index));
    showToast("Anexo removido.", "info");
  };

  const enviarFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assunto.trim() || !mensagem.trim()) {
      showToast("Preencha todos os campos obrigatórios.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const urls: string[] = [];

      // Upload files if any
      if (arquivos.length > 0) {
        const formDataUpload = new FormData();
        if (user) formDataUpload.append("userId", user.uid);
        arquivos.forEach((file) => {
          formDataUpload.append("files[]", file);
        });

        const resUpload = await fetch(getUploadUrl(), {
          method: "POST",
          body: formDataUpload,
        });
        const dataUpload = await resUpload.json();
        if (dataUpload.urls) {
          urls.push(...dataUpload.urls);
        }
      }

      // Save feedback in Firestore
      const feedbackData = {
        tipo,
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        anexos: urls,
        userId: user?.uid || "anonimo",
        userName: userData?.nome || user?.displayName || "Cidadão Identificado",
        userEmail: user?.email || "sem-email@portal.com",
        status: "Novo", // "Novo" | "Lido" | "Respondido"
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "feedbacks"), feedbackData);

      showToast("Feedback enviado com sucesso! Agradecemos sua colaboração.", "success");
      router.push("/");
    } catch (err) {
      console.error("Erro ao enviar feedback:", err);
      showToast("Erro ao enviar feedback. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans w-full">
      <section className="w-full max-w-2xl mx-auto flex flex-col animate-fadeIn">
        
        {/* Header */}
        <header className="w-full flex items-center mb-6 border-b border-slate-200 pb-4">
          <button 
            type="button"
            onClick={() => router.push("/")} 
            className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-200/50 rounded-lg flex items-center justify-center mr-1 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600 shrink-0" />
              Feedbacks e Sugestões
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500">Ajude-nos a melhorar o aplicativo relatando bugs ou sugerindo melhorias</p>
          </div>
        </header>

        {/* Form Body */}
        <main className="w-full bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200/60 space-y-6">
          <form onSubmit={enviarFeedback} className="space-y-5">
            
            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-slate-650 uppercase mb-2">Categoria <span className="text-red-500">*</span></label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-semibold text-xs sm:text-sm transition-all"
              >
                <option value="Sugestão">💡 Sugestão / Melhoria</option>
                <option value="Bug / Erro">🪲 Relatar Bug / Erro de funcionamento</option>
                <option value="Elogio">❤️ Elogio</option>
                <option value="Dúvida">❓ Dúvida sobre o Portal</option>
                <option value="Outros">⚙️ Outros assuntos</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="input-assunto" className="block text-xs font-bold text-slate-650 uppercase mb-2">Assunto <span className="text-red-500">*</span></label>
              <input 
                id="input-assunto"
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                required
                placeholder="Ex: Erro no carregamento de laudos"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-semibold text-xs sm:text-sm transition-all"
              />
            </div>

            {/* Message Body */}
            <div>
              <label htmlFor="input-mensagem" className="block text-xs font-bold text-slate-650 uppercase mb-2">Sua Mensagem <span className="text-red-500">*</span></label>
              <textarea 
                id="input-mensagem"
                rows={5}
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                required
                placeholder="Descreva detalhadamente a sua sugestão ou o problema técnico encontrado..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl text-slate-900 font-medium text-xs sm:text-sm transition-all resize-none"
              ></textarea>
            </div>

            {/* File Upload Screen/Screenshot */}
            <div>
              <label className="block text-xs font-bold text-slate-650 uppercase mb-2">Anexar Print / Imagem (Opcional)</label>
              <div 
                onClick={() => setShowPickerModal(true)} 
                className="flex flex-col items-center justify-center px-6 py-6 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-slate-50/50 transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors mb-2 border border-slate-200/50">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-600 font-semibold mb-0.5">
                  <span className="text-emerald-600 group-hover:text-emerald-700 font-bold">Adicionar imagem</span>
                </div>
                <p className="text-[10px] text-slate-500">Útil para documentar bugs visuais</p>
              </div>

              {/* Previews Grid */}
              {arquivos.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Imagens Anexadas ({arquivos.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {arquivos.map((file, idx) => {
                      const fileUrl = URL.createObjectURL(file);
                      return (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 group">
                          <img src={fileUrl} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading || !assunto.trim() || !mensagem.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer hover:scale-[1.01] transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" /> Enviando Feedback...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Enviar Meu Feedback
                </>
              )}
            </button>

          </form>
        </main>

        {/* Modal: Source selection */}
        {showPickerModal && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl transition-all flex flex-col">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">Anexar Print do Celular</h3>
                <button 
                  type="button"
                  onClick={() => setShowPickerModal(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("input-gallery")?.click();
                  }}
                  className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all text-center cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 mb-3 border border-blue-100/50">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">Escolher Arquivo</span>
                  <span className="text-[10px] text-slate-500 mt-1">Da sua galeria</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    document.getElementById("input-camera-fb")?.click();
                  }}
                  className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/20 group transition-all text-center cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 border border-emerald-100/50">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-800">Tirar Foto</span>
                  <span className="text-[10px] text-slate-500 mt-1">Usar câmera</span>
                </button>
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowPickerModal(false)}
                  className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Fullscreen preview */}
        {selectedPreview && (
          <div className="fixed inset-0 bg-slate-950/95 z-55 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
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
              <img src={selectedPreview} alt="Visualização do print" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            </div>
          </div>
        )}

        {/* Hidden File inputs */}
        <input 
          id="input-gallery" 
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
          id="input-camera-fb" 
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
    </div>
  );
}
