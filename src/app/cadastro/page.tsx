"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/context/ToastContext";

const formatCPFOrCNPJ = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    return digits
      .substring(0, 14)
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
};

const formatCEP = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits
    .substring(0, 8)
    .replace(/^(\d{5})(\d)/, "$1-$2");
};

export default function CadastroPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");

  const buscarCep = async (e?: React.MouseEvent | React.FocusEvent) => {
    if (e) e.preventDefault();
    const cepClean = cep.replace(/\D/g, '');
    if (cepClean.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setLogradouro(data.logradouro);
          setBairro(data.bairro);
        } else {
          showToast("CEP não encontrado.", "warning");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        showToast("Erro ao conectar com o serviço de CEP.", "error");
      }
    }
  };

  const cadastrarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = (document.getElementById('cadastro-nome') as HTMLInputElement).value;
    const cpf = (document.getElementById('cadastro-cpf') as HTMLInputElement).value;
    const email = (document.getElementById('cadastro-email') as HTMLInputElement).value;
    const numero = (document.getElementById('cadastro-numero') as HTMLInputElement).value;
    const senha = (document.getElementById('cadastro-senha') as HTMLInputElement).value;
    const senhaConfirmacao = (document.getElementById('cadastro-senha-confirmacao') as HTMLInputElement).value;

    if (senha !== senhaConfirmacao) {
      showToast("As senhas não coincidem!", "warning");
      return;
    }

    setIsLoading(true);

    try {
      // Busca geolocalização pelo endereço digitado via Nominatim API
      let geolocalizacao = null;
      try {
        const query = `${logradouro}, ${numero}, ${bairro}, São José do Rio Preto, SP`; // Assumindo município padrão
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.length > 0) {
          geolocalizacao = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      } catch (err) {
        console.warn("Erro ao buscar geolocalizacao", err);
      }

      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 2. Salvar os dados complementares no Firestore na coleção "usuarios"
      await setDoc(doc(db, "usuarios", user.uid), {
        nome,
        cpf,
        email,
        endereco: {
          cep,
          logradouro,
          numero,
          bairro
        },
        geolocalizacao,
        createdAt: new Date().toISOString()
      });

      showToast("Conta criada com sucesso!", "success");
      router.push("/");
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      if (error.code === 'auth/email-already-in-use') {
        showToast("Este e-mail já está em uso.", "error");
      } else {
        showToast("Erro ao criar conta. Tente novamente.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="aplicativo-container" className="min-h-screen flex flex-col items-center p-4 py-8 sm:justify-center">
      <section id="tela-cadastro" className="w-full max-w-lg mx-auto flex flex-col items-center justify-center">
          <header className="text-center mb-8">
              <img src="https://www.riopreto.sp.gov.br/wp-content/uploads/2022/01/brasao-colorido-e-texto-prefeitura-SJRP-2021.png" alt="Logo Prefeitura" className="h-24 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-700">Criar Conta</h1>
              <p className="text-slate-500">Preencha os dados para se cadastrar</p>
          </header>
          <main className="w-full bg-white p-8 rounded-xl shadow-lg">
              <form onSubmit={cadastrarUsuario} className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Dados Pessoais</h3>
                  <div>
                      <label htmlFor="cadastro-nome" className="block text-sm font-medium text-slate-600">Nome Completo</label>
                      <input type="text" id="cadastro-nome" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" placeholder="Seu nome completo" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cadastro-cpf" className="block text-sm font-medium text-slate-600">CPF / CNPJ</label>
                        <input 
                          type="text" 
                          id="cadastro-cpf" 
                          value={cpf} 
                          onChange={e => setCpf(formatCPFOrCNPJ(e.target.value))} 
                          maxLength={18} 
                          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" 
                          placeholder="000.000.000-00" 
                          required 
                        />
                    </div>
                    <div>
                        <label htmlFor="cadastro-email" className="block text-sm font-medium text-slate-600">E-mail</label>
                        <input type="email" id="cadastro-email" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" placeholder="seu@email.com" required />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 pt-4">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="md:col-span-1">
                          <label htmlFor="cadastro-cep" className="block text-sm font-medium text-slate-600">CEP</label>
                          <input 
                            type="text" 
                            id="cadastro-cep" 
                            value={cep} 
                            onChange={e => setCep(formatCEP(e.target.value))} 
                            onBlur={buscarCep} 
                            placeholder="15000-000" 
                            maxLength={9} 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" 
                            required 
                          />
                      </div>
                      <div className="md:col-span-2">
                          <button type="button" onClick={buscarCep} className="w-full bg-slate-200 text-slate-700 py-2 px-4 rounded-md hover:bg-slate-300 font-semibold text-sm">Buscar Endereço</button>
                      </div>
                      <div className="md:col-span-3">
                          <label htmlFor="cadastro-logradouro" className="block text-sm font-medium text-slate-600">Logradouro</label>
                          <input 
                            type="text" 
                            id="cadastro-logradouro" 
                            value={logradouro} 
                            onChange={(e) => setLogradouro(e.target.value)} 
                            placeholder="Nome da rua/avenida" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" 
                            required 
                          />
                      </div>
                      <div>
                          <label htmlFor="cadastro-numero" className="block text-sm font-medium text-slate-600">Número</label>
                          <input type="text" id="cadastro-numero" placeholder="123" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" required />
                      </div>
                      <div className="md:col-span-2">
                          <label htmlFor="cadastro-bairro" className="block text-sm font-medium text-slate-600">Bairro</label>
                          <input 
                            type="text" 
                            id="cadastro-bairro" 
                            value={bairro} 
                            onChange={(e) => setBairro(e.target.value)} 
                            placeholder="Nome do bairro" 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" 
                            required 
                          />
                      </div>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 pt-4">Segurança</h3>
                  <div>
                      <label htmlFor="cadastro-senha" className="block text-sm font-medium text-slate-600">Senha</label>
                      <div className="relative mt-1">
                          <input type={showPassword ? "text" : "password"} id="cadastro-senha" className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm pr-10" placeholder="Crie uma senha forte" required />
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"><span id="icone-senha-cadastro">👁️</span></button>
                      </div>
                  </div>
                  <div>
                      <label htmlFor="cadastro-senha-confirmacao" className="block text-sm font-medium text-slate-600">Confirmar Senha</label>
                      <div className="relative mt-1">
                         <input type={showConfirmPassword ? "text" : "password"} id="cadastro-senha-confirmacao" className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm pr-10" placeholder="Repita a senha" required />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"><span id="icone-senha-confirmacao">👁️</span></button>
                      </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-md hover:bg-emerald-700 font-semibold mt-6 disabled:opacity-50">
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </button>
              </form>
          </main>
          <footer className="text-center mt-6">
              <p className="text-sm text-slate-600">Já tem uma conta? <Link href="/login" className="font-medium text-emerald-600 hover:underline">Acesse aqui.</Link></p>
          </footer>
      </section>
    </div>
  );
}
