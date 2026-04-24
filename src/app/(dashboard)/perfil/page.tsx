"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PerfilPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: ""
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        nome: userData.nome || "",
        cpf: userData.cpf || "",
        cep: userData.endereco?.cep || "",
        logradouro: userData.endereco?.logradouro || "",
        numero: userData.endereco?.numero || "",
        bairro: userData.endereco?.bairro || ""
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id.replace('perfil-', '')]: e.target.value });
  };

  const habilitarEdicaoDados = () => {
    setIsEditing(true);
  };

  const salvarDadosPessoais = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const userRef = doc(db, "usuarios", user.uid);
      await updateDoc(userRef, {
        nome: formData.nome,
        cpf: formData.cpf,
        endereco: {
          cep: formData.cep,
          logradouro: formData.logradouro,
          numero: formData.numero,
          bairro: formData.bairro
        }
      });
      setIsEditing(false);
      alert('Dados salvos com sucesso!');
    } catch (e) {
      console.error("Erro ao atualizar os dados: ", e);
      alert("Erro ao salvar os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = isEditing 
    ? "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm" 
    : "mt-1 block w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm";

  return (
    <section id="tela-meus-dados" className="w-full max-w-2xl mx-auto flex flex-col">
        <header className="w-full flex items-center mb-6 justify-between">
          <div className="flex items-center">
              <button onClick={() => router.push("/")} className="text-slate-500 hover:text-emerald-600 mr-4">← Voltar</button>
              <h1 className="text-2xl font-bold text-slate-700">Meus Dados</h1>
          </div>
          {!isEditing ? (
            <button id="botao-editar-dados" onClick={habilitarEdicaoDados} className="bg-slate-200 text-slate-700 py-2 px-4 rounded-md hover:bg-slate-300 font-semibold text-sm">Editar</button>
          ) : (
            <button id="botao-salvar-dados" onClick={salvarDadosPessoais} className="bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 font-semibold text-sm">Salvar</button>
          )}
        </header>
        <main className="w-full bg-white p-8 rounded-xl shadow-lg space-y-4">
          <fieldset id="fieldset-dados-pessoais" disabled={!isEditing}>
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2">Dados Pessoais</h3>
              <div>
                  <label htmlFor="perfil-nome" className="block text-sm font-medium text-slate-600">Nome Completo</label>
                  <input type="text" id="perfil-nome" value={formData.nome} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                  <label htmlFor="perfil-cpf" className="block text-sm font-medium text-slate-600">CPF / CNPJ</label>
                  <input type="text" id="perfil-cpf" value={formData.cpf} onChange={handleChange} className={inputClass} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 pt-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                      <label htmlFor="perfil-cep" className="block text-sm font-medium text-slate-600">CEP</label>
                      <input type="text" id="perfil-cep" value={formData.cep} onChange={handleChange} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                      <label htmlFor="perfil-logradouro" className="block text-sm font-medium text-slate-600">Logradouro</label>
                      <input type="text" id="perfil-logradouro" value={formData.logradouro} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                      <label htmlFor="perfil-numero" className="block text-sm font-medium text-slate-600">Número</label>
                      <input type="text" id="perfil-numero" value={formData.numero} onChange={handleChange} className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                      <label htmlFor="perfil-bairro" className="block text-sm font-medium text-slate-600">Bairro</label>
                      <input type="text" id="perfil-bairro" value={formData.bairro} onChange={handleChange} className={inputClass} />
                  </div>
              </div>
          </fieldset>
        </main>
    </section>
  );
}
