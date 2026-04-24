"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const recuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        alert("Instruções de recuperação enviadas para o seu e-mail!");
        router.push("/login");
      } catch (error: any) {
        console.error("Erro ao recuperar senha:", error);
        alert("Erro ao enviar e-mail de recuperação. Verifique o endereço digitado.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div id="aplicativo-container" className="min-h-screen flex flex-col items-center p-4 py-8 sm:justify-center">
        <section id="tela-recuperar-senha" className="w-full max-w-sm mx-auto flex flex-col items-center justify-center">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-700">Recuperar Senha</h1>
                <p className="text-slate-500 mt-2">Digite seu e-mail para receber as instruções.</p>
            </header>
            <main className="w-full bg-white p-8 rounded-xl shadow-lg space-y-4">
                <form onSubmit={recuperarSenha}>
                    <div className="mb-4">
                        <label htmlFor="email-recuperacao" className="block text-sm font-medium text-slate-600">E-mail</label>
                        <input 
                          type="email" 
                          id="email-recuperacao" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" 
                          placeholder="seu@email.com" 
                          required 
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-md hover:bg-emerald-700 font-semibold disabled:opacity-50">
                      {isLoading ? "Enviando..." : "Enviar"}
                    </button>
                </form>
            </main>
            <footer className="text-center mt-6">
                <p className="text-sm text-slate-600">Lembrou a senha? <Link href="/login" className="font-medium text-emerald-600 hover:underline">Voltar para o login.</Link></p>
            </footer>
        </section>
    </div>
  );
}
