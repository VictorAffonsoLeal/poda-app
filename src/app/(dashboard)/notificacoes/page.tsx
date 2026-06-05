"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/context/ToastContext";
import { 
  Bell, 
  Check, 
  Trash2, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  CircleAlert,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "success" | "error" | "info" | "warning" | "tip";
  link?: string;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filtro, setFiltro] = useState<"Todas" | "NaoLidas" | "Lidas">("Todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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

        // Histórico
        if (data.historico && data.historico.length > 0) {
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
            read: false,
            type: notifType,
            link: `/solicitacoes/detalhe?id=${id}`,
          });
        }
      });

      // Notificações estáticas
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

      // Sincronizar estado de "lidas" e "excluídas"
      const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user.uid}`) || "[]");
      const deletedIds = JSON.parse(localStorage.getItem(`deleted_notifications_${user.uid}`) || "[]");

      const filteredNotifications = allNotifications
        .filter(notif => !deletedIds.includes(notif.id))
        .map(notif => ({
          ...notif,
          read: readIds.includes(notif.id)
        }));

      setNotifications(filteredNotifications);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar solicitações:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAllAsRead = () => {
    if (!user) return;
    const allIds = notifications.map((n) => n.id);
    localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(allIds));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("Todas as notificações foram marcadas como lidas.", "success");
  };

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${user.uid}`) || "[]");
    let updatedIds;
    let isRead = false;

    if (readIds.includes(id)) {
      updatedIds = readIds.filter((item: string) => item !== id);
    } else {
      updatedIds = [...readIds, id];
      isRead = true;
    }

    localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(updatedIds));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: isRead } : n))
    );
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const deletedIds = JSON.parse(localStorage.getItem(`deleted_notifications_${user.uid}`) || "[]");
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(`deleted_notifications_${user.uid}`, JSON.stringify(deletedIds));
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast("Notificação excluída.", "info");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <div className="text-xl">🌳</div>;
      case "error":
        return <CircleAlert size={18} className="text-red-500" />;
      case "warning":
        return <div className="text-xl">📋</div>;
      case "tip":
        return <BookOpen size={18} className="text-blue-500" />;
      default:
        return <Bell size={18} className="text-slate-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-l-emerald-500";
      case "error":
        return "border-l-red-500";
      case "warning":
        return "border-l-amber-500";
      case "tip":
        return "border-l-blue-500";
      default:
        return "border-l-slate-400";
    }
  };

  // Filtragem
  const notificacoesFiltradas = notifications.filter((n) => {
    if (filtro === "NaoLidas") return !n.read;
    if (filtro === "Lidas") return n.read;
    return true;
  });

  const filterBtnClass = (active: boolean) => {
    return `px-4 py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
      active
        ? "bg-emerald-600 text-white shadow-sm border border-emerald-600"
        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`;
  };

  if (!user && !loading) {
    return (
      <div className="text-center p-8 text-slate-500">
        Você precisa estar logado para acessar suas notificações.
      </div>
    );
  }

  return (
    <section className="w-full max-w-4xl mx-auto flex flex-col min-h-[60vh]">
      <header className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Central de Notificações</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Acompanhe as novidades e atualizações sobre seus pedidos</p>
          </div>
        </div>
        
        {notifications.filter(n => !n.read).length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="self-start sm:self-center px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-xs font-bold rounded-xl border border-emerald-200/50 dark:border-emerald-800/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} /> Marcar todas como lidas
          </button>
        )}
      </header>

      {/* Barra de Filtros */}
      <div className="flex items-center gap-2 mb-6 justify-start">
        <button onClick={() => setFiltro("Todas")} className={filterBtnClass(filtro === "Todas")}>
          Todas ({notifications.length})
        </button>
        <button onClick={() => setFiltro("NaoLidas")} className={filterBtnClass(filtro === "NaoLidas")}>
          Não Lidas ({notifications.filter((n) => !n.read).length})
        </button>
        <button onClick={() => setFiltro("Lidas")} className={filterBtnClass(filtro === "Lidas")}>
          Lidas ({notifications.filter((n) => n.read).length})
        </button>
      </div>

      <main className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 sm:p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Carregando notificações...
          </div>
        ) : notificacoesFiltradas.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <span className="text-4xl block opacity-60">🔔</span>
            <h3 className="font-bold text-slate-700 dark:text-slate-300">Nenhuma notificação</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Nenhuma notificação encontrada no momento para o filtro selecionado.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {notificacoesFiltradas.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => notif.link && router.push(notif.link)}
                  className={`flex flex-col sm:flex-row items-start justify-between p-5 rounded-2xl border border-slate-100 dark:border-slate-800 border-l-4 ${getBorderColor(
                    notif.type
                  )} ${
                    !notif.read
                      ? "bg-slate-50/40 dark:bg-slate-800/10"
                      : "bg-white dark:bg-slate-900"
                  } hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer gap-4 relative overflow-hidden`}
                >
                  <div className="flex gap-3.5 items-start">
                    <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
                    <div className="space-y-1.5 max-w-xl">
                      <h4 className={`text-sm font-bold flex items-center gap-2 ${
                        !notif.read ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                      }`}>
                        {notif.title}
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {notif.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                        <Clock size={10} />
                        <span>{notif.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => handleToggleRead(notif.id, e)}
                      title={notif.read ? "Marcar como não lida" : "Marcar como lida"}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        notif.read
                          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                      }`}
                    >
                      <Check size={14} className={notif.read ? "opacity-60" : "font-black"} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                      title="Excluir"
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 dark:hover:border-red-900/40 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                    {notif.link && (
                      <ChevronRight size={16} className="text-slate-450 dark:text-slate-500 opacity-60 hidden sm:block" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </section>
  );
}
