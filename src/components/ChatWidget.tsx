"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection, doc, setDoc, addDoc, onSnapshot,
  query, orderBy, updateDoc, getDoc, serverTimestamp, increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";

const isBusinessHours = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 6=Sab
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 17;
};

export default function ChatWidget() {
  const { user, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializa o chat e escuta mensagens
  useEffect(() => {
    if (!user) return;

    const chatRef = doc(db, "chats", user.uid);

    const initChat = async () => {
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        const firstName = userData?.nome?.split(" ")[0] || "";
        await setDoc(chatRef, {
          userId: user.uid,
          userName: userData?.nome || user.displayName || "Cidadão",
          userEmail: user.email || "",
          status: "aberto",
          ultimaMensagem: "Bem-vindo ao atendimento!",
          ultimaAt: serverTimestamp(),
          naoLidoAdmin: 0,
          naoLidoUser: 0,
          createdAt: serverTimestamp(),
        });

        await addDoc(collection(db, "chats", user.uid, "mensagens"), {
          conteudo: `Olá${firstName ? ", " + firstName : ""}! 👋 Seja bem-vindo ao atendimento do Sistema de Poda de Árvores de São José do Rio Preto. Nossa equipe está pronta para ajudar com suas dúvidas. Responderemos em breve!`,
          remetente: "admin",
          timestamp: serverTimestamp(),
          lida: false,
        });
      }
      setInitialized(true);
    };

    initChat();

    const msgsRef = collection(db, "chats", user.uid, "mensagens");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMensagens(msgs);
      const unread = msgs.filter((m) => m.remetente === "admin" && !m.lida).length;
      setUnreadCount(unread);
    });

    return () => unsub();
  }, [user, userData]);

  // Scroll ao final quando chegar nova mensagem
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [mensagens, isOpen]);

  // Marca como lidas quando abre
  useEffect(() => {
    if (!isOpen || !user || mensagens.length === 0) return;

    const unread = mensagens.filter((m) => m.remetente === "admin" && !m.lida);
    if (unread.length === 0) return;

    unread.forEach(async (m) => {
      try {
        await updateDoc(doc(db, "chats", user.uid, "mensagens", m.id), { lida: true });
      } catch (_) {}
    });

    try {
      updateDoc(doc(db, "chats", user.uid), { naoLidoUser: 0 });
    } catch (_) {}

    setUnreadCount(0);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const enviarMensagem = async () => {
    if (!texto.trim() || !user || isSending) return;

    setIsSending(true);
    const msg = texto.trim();
    setTexto("");

    try {
      await addDoc(collection(db, "chats", user.uid, "mensagens"), {
        conteudo: msg,
        remetente: "user",
        timestamp: serverTimestamp(),
        lida: false,
      });

      await updateDoc(doc(db, "chats", user.uid), {
        ultimaMensagem: msg,
        ultimaAt: serverTimestamp(),
        naoLidoAdmin: increment(1),
      });
    } catch (e) {
      console.error("Erro ao enviar mensagem:", e);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Painel de Chat */}
      <div
        className={`fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto max-h-[70vh]"
            : "opacity-0 scale-95 pointer-events-none max-h-0"
        }`}
        style={{ maxHeight: isOpen ? "70vh" : 0 }}
      >
        {/* Header */}
        <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 border-2 border-emerald-400 flex items-center justify-center text-lg shadow-inner">
              🌿
            </div>
            <div>
              <h3 className="text-white font-bold text-sm leading-none">Atendimento</h3>
              <p className="text-emerald-200 text-[10px] mt-0.5">
                {isBusinessHours() ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full inline-block animate-pulse" />
                    Online agora
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-300 rounded-full inline-block" />
                    Fora do horário
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Aviso de horário */}
        {!isBusinessHours() && (
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 shrink-0">
            <p className="text-xs text-amber-700">
              ⏰ Atendimento seg–sex, das 8h às 17h. Sua mensagem será respondida no próximo dia útil.
            </p>
          </div>
        )}

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0">
          {mensagens.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-xs text-slate-400">Carregando conversa...</p>
            </div>
          )}
          {mensagens.map((m) => {
            const isUser = m.remetente === "user";
            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-xs">
                    🌿
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white text-slate-700 rounded-bl-sm border border-slate-200"
                  }`}
                >
                  {m.conteudo}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensagem();
              }
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
          />
          <button
            onClick={enviarMensagem}
            disabled={isSending || !texto.trim()}
            className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Abrir atendimento"
        className={`fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
          isOpen ? "rotate-0" : ""
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
