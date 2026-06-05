"use client";

import { useState, useEffect, useRef } from "react";
import { User, Bell, Check, BookOpen, Clock, ArrowRight, CircleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AnimatePresence, motion } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "success" | "error" | "info" | "warning" | "tip";
  link?: string;
}

export default function Header() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Monitorar solicitações em tempo real para gerar notificações dinâmicas
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "solicitacoes"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbNotifications: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const id = doc.id;
        const shortId = id.substring(0, 6);
        const requestType = data.type || "Solicitação";

        // Gerar notificações a partir do histórico
        if (data.historico && data.historico.length > 0) {
          // A última atualização
          const lastEvent = data.historico[0];
          
          let notifType: "success" | "error" | "info" | "warning" = "info";
          if (lastEvent.status === "Aprovado") notifType = "success";
          else if (lastEvent.status === "Recusado") notifType = "error";
          else if (lastEvent.status === "Em Análise") notifType = "warning";

          dbNotifications.push({
            id: `${id}-${lastEvent.status}-${lastEvent.data}`,
            title: `${requestType} #${shortId}`,
            description: `Status atualizado para: ${lastEvent.status}. ${lastEvent.descricao || ""}`,
            timestamp: lastEvent.data,
            read: false, // Será controlado localmente
            type: notifType,
            link: `/solicitacoes/detalhe?id=${id}`,
          });
        }
      });

      // Adicionar notificações estáticas de dicas / sistema
      const staticNotifications: Notification[] = [
        {
          id: "welcome-tip",
          title: "Boas-vindas ao Poda Digital",
          description: "Agora você pode pedir vistorias de poda e supressão de árvores 100% online.",
          timestamp: new Date().toLocaleDateString("pt-BR"),
          read: false,
          type: "tip",
          link: "/orientacoes",
        },
        {
          id: "pruning-rules-tip",
          title: "Evite multas de Poda Drástica",
          description: "Lembre-se: é proibido cortar mais de 25% da copa de uma árvore. Consulte o manual.",
          timestamp: new Date().toLocaleDateString("pt-BR"),
          read: false,
          type: "tip",
          link: "/orientacoes",
        }
      ];

      const allNotifications = [...dbNotifications, ...staticNotifications];

      // Sincronizar estado de "lidas" do localStorage
      const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user.uid}`) || "[]");
      const syncedNotifications = allNotifications.map(notif => ({
        ...notif,
        read: readIds.includes(notif.id)
      }));

      // Ordenar: não lidas primeiro, depois por timestamp/ordem
      setNotifications(syncedNotifications);
    }, (error) => {
      console.error("Erro ao escutar notificações de solicitações:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    if (!user) return;
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!user) return;
    
    // Marcar como lida
    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user.uid}`) || "[]");
    if (!readIds.includes(notif.id)) {
      readIds.push(notif.id);
      localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(readIds));
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );

    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">🌳</div>;
      case "error":
        return <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"><CircleAlert size={16} /></div>;
      case "warning":
        return <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">📋</div>;
      case "tip":
        return <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"><BookOpen size={16} /></div>;
      default:
        return <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">🔔</div>;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center text-white font-bold">
          RP
        </div>
        <h1 className="font-bold text-slate-800 dark:text-slate-100 truncate">Poda Digital</h1>
      </Link>
      
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
        {/* Notificações Bell Wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative flex items-center justify-center cursor-pointer"
          >
            <Bell size={20} className="text-slate-600 dark:text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Dropdown Popover */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Notificações</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} /> Marcar todas como lidas
                    </button>
                  )}
                </div>

                {/* Lista de Notificações */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Nenhuma notificação por enquanto.
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left relative ${
                          !notif.read ? "bg-slate-50/50 dark:bg-slate-800/10" : ""
                        }`}
                      >
                        {!notif.read && (
                          <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        )}
                        <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                        <div className="flex-1 space-y-1">
                          <h4 className={`text-xs font-bold ${!notif.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {notif.description}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={10} />
                            <span>{notif.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer link */}
                <Link
                  href="/notificacoes"
                  onClick={() => setIsOpen(false)}
                  className="block p-3 text-center border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <span className="flex items-center justify-center gap-1">
                    Ver todas as notificações <ArrowRight size={14} />
                  </span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link
          href="/perfil"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
        >
          <User size={20} className="text-slate-600 dark:text-slate-300" />
        </Link>
      </div>
    </header>
  );
}
