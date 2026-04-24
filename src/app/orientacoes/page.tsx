"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertTriangle, Info, Scissors, ShieldAlert } from "lucide-react";

export default function OrientacoesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header Público */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-emerald-200 hover:text-white transition-colors bg-emerald-900/50 p-2 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Manual de Boas Práticas</h1>
              <p className="text-emerald-200 text-sm">Guia oficial da prefeitura para poda e supressão.</p>
            </div>
          </div>
          <div className="hidden sm:block text-5xl">🌳</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Intro */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-start gap-4">
            <Info className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Por que seguir o manual?</h2>
              <p className="text-slate-600 leading-relaxed">
                As árvores urbanas são patrimônio ambiental da cidade. Elas reduzem o calor, filtram a poluição e abrigam a fauna. Qualquer intervenção (poda ou corte) mal executada pode matar a árvore, causar quedas sobre a rede elétrica e resultar em <strong>multas ambientais gravíssimas</strong> para o cidadão.
              </p>
            </div>
          </div>
        </section>

        {/* Poda */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
            <Scissors className="w-6 h-6 text-emerald-600" /> Regras para Poda
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=800" alt="Poda correta" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-bold text-emerald-800 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> O que é PERMITIDO (Poda Limpa)
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                  <li>Remoção de galhos secos, doentes ou podres.</li>
                  <li>Poda de elevação (tirar galhos muito baixos que atrapalham pedestres).</li>
                  <li>Poda de limpeza (retirar galhos que cruzam e raspam uns nos outros).</li>
                  <li>Corte sempre na base do galho (no "colar"), sem deixar tocos.</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1622322300063-e38f121d1d80?auto=format&fit=crop&q=80&w=800" alt="Poda drástica proibida" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> O que é PROIBIDO (Poda Drástica)
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                  <li>Retirar mais de 30% do volume total de folhas da árvore.</li>
                  <li>"Corte em V" no meio da copa (deixa a árvore vulnerável a cupins).</li>
                  <li>Cortar o tronco principal ("descopar" a árvore).</li>
                  <li>Deixar a árvore parecendo um "poste". <strong>Isso gera multa!</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Supressão */}
        <section className="space-y-4 pt-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
            <ShieldAlert className="w-6 h-6 text-orange-600" /> Regras para Supressão (Corte Total)
          </h2>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-slate-600 mb-4">A supressão é o último recurso e <strong>SÓ PODE SER FEITA COM AUTORIZAÇÃO PRÉVIA DA PREFEITURA</strong>. O cidadão que cortar uma árvore sem o protocolo aprovado responderá por crime ambiental.</p>
            
            <h3 className="font-bold text-slate-800 mb-3">Quando a prefeitura autoriza o corte?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>Risco iminente de queda (laudo da Defesa Civil ou Bombeiros).</span>
              </div>
              <div className="flex gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>Árvore morta ou com doença irreversível (laudo do engenheiro agrônomo).</span>
              </div>
              <div className="flex gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>Danos graves ao imóvel (rachaduras estruturais comprovadas). Não vale para "sujeira de folhas".</span>
              </div>
              <div className="flex gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                <span>Interferência em obras autorizadas (neste caso, há compensação ambiental obrigatória).</span>
              </div>
            </div>
          </div>
        </section>

        {/* Áreas Públicas vs Particulares */}
        <section className="bg-slate-800 text-white p-8 rounded-2xl shadow-lg mt-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
          <h2 className="text-2xl font-bold mb-4">De quem é a responsabilidade?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold text-emerald-400 mb-2">Áreas Públicas (Calçadas e Praças)</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">A execução da poda é de responsabilidade exclusiva da Prefeitura ou de empresas por ela escaladas. O cidadão <strong>não pode</strong> contratar alguém para podar a árvore da calçada sem abrir um chamado e obter a "OS" (Ordem de Serviço) aprovada.</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400 mb-2">Áreas Particulares (Dentro do Quintal)</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-4">A execução é de responsabilidade do morador/proprietário. O cidadão deve abrir o chamado para obter a autorização. Com o "De Acordo" da prefeitura, ele deverá acessar o painel de <strong>Podadores Autorizados</strong> e contratar a execução por conta própria.</p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <Link href="/cadastro" className="inline-block bg-emerald-500 text-white font-bold py-3 px-8 rounded-full hover:bg-emerald-400 transition-colors shadow-lg">
              Criar Conta e Abrir Solicitação
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
