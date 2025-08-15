"use client";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Button } from "@/components/ui/chakra-adapters";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CurrencyDollarIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { ComissaoResumoCard } from "@/components/ComissaoResumoCard";
import { ComissaoBarbeiroCard } from "@/components/ComissaoBarbeiroCard";
import { usePagamentosAsaas } from "@/app/assinaturas/assinantes/hooks/usePagamentosAsaas";
import { getAssinaturas } from "@/lib/services/subscriptions";
import dayjs from "dayjs";

const supabase = createClient();
const TRATO_ID = process.env.NEXT_PUBLIC_TRATO_UNIDADE_ID || "244c0543-7108-4892-9eac-48186ad1d5e7";

type Barbeiro = { id: string; nome: string; avatar_url?: string };
type Realizado = { barbeiro_id: string; servico?: { tempo_minutos?: number } };
type ComissaoAvulsa = { profissional_id: string; valor_comissao: number; quantidade: number };
type Faixa = { barbeiro_id: string; quantidade: number; tipo?: string };
type VendaProduto = { barbeiro_id: string; quantidade: number };

type FaixasMap = Record<string, Array<{ quantidade: number; tipo?: string }>>;

type Assinatura = { price: number; status: string };
type PagamentoConf = { valor: number; status: string };

type PagamentoHook = { valor: number; status: string };

