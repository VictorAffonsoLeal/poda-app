"use client";
import React from 'react';
import { Home, PlusCircle, LayoutList, User, LogOut } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

export default function DesktopNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Nova Solicitação', icon: PlusCircle, href: '/nova-solicitacao' },
    { label: 'Meus Pedidos', icon: LayoutList, href: '/solicitacoes' },
    { label: 'Meu Perfil', icon: User, href: '/perfil' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-[calc(100vh-64px)] sticky top-16 left-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 px-4 py-8 z-40">
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname !== '/' && item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              isActive ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm"
            )}>
              <Icon size={20} className={isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
        <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium">
          <LogOut size={20} />
          <span>Sair</span>
        </Link>
      </div>
    </aside>
  );
}
