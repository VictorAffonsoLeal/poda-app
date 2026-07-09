"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  Trees, 
  PlusCircle, 
  Clipboard, 
  HardHat, 
  CheckCircle, 
  AlertTriangle,
  User,
  ShieldCheck,
  BookOpen,
  Info,
  MapPin,
  Camera
} from "lucide-react";

export default function ComoFuncionaPage() {
  const sections = [
    {
      id: "cadastro",
      title: "1. Cadastro e Meus Dados",
      icon: <User className="w-5 h-5 text-emerald-600" />,
      bgIcon: "bg-emerald-55",
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 leading-relaxed">
            Para solicitar serviços ou acompanhar processos, você precisa estar devidamente cadastrado no portal do cidadão.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-slate-600 list-disc list-inside pl-1">
            <li><strong>CPF Único:</strong> Cada cidadão é identificado por seu CPF para fins de prestação de contas fiscais e ambientais.</li>
            <li><strong>Endereço de Cadastro:</strong> Salve o endereço da sua residência no menu <em>"Meus Dados"</em> para facilitar a geolocalização dos seus chamados.</li>
            <li><strong>Contato Atualizado:</strong> Certifique-se de manter seu telefone e e-mail corretos, pois você receberá avisos importantes sobre o andamento do processo.</li>
          </ul>
        </div>
      )
    },
    {
      id: "solicitacao",
      title: "2. Solicitar Poda ou Corte",
      icon: <PlusCircle className="w-5 h-5 text-emerald-600" />,
      bgIcon: "bg-emerald-55",
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 leading-relaxed">
            Se você tem uma árvore na calçada ou dentro do seu terreno que precisa de intervenção, crie um pedido em <strong>"Nova Solicitação"</strong>.
          </p>
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-2 text-xs font-semibold text-slate-600">
            <p className="flex items-center gap-1.5 text-slate-800 font-bold">
              <Camera className="w-4 h-4 text-emerald-600" /> O que é necessário enviar:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li><strong>Local Exato:</strong> Endereço correto, CEP e ponto de referência do vegetal.</li>
              <li><strong>Fotos de Evidência:</strong> Tire fotos nítidas mostrando a árvore inteira, a copa, o tronco e o problema alegado (ex: fiação, rachaduras, proximidade de muros).</li>
              <li><strong>Justificativa Clara:</strong> Explique detalhadamente o motivo do pedido.</li>
              <li><strong>Autorização de Anuência:</strong> Se você mora em um imóvel alugado, deve anexar a autorização assinada pelo proprietário. <span className="text-emerald-700">💡 <strong>Alternativa facilitada:</strong> Caso não possua contato direto com o dono, é permitido anexar a cópia do seu <strong>contrato de locação da imobiliária</strong>.</span></li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: "vistoria",
      title: "3. Vistoria e Laudo Técnico",
      icon: <Clipboard className="w-5 h-5 text-emerald-600" />,
      bgIcon: "bg-emerald-55",
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 leading-relaxed">
            Nenhuma poda ou supressão (corte) pode ser executada em área urbana sem a prévia vistoria da prefeitura.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-slate-600 list-disc list-inside pl-1">
            <li><strong>Designação de Engenheiro:</strong> O sistema designa um vistoriador técnico (engenheiro agrônomo ou florestal) para analisar a árvore.</li>
            <li><strong>Parecer Técnico:</strong> O profissional realiza a vistoria presencial e emite um **Laudo Técnico** que pode ser **Deferido** (Aprovado) ou **Indeferido** (Recusado).</li>
            <li><strong>Visualização do Laudo:</strong> Você pode acessar o laudo técnico completo e as observações do vistoriador clicando no chamado em <em>"Minhas Solicitações"</em>.</li>
          </ul>
        </div>
      )
    },
    {
      id: "execucao",
      title: "4. Contratação e Execução",
      icon: <HardHat className="w-5 h-5 text-emerald-600" />,
      bgIcon: "bg-emerald-55",
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 leading-relaxed">
            Após a liberação e deferimento do laudo pelo município, a responsabilidade de executar a poda em calçadas ou terrenos particulares é do munícipe.
          </p>
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs font-semibold space-y-1">
            <p className="font-extrabold flex items-center gap-1.5 text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700" /> Contrate Profissionais Credenciados!
            </p>
            <p>
              Acesse a lista em <strong>"Podadores Autorizados"</strong>. Estes profissionais foram capacitados pela Secretaria Municipal de Meio Ambiente para efetuar o serviço sem danificar a saúde da árvore e seguindo as diretrizes de descarte correto de resíduos verdes.
            </p>
          </div>
        </div>
      )
    },
    {
      id: "homologacao",
      title: "5. Homologação (Evite Multas)",
      icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
      bgIcon: "bg-emerald-55",
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 leading-relaxed">
            Após a execução do serviço, você deve obrigatoriamente comprovar à prefeitura que a poda foi realizada de forma regular.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-slate-600 list-disc list-inside pl-1">
            <li><strong>Envio de Fotos:</strong> Vá em <em>"Minhas Solicitações"</em>, abra o detalhe do seu chamado aprovado, tire e anexe fotos da calçada limpa e do vegetal podado.</li>
            <li><strong>Validação da Prefeitura:</strong> A Secretaria analisará as fotos da execução. Se tudo estiver correto, o status mudará para <strong>Concluído</strong>.</li>
            <li><strong>Risco de Multa Ambiental:</strong> A poda incorreta (poda drástica) ou a falta de comprovação de replante (compensação ambiental) configuram infração e podem gerar multas administrativas.</li>
          </ul>
        </div>
      )
    },
    {
      id: "denuncia",
      title: "6. Ouvidoria e Denúncias",
      icon: <AlertTriangle className="w-5 h-5 text-emerald-600" />,
      bgIcon: "bg-emerald-55",
      content: (
        <div className="space-y-3">
          <p className="text-slate-650 leading-relaxed">
            Se você presenciar podas drásticas, remoção de árvores saudáveis sem autorização, ou árvores mortas gerando perigo, use o canal de <strong>"Denúncia"</strong>.
          </p>
          <ul className="space-y-2 text-xs font-semibold text-slate-600 list-disc list-inside pl-1">
            <li><strong>Sigilo Garantido:</strong> Você pode optar por fazer uma denúncia **Anônima**, ocultando seus dados pessoais dos operadores administrativos e prestadores.</li>
            <li><strong>Evidências Importantes:</strong> Anexe o maior número de fotos possível do ato infracional ou do vegetal em risco para acelerar o envio da fiscalização.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans w-full">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 text-white shadow-lg relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="text-emerald-200 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-xl border border-white/10 shadow-inner flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Guia Prático
                </span>
                <span className="bg-emerald-500/20 text-emerald-350 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Cidadão
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Como Funciona o App?</h1>
              <p className="text-emerald-100/90 text-xs sm:text-sm font-semibold mt-0.5">
                Saiba como navegar, pedir autorizações e cumprir as regras municipais.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/10 p-3 rounded-2xl shrink-0">
            <BookOpen className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </header>

      {/* Manual Content */}
      <main className="max-w-4xl mx-auto mt-8 px-2 space-y-6">
        
        {/* Intro */}
        <section className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-teal-50 text-teal-650 rounded-xl shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">Guia Completo de Navegação</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold">
              O Poda Digital foi desenvolvido para aproximar o cidadão da Secretaria de Meio Ambiente. Este manual ajuda a entender as etapas necessárias para que seu serviço de poda seja aprovado, executado e homologado sem transtornos ou multas.
            </p>
          </div>
        </section>

        {/* Detailed Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((sec) => (
            <div 
              key={sec.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${sec.bgIcon} shrink-0`}>
                    {sec.icon}
                  </div>
                  <h3 className="font-black text-slate-800 text-sm sm:text-base tracking-tight">
                    {sec.title}
                  </h3>
                </div>
                <div className="text-xs sm:text-sm text-slate-500">
                  {sec.content}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Footer CTA */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 text-center space-y-4">
          <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">Ficou com alguma dúvida adicional?</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed font-medium">
            Você pode conversar diretamente com um atendente ou engenheiro municipal acessando o chat de suporte no canto inferior direito de qualquer página!
          </p>
          <div className="pt-2">
            <Link 
              href="/" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-6 rounded-xl transition-all shadow-md transform hover:scale-[1.02] text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              Voltar para o Início
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
