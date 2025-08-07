"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, Avatar, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/react";
import { CurrencyDollarIcon, InformationCircleIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { ScissorsIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { createClient } from "@/lib/supabase/client";
import { ComissaoResumoCard } from '../../../../components/ComissaoResumoCard';
import { ComissaoBarbeiroCard } from '../../../../components/ComissaoBarbeiroCard';
import dayjs from "dayjs";
const supabase = createClient();
const TRATO_ID = "244c0543-7108-4892-9eac-48186ad1d5e7";
const getMesAtual = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};
export default function ComissaoPage() {
    const [barbeiros, setBarbeiros] = useState([]);
    const [realizados, setRealizados] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [faturamento, setFaturamento] = useState(0);
    const [loading, setLoading] = useState(true);
    const [barbeiroDetalhe, setBarbeiroDetalhe] = useState(null);
    const [comissoesAvulsas, setComissoesAvulsas] = useState([]);
    const [mesSelecionado, setMesSelecionado] = useState(dayjs().format("YYYY-MM"));
    const [metas, setMetas] = useState([]);
    const [faixasPorMeta, setFaixasPorMeta] = useState({});
    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            const inicio = dayjs(mesSelecionado).startOf("month").format("YYYY-MM-DD");
            const fim = dayjs(mesSelecionado).endOf("month").toISOString();
            // Buscar barbeiros apenas da unidade Trato de Barbados
            const { data: barbeiros } = await supabase
                .from("profissionais")
                .select("*")
                .eq("funcao", "barbeiro")
                .eq("unidade_id", TRATO_ID);
            // Buscar serviços realizados no mês
            const { data: realizados } = await supabase
                .from("servicos_realizados")
                .select("*, servico:servico_id(*), barbeiro:barbeiro_id(*)")
                .gte("data_hora", inicio)
                .lte("data_hora", fim);
            // Buscar serviços (para minutos)
            const { data: servicos } = await supabase.from("servicos").select("*");
            // Buscar faturamento do mês da unidade
            const { data: fat } = await supabase
                .from("faturamento_assinatura")
                .select("valor")
                .eq("mes_referencia", mesSelecionado)
                .eq("unidade", "Trato de Barbados");
            // Buscar comissões avulsas do mês
            const { data: comissoesAvulsas } = await supabase
                .from("comissoes_avulsas")
                .select("*, servicos_avulsos(tempo_minutos, nome)")
                .eq("unidade_id", TRATO_ID)
                .gte("data_lancamento", inicio)
                .lte("data_lancamento", fim);
            // Buscar metas e faixas de bonificação do mês
            const { data: metasData } = await supabase
                .from("metas_trato")
                .select("*")
                .eq("mes", mesSelecionado.split('-')[1])
                .eq("ano", mesSelecionado.split('-')[0]);
            let faixasObj = {};
            if (metasData && metasData.length > 0) {
                for (const meta of metasData) {
                    const { data: faixas } = await supabase
                        .from("metas_trato_faixas")
                        .select("*")
                        .eq("meta_id", meta.id);
                    faixasObj[meta.id] = faixas || [];
                }
            }
            setMetas(metasData || []);
            setFaixasPorMeta(faixasObj);
            const totalFaturamento = fat && fat.length > 0 ? fat.reduce((acc, f) => acc + Number(f.valor), 0) : 0;
            setBarbeiros(barbeiros || []);
            setRealizados(realizados || []);
            setServicos(servicos || []);
            setFaturamento(totalFaturamento);
            setComissoesAvulsas(comissoesAvulsas || []);
            setLoading(false);
        }
        fetchAll();
    }, [mesSelecionado]);
    // Comissão total do mês (40% do faturamento da unidade)
    const comissaoTotal = faturamento * 0.4;
    function getResumoBarbeiro(barbeiro) {
        const feitos = realizados.filter(r => r.barbeiro_id === barbeiro.id);
        let minutos = 0;
        feitos.forEach(r => {
            var _a;
            minutos += ((_a = r.servico) === null || _a === void 0 ? void 0 : _a.tempo_minutos) || 0;
        });
        return {
            total: feitos.length,
            minutos
        };
    }
    const totalMinutosMes = barbeiros.reduce((acc, b) => acc + getResumoBarbeiro(b).minutos, 0);
    function getDetalheServicos(barbeiro) {
        const feitos = realizados.filter(r => r.barbeiro_id === barbeiro.id);
        const tipos = { corte: 0, barba: 0, "corte e barba": 0, acabamento: 0 };
        feitos.forEach(r => {
            var _a, _b;
            const nome = ((_b = (_a = r.servico) === null || _a === void 0 ? void 0 : _a.nome) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || "";
            if (nome.includes("barba") && nome.includes("corte"))
                tipos["corte e barba"]++;
            else if (nome.includes("barba"))
                tipos.barba++;
            else if (nome.includes("corte"))
                tipos.corte++;
            else if (nome.includes("acabamento"))
                tipos.acabamento++;
        });
        return tipos;
    }
    function getValorRealPorTipo(barbeiro, comissao) {
        const tipos = getDetalheServicos(barbeiro);
        const totalServicos = Object.values(tipos).reduce((a, b) => a + b, 0);
        const valores = {};
        Object.entries(tipos).forEach(([tipo, qtd]) => {
            valores[tipo] = totalServicos > 0 ? comissao * (qtd / totalServicos) : 0;
        });
        return valores;
    }
    const tipoServicoIcone = {
        corte: <ScissorsIcon className="w-5 h-5 text-blue-500 inline-block mr-1"/>,
        barba: <SparklesIcon className="w-5 h-5 text-green-500 inline-block mr-1"/>,
        "corte e barba": <UserGroupIcon className="w-5 h-5 text-purple-500 inline-block mr-1"/>,
        acabamento: <InformationCircleIcon className="w-5 h-5 text-gray-400 inline-block mr-1"/>,
    };
    return (<div className="min-h-screen bg-gray-50 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between max-w-7xl mx-auto px-4 mb-8 gap-4">
        <h1 className="text-3xl font-extrabold text-blue-900 text-center">Comissão - Trato de Barbados</h1>
        <input type="month" value={mesSelecionado} onChange={e => setMesSelecionado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm" style={{ minWidth: 140 }}/>
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <ComissaoResumoCard icon={<CurrencyDollarIcon className="w-9 h-9 text-green-600"/>} title="Faturamento Total do Mês" value={faturamento} valueColorClass="text-green-700" gradientClass="bg-gradient-to-br from-green-50 to-white"/>
        <ComissaoResumoCard icon={<ChartBarIcon className="w-9 h-9 text-amber-500"/>} title="Comissão Total do Mês (40%)" value={comissaoTotal} valueColorClass="text-amber-700" gradientClass="bg-gradient-to-br from-amber-100 to-white"/>
      </div>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
        {barbeiros.length === 0 ? (<Card className="shadow-md rounded-2xl col-span-full">
            <CardBody className="text-center text-gray-400 py-12">Nenhum barbeiro cadastrado.</CardBody>
          </Card>) : (barbeiros.map((b) => {
            const resumo = getResumoBarbeiro(b);
            const percentual = totalMinutosMes > 0 ? resumo.minutos / totalMinutosMes : 0;
            // Comissão de assinatura
            const comissaoAssinatura = comissaoTotal * percentual;
            // Comissão avulsa do barbeiro
            const avulsas = comissoesAvulsas.filter(c => c.profissional_id === b.id);
            const totalAvulsa = avulsas.reduce((acc, c) => acc + (Number(c.valor_comissao) * Number(c.quantidade)), 0);
            // Comissão total
            const comissaoTotalBarbeiro = comissaoAssinatura + totalAvulsa;
            // Serviços assinatura
            const feitos = realizados.filter(r => r.barbeiro_id === b.id);
            // Serviços avulsos
            const avulsosServicos = avulsas;
            // Totais por tipo
            const tipos = ["Corte", "Barba", "Corte e barba", "Acabamento"];
            const totaisPorTipo = {};
            tipos.forEach(tipo => {
                const totalAssinatura = feitos.filter(r => { var _a; return ((_a = r.servico) === null || _a === void 0 ? void 0 : _a.nome) === tipo; }).length;
                const totalAvulso = avulsosServicos.filter(c => { var _a; return ((_a = c.servicos_avulsos) === null || _a === void 0 ? void 0 : _a.nome) === tipo; }).reduce((acc, c) => acc + Number(c.quantidade), 0);
                totaisPorTipo[tipo] = totalAssinatura + totalAvulso;
            });
            // Total de serviços
            const totalServicos = feitos.length + avulsosServicos.reduce((acc, c) => acc + Number(c.quantidade), 0);
            // Ticket médio
            const ticketMedio = totalServicos > 0 ? comissaoTotalBarbeiro / totalServicos : 0;
            // Metas do barbeiro para o mês/ano
            const metasBarbeiro = metas.filter(m => m.barbeiro_id === b.id);
            const bonificacoesAtivas = [];
            metasBarbeiro.forEach(meta => {
                const faixas = faixasPorMeta[meta.id] || [];
                faixas.forEach((faixa) => {
                    if (faixa.tipo === 'produtos') {
                        const vendidos = /* calcule o total de produtos vendidos pelo barbeiro no mês */ 0;
                        if (vendidos >= faixa.quantidade) {
                            bonificacoesAtivas.push({
                                descricao: `${faixa.quantidade} produtos vendidos`,
                                valor: faixa.bonificacao
                            });
                        }
                    }
                    if (faixa.tipo === 'servicos') {
                        const realizadosServ = /* calcule o total de serviços realizados pelo barbeiro no mês */ 0;
                        if (realizadosServ >= faixa.quantidade) {
                            bonificacoesAtivas.push({
                                descricao: `${faixa.quantidade} serviços realizados`,
                                valor: faixa.bonificacao
                            });
                        }
                    }
                });
            });
            return (<ComissaoBarbeiroCard key={b.id} nome={b.nome} avatarUrl={b.avatar_url} minutos={resumo.minutos} percentual={percentual} comissao={comissaoTotalBarbeiro} ticketMedio={ticketMedio} tipos={totaisPorTipo} tipoServicoIcone={tipoServicoIcone} onClick={() => setBarbeiroDetalhe(b)} totalComissaoAvulsa={totalAvulsa}>
                {bonificacoesAtivas.length > 0 && (<div className="mt-2">
                    <span className="font-semibold text-gray-800 flex items-center mb-1">
                      Bonificações <span className="ml-1">🏅</span>
                    </span>
                    {bonificacoesAtivas.length > 0 ? (<ul className="space-y-1 mt-1">
                        {bonificacoesAtivas.map((b, idx) => (<li key={idx} className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-bold">🎉 Batido!</span>
                            <span className="text-gray-700">{b.descricao}</span>
                            <span className="font-bold text-green-700">{`R$ ${Number(b.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</span>
                          </li>))}
                      </ul>) : (<span className="text-gray-400 text-sm">Nenhuma bonificação batida ainda.</span>)}
                  </div>)}
              </ComissaoBarbeiroCard>);
        }))}
      </div>
      {/* Modal de Detalhamento do Barbeiro */}
      <Modal isOpen={!!barbeiroDetalhe} onClose={() => setBarbeiroDetalhe(null)} size="xl" isDismissable closeButton className="z-[9999]">
        <ModalContent className="!p-0">
          <ModalHeader className="bg-gradient-to-r from-blue-100 via-white to-green-100 flex flex-col items-center gap-2 py-7 px-4 border-b border-gray-100">
            <Avatar src={barbeiroDetalhe === null || barbeiroDetalhe === void 0 ? void 0 : barbeiroDetalhe.avatar_url} name={barbeiroDetalhe === null || barbeiroDetalhe === void 0 ? void 0 : barbeiroDetalhe.nome} size="lg" className="shadow-lg border-2 border-white mb-2"/>
            <span className="text-2xl md:text-3xl font-extrabold text-blue-800 tracking-tight text-center drop-shadow">{(barbeiroDetalhe === null || barbeiroDetalhe === void 0 ? void 0 : barbeiroDetalhe.nome) || 'N/A'}</span>
            {/* Valor total da comissão (assinatura + avulsa) */}
            {barbeiroDetalhe && (() => {
            // Comissão de assinatura
            const feitos = realizados.filter(r => r.barbeiro_id === barbeiroDetalhe.id);
            const minutos = feitos.reduce((acc, r) => { var _a; return acc + (((_a = r.servico) === null || _a === void 0 ? void 0 : _a.tempo_minutos) || 0); }, 0);
            const totalMinutosMes = barbeiros.reduce((acc, b2) => {
                const feitos2 = realizados.filter(r => r.barbeiro_id === b2.id);
                return acc + feitos2.reduce((a, r) => { var _a; return a + (((_a = r.servico) === null || _a === void 0 ? void 0 : _a.tempo_minutos) || 0); }, 0);
            }, 0);
            const comissaoAssinatura = totalMinutosMes > 0 ? comissaoTotal * (minutos / totalMinutosMes) : 0;
            // Comissão avulsa
            const avulsas = comissoesAvulsas.filter(c => c.profissional_id === barbeiroDetalhe.id);
            const totalAvulsa = avulsas.reduce((acc, c) => acc + (Number(c.valor_comissao) * Number(c.quantidade)), 0);
            const totalComissao = comissaoAssinatura + totalAvulsa;
            return (<span className="text-green-700 font-bold text-lg">Comissão Total: R$ {totalComissao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>);
        })()}
            <span className="inline-block text-base font-medium text-gray-500 bg-white/70 rounded-full px-4 py-1 shadow-sm mt-1">Detalhamento de Comissão</span>
          </ModalHeader>
          <ModalBody className="bg-white px-2 md:px-8 pb-8 pt-6">
            {barbeiroDetalhe && (() => {
            // Comissão de assinatura
            const feitos = realizados.filter(r => r.barbeiro_id === barbeiroDetalhe.id);
            const minutos = feitos.reduce((acc, r) => { var _a; return acc + (((_a = r.servico) === null || _a === void 0 ? void 0 : _a.tempo_minutos) || 0); }, 0);
            const totalServicos = feitos.length;
            const totalMinutosMes = barbeiros.reduce((acc, b2) => {
                const feitos2 = realizados.filter(r => r.barbeiro_id === b2.id);
                return acc + feitos2.reduce((a, r) => { var _a; return a + (((_a = r.servico) === null || _a === void 0 ? void 0 : _a.tempo_minutos) || 0); }, 0);
            }, 0);
            const comissaoAssinatura = totalMinutosMes > 0 ? comissaoTotal * (minutos / totalMinutosMes) : 0;
            const valorMinuto = minutos > 0 ? comissaoAssinatura / minutos : null;
            const valorHora = valorMinuto !== null ? valorMinuto * 60 : null;
            // Comissão avulsa
            const avulsas = comissoesAvulsas.filter(c => c.profissional_id === barbeiroDetalhe.id);
            const minutosAvulsa = avulsas.reduce((acc, c) => { var _a; return acc + (((_a = c.servicos_avulsos) === null || _a === void 0 ? void 0 : _a.tempo_minutos) ? Number(c.servicos_avulsos.tempo_minutos) * Number(c.quantidade) : 0); }, 0);
            const totalAvulsa = avulsas.reduce((acc, c) => acc + (Number(c.valor_comissao) * Number(c.quantidade)), 0);
            const quantidadeAvulsa = avulsas.reduce((acc, c) => acc + Number(c.quantidade), 0);
            const valorMinutoAvulsa = minutosAvulsa > 0 ? totalAvulsa / minutosAvulsa : null;
            const valorHoraAvulsa = valorMinutoAvulsa !== null ? valorMinutoAvulsa * 60 : null;
            return (<div className="flex flex-col md:flex-row gap-7 justify-center items-stretch w-full">
                  {/* Comissão Assinatura */}
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-7 flex flex-col border border-blue-100 min-w-[220px] max-w-full mb-4 md:mb-0 transition-transform hover:scale-[1.01]">
                    <div className="flex items-center gap-2 mb-5 justify-center">
                      <CurrencyDollarIcon className="w-6 h-6 text-blue-500"/>
                      <span className="font-semibold text-blue-700 text-lg">Comissão de Assinatura</span>
                    </div>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-extrabold text-blue-800 drop-shadow block">R$ {comissaoAssinatura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <span className="block text-xs text-gray-400 mt-1">(40% do faturamento proporcional aos minutos)</span>
                    </div>
                    <div className="flex flex-col gap-1 w-full mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Minutos</span>
                        <span className="font-bold text-blue-700">{minutos}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Valor/min</span>
                        <span className="font-bold text-blue-700">{valorMinuto !== null ? `R$ ${valorMinuto.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Valor/hora</span>
                        <span className="font-bold text-blue-700">{valorHora !== null ? `R$ ${valorHora.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span># Serviços</span>
                        <span className="font-bold text-blue-700">{totalServicos}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
                        <span>Ticket médio</span>
                        <span className="font-bold text-blue-700">{totalServicos > 0 ? `R$ ${(comissaoAssinatura / totalServicos).toLocaleString("pt-BR", { minimumFractionDigits: 3 })}` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Comissão Avulsa */}
                  <div className="flex-1 bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg p-7 flex flex-col border border-green-100 min-w-[220px] max-w-full mb-4 md:mb-0 transition-transform hover:scale-[1.01]">
                    <div className="flex items-center gap-2 mb-5 justify-center">
                      <CurrencyDollarIcon className="w-6 h-6 text-green-500"/>
                      <span className="font-semibold text-green-700 text-lg">Comissão Avulsa</span>
                    </div>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-extrabold text-green-700 drop-shadow block">R$ {totalAvulsa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <span className="block text-xs text-gray-400 mt-1">(Comissões de serviços avulsos do mês)</span>
                    </div>
                    <div className="flex flex-col gap-1 w-full mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Minutos</span>
                        <span className="font-bold text-green-700">{minutosAvulsa}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Valor/min</span>
                        <span className="font-bold text-green-700">{valorMinutoAvulsa !== null ? `R$ ${valorMinutoAvulsa.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Valor/hora</span>
                        <span className="font-bold text-green-700">{valorHoraAvulsa !== null ? `R$ ${valorHoraAvulsa.toLocaleString("pt-BR", { minimumFractionDigits: 3 })}` : 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span># Serviços</span>
                        <span className="font-bold text-green-700">{quantidadeAvulsa}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1">
                        <span>Ticket médio</span>
                        <span className="font-bold text-green-700">{quantidadeAvulsa > 0 ? `R$ ${(totalAvulsa / quantidadeAvulsa).toLocaleString("pt-BR", { minimumFractionDigits: 3 })}` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>);
        })()}
          </ModalBody>
          <ModalFooter className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end rounded-b-2xl">
            <Button variant="light" onClick={() => setBarbeiroDetalhe(null)} className="font-semibold px-8 py-3 rounded-lg shadow-md text-base transition-colors hover:bg-blue-50">Fechar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>);
}