export default function ComissaoPage() {
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [realizados, setRealizados] = useState<Realizado[]>([]);
  const [comissoesAvulsas, setComissoesAvulsas] = useState<ComissaoAvulsa[]>([]);
  const [faixasPorBarbeiro, setFaixasPorBarbeiro] = useState<FaixasMap>({});
  const [vendasProdutos, setVendasProdutos] = useState<VendaProduto[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(dayjs().format("YYYY-MM"));
  const [barbeiroDetalhe, setBarbeiroDetalhe] = useState<Barbeiro | null>(null);
  const { pagamentos } = usePagamentosAsaas({
    dataInicio: dayjs(mesSelecionado).startOf("month").format("YYYY-MM-DD"),
    dataFim: dayjs(mesSelecionado).endOf("month").format("YYYY-MM-DD"),
  }) as { pagamentos: PagamentoHook[] };
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);

  useEffect(() => {
    getAssinaturas().then((a) => setAssinaturas((a as unknown as Assinatura[]) || []));
  }, [mesSelecionado]);

  useEffect(() => {
    async function fetchAll() {
      const inicio = dayjs(mesSelecionado).startOf("month").format("YYYY-MM-DD");
      const fim = dayjs(mesSelecionado).endOf("month").toISOString();
      const { data: b } = await supabase
        .from("profissionais")
        .select("*")
        .eq("funcao", "barbeiro")
        .eq("unidade_id", TRATO_ID);
      const { data: r } = await supabase
        .from("servicos_realizados")
        .select("*, servico:servico_id(*), barbeiro:barbeiro_id(*)")
        .gte("data_hora", inicio)
        .lte("data_hora", fim);
      const { data: ca } = await supabase
        .from("comissoes_avulsas")
        .select("*, servicos_avulsos(tempo_minutos, nome)")
        .eq("unidade_id", TRATO_ID)
        .gte("data_lancamento", inicio)
        .lte("data_lancamento", fim);
      // Metas por barbeiro (produtos)
      const barbeiroIds = (b || []).map((bb: Barbeiro) => bb.id);
      const faixasMap: FaixasMap = {};
      if (barbeiroIds.length > 0) {
        const { data: faixas } = await supabase
          .from("metas_trato_faixas")
          .select("barbeiro_id, quantidade, tipo")
          .eq("tipo", "produtos")
          .in("barbeiro_id", barbeiroIds);
        (faixas as unknown as Faixa[] | null)?.forEach((f) => {
          if (!faixasMap[f.barbeiro_id]) faixasMap[f.barbeiro_id] = [];
          faixasMap[f.barbeiro_id].push({ quantidade: Number(f.quantidade || 0), tipo: f.tipo });
        });
      }
      // Vendas de produtos no mês
      const { data: vendas } = await supabase
        .from("vendas_produtos_barbeiro")
        .select("barbeiro_id, quantidade, data_venda, unidade_id")
        .eq("unidade_id", TRATO_ID)
        .gte("data_venda", inicio)
        .lte("data_venda", fim);
      setBarbeiros((b as unknown as Barbeiro[]) || []);
      setRealizados((r as unknown as Realizado[]) || []);
      setComissoesAvulsas((ca as unknown as ComissaoAvulsa[]) || []);
      setFaixasPorBarbeiro(faixasMap);
      setVendasProdutos((vendas as unknown as VendaProduto[]) || []);
    }
    fetchAll();
  }, [mesSelecionado]);

  const pagamentosConfirmados = useMemo(
    () =>
      [
        ...pagamentos.map((p) => ({ valor: p.valor, status: p.status } as PagamentoConf)),
        ...assinaturas.map((a) => ({ valor: a.price, status: a.status } as PagamentoConf)),
      ].filter((p) => p.status === "CONFIRMED"),
    [pagamentos, assinaturas]
  );

  const faturamento = pagamentosConfirmados.reduce((acc, p) => acc + Number(p.valor), 0);
  const COMISSAO_PERCENT = Number(process.env.NEXT_PUBLIC_COMMISSION_PERCENT_TRATO ?? process.env.NEXT_PUBLIC_COMMISSION_PERCENT ?? 0.4);
  const comissaoTotal = faturamento * COMISSAO_PERCENT;

  const getResumoBarbeiro = (barbeiro: Barbeiro) => {
    const feitos = realizados.filter((r) => r.barbeiro_id === barbeiro.id);
    const minutos = feitos.reduce((acc, r) => acc + (r.servico?.tempo_minutos || 0), 0);
    return { total: feitos.length, minutos };
  };

  const totalMinutosMes = barbeiros.reduce((acc, b) => acc + getResumoBarbeiro(b).minutos, 0);

  return (
    <div className="container mx-auto max-w-7xl py-8">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-semibold">Comissão - Trato de Barbados</h1>
        <Input type="month" value={mesSelecionado} onChange={(e) => setMesSelecionado(e.target.value)} className="w-auto" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ComissaoResumoCard
          icon={<CurrencyDollarIcon width={28} height={28} />}
          title="Faturamento Total do Mês"
          value={faturamento}
        />
        <ComissaoResumoCard
          icon={<ChartBarIcon width={28} height={28} />}
          title="Comissão Total do Mês (40%)"
          value={comissaoTotal}
        />
      </div>

      {barbeiros.length === 0 ? (
        <Card className="border border-border rounded-xl">
          <CardContent className="text-center py-6 text-muted-foreground">Nenhum barbeiro cadastrado.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
          {barbeiros.map((b) => {
            const resumo = getResumoBarbeiro(b);
            const percentual = totalMinutosMes > 0 ? resumo.minutos / totalMinutosMes : 0;
            const comissaoAssinatura = comissaoTotal * percentual;
            const avulsas = comissoesAvulsas.filter((c) => c.profissional_id === b.id);
            const totalAvulsa = avulsas.reduce((acc, c) => acc + Number(c.valor_comissao) * Number(c.quantidade), 0);
            const comissaoTotalBarbeiro = comissaoAssinatura + totalAvulsa;
            const feitos = realizados.filter((r) => r.barbeiro_id === b.id);
            const totalServicos = feitos.length + avulsas.reduce((acc, c) => acc + Number(c.quantidade), 0);
            const ticketMedio = totalServicos > 0 ? comissaoTotalBarbeiro / totalServicos : 0;

            return (
              <ComissaoBarbeiroCard
                key={b.id}
                nome={b.nome}
                avatarUrl={b.avatar_url || ""}
                minutos={resumo.minutos}
                percentual={percentual}
                comissao={comissaoTotalBarbeiro}
                ticketMedio={ticketMedio}
                tipos={{}}
                tipoServicoIcone={{}}
                onClick={() => setBarbeiroDetalhe(b)}
              />
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Barbeiro */}
      <Dialog open={!!barbeiroDetalhe} onOpenChange={(open) => { if (!open) setBarbeiroDetalhe(null); }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar src={barbeiroDetalhe?.avatar_url || ""} name={barbeiroDetalhe?.nome} />
              <div>
                <div className="font-semibold">{barbeiroDetalhe?.nome}</div>
                <div className="text-xs text-muted-foreground">Detalhamento de Comissão</div>
              </div>
            </div>
          </DialogHeader>
          <div>
            {barbeiroDetalhe && (() => {
              const feitos = realizados.filter((r) => r.barbeiro_id === barbeiroDetalhe.id);
              const minutos = feitos.reduce((acc, r) => acc + (r.servico?.tempo_minutos || 0), 0);
              const percentual = totalMinutosMes > 0 ? minutos / totalMinutosMes : 0;
              const comissaoAssinatura = comissaoTotal * percentual;
              const avulsas = comissoesAvulsas.filter((c) => c.profissional_id === barbeiroDetalhe.id);
              const totalAvulsa = avulsas.reduce((acc, c) => acc + Number(c.valor_comissao) * Number(c.quantidade), 0);
              const totalServicos = feitos.length + avulsas.reduce((acc, c) => acc + Number(c.quantidade), 0);
              const ticketMedio = totalServicos > 0 ? (comissaoAssinatura + totalAvulsa) / totalServicos : 0;
              // Metas de produtos
              let faixas = (faixasPorBarbeiro[barbeiroDetalhe.id] || []).slice();
              faixas = faixas
                .filter((f) => !f.tipo || f.tipo === "produtos")
                .sort((a, b) => (a.quantidade || 0) - (b.quantidade || 0))
                .slice(0, 3);
              const vendidos = vendasProdutos
                .filter((v) => v.barbeiro_id === barbeiroDetalhe.id)
                .reduce((acc: number, v) => acc + Number(v.quantidade || 0), 0);
              const proximaMeta = faixas.find((f) => vendidos < Number(f.quantidade || 0));
              const faltamProx = proximaMeta ? Math.max(0, Number(proximaMeta.quantidade) - vendidos) : 0;

              return (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[{label:'Minutos no mês', value:minutos}, {label:'Ticket Médio', value:`R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}, {label:'Comissão Assinatura', value:`R$ ${comissaoAssinatura.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}, {label:'Comissão Avulsa', value:`R$ ${totalAvulsa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}].map((k, i)=> (
                      <Card key={i} className="border border-border rounded-lg p-3">
                        <div className="text-[11px] text-muted-foreground">{k.label}</div>
                        <div className="text-xl font-bold">{k.value}</div>
                      </Card>
                    ))}
                  </div>

                  <Card className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="font-semibold">Metas de Produtos</div>
                        <div className="text-xs text-muted-foreground">Vendas no mês: <span className="text-red-500 font-semibold">{vendidos}</span></div>
                      </div>
                      {faixas.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Nenhuma meta cadastrada</div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {faixas.map((f, idx) => {
                            const alvo = Number(f.quantidade || 0);
                            const progresso = alvo > 0 ? Math.min(100, Math.round((vendidos / alvo) * 100)) : 0;
                            const atingida = vendidos >= alvo;
                            return (
                              <div key={idx} className="w-full">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <div className="font-medium">Meta {idx + 1}</div>
                                  <div className={`${atingida ? 'text-green-400' : 'text-muted-foreground'} font-semibold`}>{vendidos}/{alvo}</div>
                                </div>
                                <Progress value={progresso} />
                                <div className="text-[11px] text-muted-foreground mt-1">{atingida ? 'Concluída' : `Faltam ${Math.max(0, alvo - vendidos)} produtos`}</div>
                              </div>
                            );
                          })}
                          <div className="text-[11px] text-muted-foreground">
                            {proximaMeta ? (
                              <>Próx. meta: faltam <span className="font-semibold text-red-500">{faltamProx}</span> produtos</>
                            ) : (
                              <span className="font-semibold text-green-400">Todas as metas batidas!</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBarbeiroDetalhe(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

 




