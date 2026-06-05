"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Scissors, 
  ShieldAlert, 
  Scale, 
  Calculator, 
  Trees, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  X,
  FileText
} from "lucide-react";

export default function OrientacoesPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"poda" | "espaco" | "faq">("poda");
  const [sidewalkWidth, setSidewalkWidth] = useState<string>("2.50");
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({
    0: true // Open first question by default
  });

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Calculadora do Espaço Árvore
  const widthVal = parseFloat(sidewalkWidth.replace(",", "."));
  const isWidthValid = !isNaN(widthVal) && widthVal > 0;
  
  let calcStatus = "";
  let recWidth = 0.70;
  let recLength = 1.40;
  let freeSpace = 1.20;
  let isAccceptable = true;

  if (isWidthValid) {
    if (widthVal < 2.0) {
      calcStatus = "Calçada muito estreita (< 2,00m). O Espaço Árvore não é recomendado pois impediria o trânsito livre de pedestres com acessibilidade (mínimo de 1,20m livre).";
      isAccceptable = false;
      recWidth = 0;
      recLength = 0;
      freeSpace = widthVal;
    } else if (widthVal >= 2.0 && widthVal < 2.10) {
      calcStatus = "Calçada padrão básico. Dimensão mínima obrigatória para o Espaço Árvore de 0,70m x 1,40m.";
      recWidth = 0.70;
      recLength = 1.40;
      freeSpace = widthVal - 0.70;
      if (freeSpace < 1.20) {
        isAccceptable = false;
      }
    } else {
      // 40% da largura da calçada, comprimento é o dobro da largura
      recWidth = parseFloat((widthVal * 0.40).toFixed(2));
      recLength = parseFloat((recWidth * 2).toFixed(2));
      freeSpace = parseFloat((widthVal - recWidth).toFixed(2));
      calcStatus = `Calçada ampla (≥ 2,10m). Aplica-se a proporção de 40% da largura para o canteiro e o dobro para o comprimento.`;
      if (freeSpace < 1.20) {
        isAccceptable = false;
      }
    }
  }

  const faqItems = [
    {
      q: "Como devo proceder se precisar podar ou suprimir minha árvore?",
      a: "O primeiro passo é pedir autorização para a Secretaria Municipal do Meio Ambiente e Urbanismo, no Poupatempo, Ganha Tempo, ou pelo portal da Prefeitura (somente para poda). Em caso de supressão (corte total da árvore), somente o proprietário do imóvel ou responsável legal deve entrar com o requerimento. Importante: em caso de supressão autorizada, uma nova árvore deverá ser plantada no padrão Espaço Árvore."
    },
    {
      q: "O que acontece se eu não pedir autorização?",
      a: "De acordo com o Plano Diretor de Arborização Urbana, Lei nº 13.031 de 26/09/2018, as podas e supressões sem autorização, assim como as podas drásticas, podem acarretar multa ao munícipe. A Secretaria Municipal de Serviços Gerais mantém uma equipe de fiscalização em toda a extensão da cidade identificando e multando podas e erradicações irregulares."
    },
    {
      q: "Como posso denunciar as podas e erradicações irregulares?",
      a: "Fazendo denúncia pelo telefone 3212-1388, e-mail smserv.fiscalizacao@riopreto.sp.gov.br ou pessoalmente na Secretaria de Serviços Gerais."
    },
    {
      q: "E quem pode realizar o serviço?",
      a: "É recomendado que sejam contratados apenas podadores capacitados e habilitados pela Secretaria Municipal de Meio Ambiente e Urbanismo, que disponibiliza uma relação completa destes podadores no portal da Prefeitura: www.riopreto.sp.gov.br"
    },
    {
      q: "Como posso identificar o podador?",
      a: "Os podadores cadastrados passaram por treinamento da Secretaria Municipal do Meio Ambiente e Urbanismo e receberam documento de identificação que comprova que estão capacitados e trabalham seguindo a lei."
    },
    {
      q: "E onde descarto os galhos podados?",
      a: "A Prefeitura tem vários Pontos de Apoio pela cidade que recebem até uma caçamba (cerca de 1m³) de galhos. Para saber qual o mais próximo de sua residência, consulte a lista de locais no portal da Prefeitura: www.riopreto.sp.gov.br/pontodeapoio. A destinação de galhos em locais inadequados está sujeita a multa."
    },
    {
      q: "Mas, e se eu não puder levar os galhos, como faço?",
      a: "Após realizar o pedido de autorização de poda ou supressão, entre em contato com a Secretaria Municipal de Serviços Gerais pelo telefone 3227-8024 e informe o seu protocolo, quando estiver autorizado, agendando seu serviço."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      
      {/* Dynamic Gradient Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              id="back-home-btn"
              className="text-emerald-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-xl border border-white/10 shadow-inner flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Lei Nº 13.031/2018
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Dec. 18.301/2019
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">Legislação e Penalização</h1>
              <p className="text-emerald-200/90 text-sm font-medium mt-0.5">
                Secretaria Municipal de Meio Ambiente e Urbanismo - São José do Rio Preto
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/10 p-3 rounded-2xl">
            <span className="text-4xl">🌳</span>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Cidade Verde</p>
              <p className="text-xs text-white font-semibold">Arborização Inteligente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 mt-8">

        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-300/40 mb-8 max-w-2xl mx-auto shadow-inner">
          <button
            id="tab-poda"
            onClick={() => setActiveTab("poda")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === "poda"
                ? "bg-white text-emerald-800 shadow-md transform scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/30"
            }`}
          >
            <Scissors className="w-4 h-4" />
            Poda & Corte
          </button>
          <button
            id="tab-espaco"
            onClick={() => setActiveTab("espaco")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === "espaco"
                ? "bg-white text-emerald-800 shadow-md transform scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/30"
            }`}
          >
            <Trees className="w-4 h-4" />
            Espaço Árvore
          </button>
          <button
            id="tab-faq"
            onClick={() => setActiveTab("faq")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === "faq"
                ? "bg-white text-emerald-800 shadow-md transform scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-300/30"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Saiba o que Fazer
          </button>
        </div>

        {/* Tab 1: PODA & CORTE */}
        {activeTab === "poda" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Infração Warning Card */}
            <section className="bg-gradient-to-br from-red-50 via-white to-red-50/20 border border-red-200/60 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 border border-red-200 flex-shrink-0 shadow-sm">
                <Scale className="w-8 h-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-extrabold text-red-900">Poda e Corte Podem Dar Multa!</h2>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Evite multas realizando os pedidos corretamente através do nosso portal. As intervenções sem autorização ou de forma drástica configuram infração de acordo com a legislação ambiental vigente de São José do Rio Preto.
                </p>
              </div>
              <div className="bg-red-50 border border-red-200/80 px-4 py-2.5 rounded-2xl text-center flex-shrink-0 shadow-sm">
                <span className="text-[10px] uppercase font-bold text-red-600 block">UFM 2023</span>
                <span className="text-lg font-black text-red-800 block">R$ 73,30</span>
                <span className="text-[9px] text-slate-500 block">Reajustada Anualmente</span>
              </div>
            </section>

            {/* Fines Grid */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" /> Tabela de Multas (Referência 2023)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-red-200 transition-all shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-150">
                      Poda Drástica
                    </span>
                    <h4 className="font-extrabold text-slate-800 mt-3 text-sm">Prática Prejudicial</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Corte de mais de 25% da copa ou remoção total de galhos.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-slate-400">8 UFM</span>
                    <span className="text-base font-black text-red-700">R$ 586,40</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-red-200 transition-all shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-150">
                      Poda Sem Autorização
                    </span>
                    <h4 className="font-extrabold text-slate-800 mt-3 text-sm">Ausência de Protocolo</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Realizar podas sem a devida guia ou deliberação da prefeitura.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-slate-400">8 UFM</span>
                    <span className="text-base font-black text-red-700">R$ 586,40</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-red-200 transition-all shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-150">
                      Supressão s/ Autorização
                    </span>
                    <h4 className="font-extrabold text-slate-800 mt-3 text-sm">Corte Total Irregular</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Derrubar ou erradicar árvore sem o laudo de deferimento oficial.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-slate-400">12 UFM</span>
                    <span className="text-base font-black text-red-700">R$ 879,60</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-red-200 transition-all shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-red-150">
                      Sem Compensação
                    </span>
                    <h4 className="font-extrabold text-slate-800 mt-3 text-sm">Falta de Replante</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Deixar de plantar nova muda padrão após supressão autorizada.</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-[11px] font-bold text-slate-400">5 UFM</span>
                    <span className="text-base font-black text-red-700">R$ 366,50</span>
                  </div>
                </div>

              </div>
              <p className="text-[10px] text-slate-400 italic">
                *Nota: Contrate apenas podadores cadastrados na Prefeitura e exija a respectiva carteira de identificação.
              </p>
            </section>

            {/* Certo vs Errado */}
            <section className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Info className="w-5 h-5 text-emerald-600" /> Práticas de Poda: Certo vs Errado
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Lado Errado (Vermelho) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-250 text-red-800 rounded-xl w-max text-xs font-bold">
                    <X className="w-4 h-4" /> PRÁTICAS PROIBIDAS (ERRADO)
                  </div>

                  <div className="space-y-4">
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                      <h4 className="font-extrabold text-slate-800 text-sm flex justify-between items-center">
                        Poda Drástica
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">Proibido por Lei</span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Retirada de praticamente todos os galhos da copa da árvore. Causa enfraquecimento drástico, impede a produção de energia e deixa o espécime vulnerável a cupins e doenças, frequentemente resultando na morte ou queda da árvore.
                      </p>
                      <div className="mt-3 p-2 bg-red-50/50 rounded-lg text-[10px] font-semibold text-red-800 border border-red-100/30">
                        📜 Dec. 18.301/2019 Art. 14: Não é permitida a retirada de mais de 25% da copa. Proibido podar a mesma árvore num intervalo menor de 2 anos.
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Poda Tipo Egoísta</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Poda realizada para dar formas geométricas à copa (bola, quadrado, etc.). Prejudica gravemente o desenvolvimento natural e a saúde biológica da planta, atendendo unicamente a um desejo estético nocivo.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Poda de Topo</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Remoção total dos galhos superiores (corte principal do eixo da árvore). Destrói a arquitetura natural do espécime e cria grandes áreas de feridas expostas que apodrecem o tronco central.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Poda Lateral excessiva</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Corte excessivo de galhos laterais para evitar sujeira de folhas ou liberar fachadas. Permitida estritamente caso os galhos estejam obstruindo semáforos ou encostando na rede de iluminação.
                      </p>
                    </div>

                  </div>
                </div>

                {/* Lado Certo (Verde) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl w-max text-xs font-bold">
                    <Check className="w-4 h-4" /> PRÁTICAS PERMITIDAS (CERTO)
                  </div>

                  <div className="space-y-4">
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Poda de Limpeza</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Intervenção preventiva onde são eliminados galhos secos, doentes, lascados ou quebrados que perderam sua função na copa e oferecem risco de queda sobre pedestres, casas ou veículos.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Poda em V</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Técnica especial executada para liberar a passagem dos fios da rede elétrica, mantendo a copa estruturada em formato côncavo nas laterais da fiação. 
                      </p>
                      <div className="mt-3 p-2 bg-amber-50 rounded-lg text-[10px] font-semibold text-amber-800 border border-amber-100 flex items-center gap-1.5">
                        ⚠️ <strong>Atenção:</strong> Em caso de fiação elétrica energizada, entre em contato direto com a concessionária de energia.
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Poda de Condução</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        Direciona a copa da árvore jovem enquanto ela cresce, removendo os galhos na base (baixo) do caule para elevar a copa livre e garantir espaço adequado sob a árvore na calçada.
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            </section>

          </div>
        )}

        {/* Tab 2: ESPAÇO ÁRVORE */}
        {activeTab === "espaco" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Normative Intro */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📐</span>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">O que é o Espaço Árvore?</h3>
                  <p className="text-xs text-slate-500 font-semibold">Exigência para Liberação do Habite-se (Lei nº 13.031/2018)</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                O **Espaço Árvore** é uma área da calçada destinada exclusiva e permanentemente ao plantio de árvores, compatível com o desenvolvimento das estruturas das plantas em harmonia com os espaços edificados. A proposta é evitar conflitos futuros com fiações, postes, encanamentos ou portões de garagens.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs space-y-2">
                  <h4 className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Vantagens e Benefícios
                  </h4>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside">
                    <li>Requadros maiores permitem melhor troca gasosa das raízes.</li>
                    <li>Maior absorção de água de chuva (previne enchentes).</li>
                    <li>Desenvolvimento saudável da árvore, sem danificar a calçada.</li>
                  </ul>
                </div>
                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100 text-xs space-y-2">
                  <h4 className="font-bold text-red-800 flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Restrições Importantes
                  </h4>
                  <ul className="space-y-1 text-slate-600 list-disc list-inside">
                    <li><strong>Proibido cimentar</strong> o Espaço Árvore.</li>
                    <li><strong>Proibido usar tubulações</strong> rígidas para plantar a árvore.</li>
                    <li>Obrigatório manter o requadro com grama ou forrações verdes.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Proportional Calculator */}
            <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg font-bold">Simulador Espaço Árvore</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Digite a largura total da calçada em frente ao seu imóvel para simular o tamanho recomendado do canteiro da árvore de acordo com a legislação.
                </p>
                
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Largura da Calçada (metros)</label>
                  <div className="relative max-w-[200px]">
                    <input 
                      type="number"
                      step="0.05"
                      min="1.0"
                      max="10.0"
                      value={sidewalkWidth}
                      onChange={(e) => setSidewalkWidth(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-4 text-white font-bold text-sm outline-none focus:border-emerald-500 transition-colors"
                      placeholder="Ex: 2.50"
                    />
                    <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-500">m</span>
                  </div>
                </div>

                {isWidthValid && (
                  <div className={`p-4.5 rounded-2xl text-xs space-y-2 border ${
                    !isAccceptable 
                      ? "bg-red-500/10 border-red-500/30 text-red-200" 
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                  }`}>
                    <p className="font-bold flex items-center gap-1.5">
                      {!isAccceptable ? (
                        <>
                          <AlertTriangle className="w-4.5 h-4.5 text-red-400 flex-shrink-0" />
                          Calçada Irregular ou Fora de Padrão
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                          Calçada com Largura Adequada
                        </>
                      )}
                    </p>
                    <p className="leading-relaxed opacity-90">{calcStatus}</p>
                    {!isAccceptable && widthVal >= 2.0 && (
                      <p className="mt-1 font-semibold text-red-300">
                        Atenção: O espaço restante para trânsito livre de pedestres ({freeSpace.toFixed(2)}m) seria inferior ao limite obrigatório de 1,20m.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic SVG Visual Schema (Interactive Diagram) */}
              <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Esquema Visual do Projeto</span>
                
                {isWidthValid && widthVal >= 2.0 ? (
                  <div className="w-full flex flex-col items-center">
                    <svg viewBox="0 0 400 200" className="w-full max-w-[340px] h-auto">
                      {/* Sidewalk background */}
                      <rect x="10" y="20" width="380" height="150" fill="#334155" rx="8" />
                      
                      {/* Road boundary (sarjeta) */}
                      <line x1="10" y1="170" x2="390" y2="170" stroke="#f1f5f9" strokeWidth="4" />
                      <text x="310" y="185" fill="#94a3b8" fontSize="8" fontWeight="bold">Guia da Sarjeta</text>

                      {/* Pedestrian Access Zone */}
                      <rect x="10" y="20" width="380" height="70" fill="#475569" rx="4" opacity="0.6" />
                      <text x="20" y="45" fill="#cbd5e1" fontSize="9" fontWeight="bold">Faixa Livre de Acessibilidade (Mín: 1,20m)</text>
                      <text x="20" y="58" fill="#a1a1aa" fontSize="8">Atual livre: {freeSpace.toFixed(2)}m</text>
                      
                      {/* Espaço Árvore Requadro */}
                      <rect x="150" y="90" width="100" height="60" fill="#15803d" stroke="#fef08a" strokeWidth="2" rx="4" />
                      <text x="200" y="115" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="middle">Canteiro</text>
                      <text x="200" y="128" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">{recWidth.toFixed(2)}m x {recLength.toFixed(2)}m</text>
                      <text x="200" y="142" fill="#a7f3d0" fontSize="7" textAnchor="middle">Grama/Forração</text>

                      {/* Sidewalk Total Width Indicator */}
                      <line x1="370" y1="20" x2="370" y2="170" stroke="#fcd34d" strokeWidth="2" strokeDasharray="3" />
                      <text x="360" y="95" fill="#fcd34d" fontSize="9" fontWeight="bold" transform="rotate(90, 360, 95)" textAnchor="middle">Calçada: {widthVal.toFixed(2)}m</text>
                    </svg>

                    <div className="grid grid-cols-3 gap-6 mt-4 w-full max-w-sm text-center border-t border-slate-800 pt-4">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Largura Canteiro</span>
                        <span className="text-sm font-bold text-emerald-400">{recWidth.toFixed(2)}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Comprimento</span>
                        <span className="text-sm font-bold text-emerald-400">{recLength.toFixed(2)}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-semibold">Passagem Livre</span>
                        <span className={`text-sm font-bold ${isAccceptable ? "text-emerald-400" : "text-red-400"}`}>
                          {freeSpace.toFixed(2)}m
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <span className="text-3xl block">⚠️</span>
                    <p className="text-xs text-slate-400">
                      Digite uma largura de calçada a partir de **2.00 metros** para exibir o projeto estruturado do canteiro.
                    </p>
                  </div>
                )}

              </div>
            </section>

          </div>
        )}

        {/* Tab 3: FAQ / CONTATOS */}
        {activeTab === "faq" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Direct Contacts Info */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-emerald-700" /> Contatos e Fiscalização da Prefeitura
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Meio Ambiente e Urbanismo</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Av. Lino José de Seixas, 861, Jardim Seixas<br/>
                    Fone: (17) 3202-4010
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Serviços Gerais</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Rua Campos Sales, 1905, Boa Vista<br/>
                    Fone: (17) 3212-6310
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>Fiscalização de Poda</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-6">
                    Rua José Scamardi, 147, Dist. Industrial<br/>
                    Fone: (17) 3212-1388<br/>
                    E-mail: <a href="mailto:smserv.fiscalizacao@riopreto.sp.gov.br" className="text-emerald-600 hover:underline">smserv.fiscalizacao@riopreto.sp.gov.br</a>
                  </p>
                </div>

              </div>
            </section>

            {/* Accordion FAQ */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600" /> Dúvidas Frequentes (Saiba o que Fazer)
              </h3>

              <div className="space-y-3">
                {faqItems.map((item, index) => {
                  const isOpen = !!faqOpen[index];
                  return (
                    <div 
                      key={index} 
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between p-4.5 text-left font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition-colors"
                      >
                        <span>{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/50 animate-slideDown">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* Call to Action Footer card */}
        {!loading && !user && (
          <section className="bg-slate-800 text-white p-8 rounded-3xl shadow-xl mt-12 relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-20 border border-slate-700">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <h3 className="text-2xl font-extrabold tracking-tight">Precisa de Autorização de Poda ou Corte?</h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xl mx-auto">
                Seja em calçada ou dentro de seu terreno, garanta que a prefeitura realize a vistoria técnica e aprove seu laudo antes de contratar qualquer execução.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-center">
                <Link 
                  href="/cadastro" 
                  id="create-account-btn"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-md transform hover:scale-[1.02] text-sm w-full sm:w-auto"
                >
                  Criar Conta de Cidadão
                </Link>
                <Link 
                  href="/login" 
                  id="login-redirect-btn"
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-md transform hover:scale-[1.02] text-sm w-full sm:w-auto border border-slate-600"
                >
                  Acessar Portal
                </Link>
              </div>
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
