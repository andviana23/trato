"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from "@nextui-org/react";
import { PlusIcon, TrashIcon, UserIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import dayjs from "dayjs";
const supabase = createClient();
export default function ComissaoAvulsaPage() {
    var _a;
    const [comissoes, setComissoes] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [profissionais, setProfissionais] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [servicos, setServicos] = useState([]);
    const [form, setForm] = useState({ profissional_id: "", unidade_id: "", servico_avulso_id: "", valor_comissao: "", quantidade: "" });
    const [erro, setErro] = useState("");
    const [saving, setSaving] = useState(false);
    // Novo fluxo sequencial do modal
    const [step, setStep] = useState(1);
    const [profissionalSelecionado, setProfissionalSelecionado] = useState("");
    const [mesSelecionado, setMesSelecionado] = useState(dayjs().format("YYYY-MM"));
    useEffect(() => {
        fetchUnidades();
        fetchComissoes();
    }, []);
    useEffect(() => {
        if (form.unidade_id)
            fetchProfissionais(form.unidade_id);
    }, [form.unidade_id]);
    async function openModal() {
        setForm({ profissional_id: "", unidade_id: "", servico_avulso_id: "", valor_comissao: "", quantidade: "" });
        setStep(1);
        setModalOpen(true);
    }
    async function handleUnidadeChange(unidadeId) {
        setForm(f => (Object.assign(Object.assign({}, f), { unidade_id: unidadeId, profissional_id: "", servico_avulso_id: "" })));
        await fetchProfissionais(unidadeId);
        await fetchServicos(unidadeId);
        setStep(2);
    }
    async function handleProfissionalChange(profissionalId) {
        setForm(f => (Object.assign(Object.assign({}, f), { profissional_id: profissionalId })));
        setStep(3);
    }
    async function fetchProfissionais(unidadeId) {
        // Filtra apenas barbeiros da unidade BarberBeer
        const BARBERBEER_ID = '87884040-cafc-4625-857b-6e0402ede7d7';
        const { data } = await supabase.from("profissionais").select("id, nome, funcao, unidade_id").eq("unidade_id", BARBERBEER_ID).eq("funcao", "barbeiro").order("nome");
        setProfissionais(data || []);
        if (data && data.length > 0)
            setForm(f => (Object.assign(Object.assign({}, f), { profissional_id: data[0].id })));
    }
    async function fetchUnidades() {
        const { data } = await supabase.from("unidades").select("id, nome").order("nome");
        setUnidades(data || []);
        if (data && data.length > 0 && !form.unidade_id)
            setForm(f => (Object.assign(Object.assign({}, f), { unidade_id: data[0].id })));
    }
    async function fetchServicos(unidadeId) {
        const { data } = await supabase.from("servicos_avulsos").select("id, nome").eq("unidade_id", unidadeId).order("nome");
        setServicos(data || []);
        if (data && data.length > 0)
            setForm(f => (Object.assign(Object.assign({}, f), { servico_avulso_id: data[0].id })));
    }
    async function fetchComissoes() {
        const { data } = await supabase.from("comissoes_avulsas").select("*, profissionais(nome), unidades(nome), servicos_avulsos(nome)").order("data_lancamento", { ascending: false });
        setComissoes(data || []);
    }
    async function fetchComissoesPorMes(mes) {
        const inicio = dayjs(mes).startOf("month").format("YYYY-MM-DD");
        const fim = dayjs(mes).endOf("month").format("YYYY-MM-DD");
        const { data } = await supabase.from("comissoes_avulsas").select("*, profissionais(nome), unidades(nome), servicos_avulsos(nome, tempo_minutos)")
            .gte("data_lancamento", inicio)
            .lte("data_lancamento", fim)
            .order("data_lancamento", { ascending: false });
        setComissoes(data || []);
    }
    useEffect(() => {
        fetchComissoesPorMes(mesSelecionado);
    }, [mesSelecionado]);
    async function salvarComissao() {
        setSaving(true);
        setErro("");
        if (!form.profissional_id || !form.unidade_id || !form.servico_avulso_id || !form.valor_comissao || !form.quantidade) {
            setErro("Preencha todos os campos obrigatórios.");
            setSaving(false);
            return;
        }
        await supabase.from("comissoes_avulsas").insert({
            profissional_id: form.profissional_id,
            unidade_id: form.unidade_id,
            servico_avulso_id: form.servico_avulso_id,
            valor_comissao: Number(form.valor_comissao),
            quantidade: Number(form.quantidade)
        });
        setModalOpen(false);
        setSaving(false);
        setForm(f => (Object.assign(Object.assign({}, f), { valor_comissao: "", quantidade: "" })));
        fetchComissoes();
    }
    async function excluirComissao(id) {
        await supabase.from("comissoes_avulsas").delete().eq("id", id);
        fetchComissoes();
    }
    // Agrupar comissões por profissional (apenas barbeiros da BarberBeer)
    const BARBERBEER_ID = '87884040-cafc-4625-857b-6e0402ede7d7';
    const barbeirosBarberBeer = profissionais.filter((p) => p.unidade_id === BARBERBEER_ID && p.funcao === 'barbeiro');
    const comissoesPorProfissional = barbeirosBarberBeer.map((p) => {
        const comissoesProf = comissoes.filter((c) => c.profissional_id === p.id);
        const valorTotal = comissoesProf.reduce((acc, c) => acc + (Number(c.valor_comissao) * Number(c.quantidade)), 0);
        const tempoTotal = comissoesProf.reduce((acc, c) => { var _a; return acc + (((_a = c.servicos_avulsos) === null || _a === void 0 ? void 0 : _a.tempo_minutos) ? Number(c.servicos_avulsos.tempo_minutos) * Number(c.quantidade) : 0); }, 0);
        return Object.assign(Object.assign({}, p), { comissoes: comissoesProf, valorTotal, tempoTotal });
    });
    const profissionalAtivo = comissoesPorProfissional.find(p => p.id === profissionalSelecionado) || comissoesPorProfissional[0];
    return (<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pb-10">
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="font-semibold text-blue-700">Dashboard</span>
            <span className="mx-1">/</span>
            <span className="font-semibold text-blue-700">Distribuição BBSC</span>
            <span className="mx-1">/</span>
            <span className="font-bold text-gray-900">Comissão Avulsa</span>
          </div>
          <div className="flex gap-4 items-center">
            <input type="month" value={mesSelecionado} onChange={e => setMesSelecionado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm" style={{ minWidth: 140 }}/>
            <Button color="primary" startContent={<PlusIcon className="w-5 h-5"/>} onClick={openModal} className="w-full md:w-auto text-base font-semibold shadow-lg h-12 rounded-xl bg-blue-700 hover:bg-blue-800 transition">Lançar Comissão Avulsa</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-10 flex flex-col md:flex-row gap-10">
        {/* Lista lateral de profissionais */}
        <div className="w-full md:w-1/4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 mb-6 tracking-tight">Profissionais</h2>
          <div className="flex flex-col gap-5">
            {comissoesPorProfissional.length === 0 ? (<Card className="shadow-md rounded-2xl">
                <CardBody className="text-center text-gray-400 py-8">Nenhum profissional encontrado.</CardBody>
              </Card>) : (comissoesPorProfissional.map((p) => {
            var _a;
            return (<Card key={p.id} isPressable onPress={() => setProfissionalSelecionado(p.id)} className={`rounded-2xl shadow-md border-2 transition-all duration-200 ${profissionalSelecionado === p.id || (!profissionalSelecionado && p === comissoesPorProfissional[0]) ? "border-blue-600 bg-blue-50 scale-[1.03]" : "border-gray-100 bg-white hover:scale-[1.01] hover:shadow-lg"} cursor-pointer group`}>
                  <CardHeader className="flex items-center gap-3 pb-0">
                    <div className={`rounded-full bg-blue-100 p-2 flex items-center justify-center ${profissionalSelecionado === p.id ? "ring-2 ring-blue-400" : ""}`}>
                      <UserIcon className="w-7 h-7 text-blue-400"/>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <span className="font-bold text-base text-gray-800 group-hover:text-blue-700 transition-colors">{(_a = p.nome) === null || _a === void 0 ? void 0 : _a.split(" ")[0]}</span>
                      <span className="text-xs text-gray-500 mt-1">Total: <span className="font-bold text-blue-700">R$ {p.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span>
                      <span className="text-xs text-gray-500 mt-1">Minutos: <span className="font-bold text-blue-700">{p.tempoTotal}</span></span>
                    </div>
                  </CardHeader>
                </Card>);
        }))}
          </div>
        </div>
        {/* Detalhes do profissional selecionado */}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800 mb-6 tracking-tight">Serviços Avulsos de <span className="text-blue-700">{(profissionalAtivo === null || profissionalAtivo === void 0 ? void 0 : profissionalAtivo.nome) || "-"}</span></h2>
          {profissionalAtivo && Array.isArray(profissionalAtivo.comissoes) ? (<>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
                <div className="flex gap-6 flex-wrap">
                  <span className="text-lg text-gray-700">Valor total: <span className="font-bold text-blue-700 text-xl">R$ {(_a = profissionalAtivo === null || profissionalAtivo === void 0 ? void 0 : profissionalAtivo.valorTotal) === null || _a === void 0 ? void 0 : _a.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></span>
                  <span className="text-lg text-gray-700">Minutos totais: <span className="font-bold text-blue-700 text-xl">{profissionalAtivo === null || profissionalAtivo === void 0 ? void 0 : profissionalAtivo.tempoTotal}</span></span>
                </div>
                <Button color="primary" startContent={<PlusIcon className="w-5 h-5"/>} onClick={openModal} className="text-base font-semibold shadow h-12 rounded-xl bg-blue-700 hover:bg-blue-800 transition">Lançar Comissão Avulsa</Button>
              </div>
              <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200 text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold text-gray-600 uppercase">Serviço</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase">Data</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase">Quantidade</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase">Valor Comissão</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase">Tempo Total (min)</th>
                      <th className="px-6 py-4 text-center font-bold text-gray-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profissionalAtivo.comissoes.length === 0 ? (<tr><td colSpan={6} className="text-center py-10 text-gray-400 text-lg">Nenhum serviço avulso encontrado.</td></tr>) : (profissionalAtivo.comissoes.map((c) => {
                var _a, _b;
                return (<tr key={c.id} className="bg-white hover:bg-blue-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">{((_a = c.servicos_avulsos) === null || _a === void 0 ? void 0 : _a.nome) || '-'}</td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">{c.data_lancamento ? new Date(c.data_lancamento).toLocaleDateString('pt-BR') : '-'}</td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">{c.quantidade}</td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">R$ {Number(c.valor_comissao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">{((_b = c.servicos_avulsos) === null || _b === void 0 ? void 0 : _b.tempo_minutos) ? Number(c.servicos_avulsos.tempo_minutos) * Number(c.quantidade) : 0}</td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <Button color="danger" size="sm" variant="flat" startContent={<TrashIcon className="w-4 h-4"/>} onClick={() => excluirComissao(c.id)} className="rounded-lg font-semibold px-4 py-2">Excluir</Button>
                          </td>
                        </tr>);
            }))}
                  </tbody>
                </table>
              </div>
            </>) : (<div className="text-center text-gray-400 py-10 text-lg">Nenhum profissional encontrado.</div>)}
        </div>
      </div>
      {/* Modal Lançar Comissão Avulsa */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <ModalContent>
          <ModalHeader>Lançar Comissão Avulsa</ModalHeader>
          <ModalBody>
            {step === 1 && (<Select label="Barbearia" selectedKeys={form.unidade_id ? [form.unidade_id] : []} onChange={e => handleUnidadeChange(e.target.value)} isRequired className="mb-2">
                {unidades.map((u) => (<SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>))}
              </Select>)}
            {step === 2 && (<Select label="Profissional" selectedKeys={form.profissional_id ? [form.profissional_id] : []} onChange={e => handleProfissionalChange(e.target.value)} isRequired className="mb-2">
                {profissionais.map((p) => (<SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>))}
              </Select>)}
            {step === 3 && (<>
                <Select label="Serviço" selectedKeys={form.servico_avulso_id ? [form.servico_avulso_id] : []} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { servico_avulso_id: e.target.value })))} isRequired className="mb-2">
                  {servicos.map((s) => (<SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>))}
                </Select>
                <Input label="Valor da Comissão (R$)" type="number" value={form.valor_comissao} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { valor_comissao: e.target.value })))} isRequired min={0} step={0.01} className="mb-2"/>
                <Input label="Quantidade de vezes realizado" type="number" value={form.quantidade} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { quantidade: e.target.value })))} isRequired min={1} className="mb-2"/>
                {erro && <div className="text-red-600 text-sm mt-2">{erro}</div>}
              </>)}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancelar</Button>
            {step > 1 && <Button variant="light" onClick={() => setStep(step - 1)}>Voltar</Button>}
            {step < 3 && <Button color="primary" onClick={() => setStep(step + 1)} disabled={step === 1 && !form.unidade_id || step === 2 && !form.profissional_id}>Avançar</Button>}
            {step === 3 && <Button color="primary" isLoading={saving} onClick={salvarComissao}>Cadastrar</Button>}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>);
}
