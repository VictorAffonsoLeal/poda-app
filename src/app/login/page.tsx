"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const efetuarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && senha) {
      setIsLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, senha);
        router.push("/");
      } catch (error: any) {
        console.error("Erro ao fazer login:", error);
        alert("Falha no login. Verifique seu e-mail e senha.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loginGovBr = () => {
    // Simular login gov.br e redirecionar
    router.push("/");
  };

  return (
    <div id="aplicativo-container" className="min-h-screen flex flex-col items-center p-4 py-8 sm:justify-center">
      <section id="tela-login" className="w-full max-w-sm mx-auto flex flex-col items-center justify-center">
        <header className="text-center mb-6">
            <img src="/logo-rp.png" alt="Logo Prefeitura de Rio Preto" className="h-28 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-700">Bem-vindo!</h1>
            <p className="text-slate-500">Acesse sua conta para continuar</p>
        </header>

        <Link href="/orientacoes" className="w-full bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm mb-6 flex items-start gap-3 hover:bg-blue-100 transition-colors">
          <div className="text-2xl mt-1">📚</div>
          <div>
            <h3 className="text-blue-800 font-bold">Manual de Poda e Supressão</h3>
            <p className="text-blue-600 text-xs mt-1">Leia as regras oficiais da prefeitura antes de podar uma árvore e evite multas.</p>
          </div>
        </Link>
        
        <main className="w-full bg-white p-8 rounded-xl shadow-lg">
            <form onSubmit={efetuarLogin} className="space-y-4">
                <div>
                    <label htmlFor="email-login" className="block text-sm font-medium text-slate-600">E-mail</label>
                    <input 
                      type="email" 
                      id="email-login" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm" 
                      placeholder="seu@email.com" 
                      required
                    />
                </div>
                <div>
                    <div className="flex justify-between">
                        <label htmlFor="senha-login" className="block text-sm font-medium text-slate-600">Senha</label>
                        <Link href="/recuperar-senha" className="text-sm font-medium text-emerald-600 hover:underline">Esqueci a senha</Link>
                    </div>
                    <div className="relative mt-1">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          id="senha-login" 
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm pr-10" 
                          placeholder="••••••••" 
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
                        >
                            <span id="icone-senha-login">👁️</span>
                        </button>
                    </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-md hover:bg-emerald-700 font-semibold disabled:opacity-50">
                  {isLoading ? "Acessando..." : "Acessar"}
                </button>
                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-sm">OU</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <button type="button" onClick={loginGovBr} className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 font-bold flex items-center justify-center gap-2">
                    <img src="https://logodownload.org/wp-content/uploads/2021/01/gov-br-logo-1.png" className="h-6" alt="Logo Gov.br"/> Entrar com gov.br
                </button>
            </form>
        </main>
        
        <footer className="text-center mt-6">
            <p className="text-sm text-slate-600">Não tem uma conta? <Link href="/cadastro" className="font-medium text-emerald-600 hover:underline">Cadastre-se aqui.</Link></p>
        </footer>
      </section>
    </div>
  );
}
