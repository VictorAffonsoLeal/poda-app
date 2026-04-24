"use client";
import React from 'react';
import { Home, PlusCircle, LayoutList, User } from "lucide-react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Início', icon: Home, href: '/' },
    { label: 'Novo', icon: PlusCircle, href: '/nova-solicitacao' },
    { label: 'Pedidos', icon: LayoutList, href: '/solicitacoes' },
    { label: 'Perfil', icon: User, href: '/perfil' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 pb-safe pt-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname !== '/' && item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 p-2">
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-300", 
                isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
