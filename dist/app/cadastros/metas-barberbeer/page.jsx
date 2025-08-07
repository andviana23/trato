"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@nextui-org/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, XCircleIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import { createClient } from "@supabase/supabase-js";
import { useUnidade } from "@/components/UnidadeContext";
// Configure o Supabase
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const MESES = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
];
const ANOS = ['2024', '2025', '2026', '2027', '2028'];
export default function MetasBarberBeer() {
    const [metas, setMetas] = useState([]);
    const [barbeiros, setBarbeiros] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingMeta, setEditingMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const { unidade } = useUnidade();
    // Estado do formulário
    const [form, setForm] = useState({
        barbeiro_id: '',
        mes: '',
        ano: '',
        meta_venda_produto: 0,
        meta_faturamento: 0,
        tipo_bonificacao: 'fixo',
        valor_bonificacao: 0,
        quantidade_produtos: 0, // Adicionado para armazenar a quantidade de produtos
    });
    // Carregar barbeiros da unidade selecionada
    useEffect(() => {
        async function fetchBarbeiros() {
            let query = supabase
                .from('profissionais')
                .select('id, nome')
                .eq('funcao', 'barbeiro');
            // IDs das unidades (ajuste conforme necessário)
            const unidades = {
                'Trato de Barbados': '244c0543-7108-4892-9eac-48186ad1d5e7',
                'BARBER BEER SPORT CLUB': '87884040-cafc-4625-857b-6e0402ede7d7',
            };
            if (unidade && unidades[unidade]) {
                query = query.eq('unidade_id', unidades[unidade]);
            }
            const { data } = await query.order('nome');
            setBarbeiros(data || []);
        }
        fetchBarbeiros();
    }, [unidade]);
    // Carregar metas
    useEffect(() => {
        fetchMetas();
    }, []);
    // Verificar conexão e tabelas no carregamento
    useEffect(() => {
        async function verificarSistema() {
            try {
                console.log("🔍 Verificando sistema de Metas...");
                // Verificar conexão com Supabase
                const { data, error } = await supabase
                    .from('profissionais')
                    .select('count')
                    .limit(1);
                if (error) {
                    console.error("❌ Erro na conexão com Supabase:", error);
                    toast.error("Erro na conexão com o banco de dados");
                    return;
                }
                console.log("✅ Conexão com Supabase OK");
                // Verificar tabela de metas
                const { error: errorMetas } = await supabase
                    .from('metas_barberbeer')
                    .select('count')
                    .limit(1);
                if (errorMetas) {
                    console.error("❌ Tabela metas_barberbeer não encontrada:", errorMetas);
                    toast.error("Tabela de Metas não encontrada. Execute o script SQL primeiro.");
                    return;
                }
                console.log("✅ Tabela metas_barberbeer OK");
            }
            catch (error) {
                console.error("❌ Erro ao verificar sistema:", error);
                toast.error("Erro ao verificar sistema");
            }
        }
        verificarSistema();
    }, []);
    async function fetchMetas() {
        setLoading(true);
        const { data } = await supabase
            .from('metas_barberbeer')
            .select(`
        *,
        profissionais!inner(nome)
      `)
            .order('criado_em', { ascending: false });
        if (data) {
            const metasComNome = data.map(meta => {
                var _a;
                return (Object.assign(Object.assign({}, meta), { barbeiro_nome: (_a = meta.profissionais) === null || _a === void 0 ? void 0 : _a.nome }));
            });
            setMetas(metasComNome);
        }
        setLoading(false);
    }
    // Salvar meta
    async function salvarMeta() {
        if (!form.barbeiro_id || !form.mes || !form.ano) {
            toast.error('Preencha todos os campos obrigatórios!');
            return;
        }
        try {
            if (editingMeta) {
                // Editar meta existente
                const { error } = await supabase
                    .from('metas_barberbeer')
                    .update(form)
                    .eq('id', editingMeta.id);
                if (error)
                    throw error;
                toast.success('Meta atualizada com sucesso!');
            }
            else {
                // Criar nova meta
                const { error } = await supabase
                    .from('metas_barberbeer')
                    .insert(form);
                if (error)
                    throw error;
                toast.success('Meta criada com sucesso!');
            }
            setModalOpen(false);
            setEditingMeta(null);
            resetForm();
            fetchMetas();
        }
        catch (error) {
            console.error('Erro ao salvar meta:', error);
            toast.error('Erro ao salvar meta!');
        }
    }
    // Excluir meta
    async function excluirMeta(id) {
        if (!confirm('Tem certeza que deseja excluir esta meta?'))
            return;
        try {
            const { error } = await supabase
                .from('metas_barberbeer')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            toast.success('Meta excluída com sucesso!');
            fetchMetas();
        }
        catch (error) {
            console.error('Erro ao excluir meta:', error);
            toast.error('Erro ao excluir meta!');
        }
    }
    // Editar meta
    function editarMeta(meta) {
        setEditingMeta(meta);
        setForm({
            barbeiro_id: meta.barbeiro_id,
            mes: meta.mes,
            ano: meta.ano,
            meta_venda_produto: meta.meta_venda_produto,
            meta_faturamento: meta.meta_faturamento,
            tipo_bonificacao: meta.tipo_bonificacao,
            valor_bonificacao: meta.valor_bonificacao,
            quantidade_produtos: meta.quantidade_produtos || 0, // Adicionado para armazenar a quantidade de produtos
        });
        setModalOpen(true);
    }
    // Resetar formulário
    function resetForm() {
        setForm({
            barbeiro_id: '',
            mes: '',
            ano: '',
            meta_venda_produto: 0,
            meta_faturamento: 0,
            tipo_bonificacao: 'fixo',
            valor_bonificacao: 0,
            quantidade_produtos: 0, // Adicionado para armazenar a quantidade de produtos
        });
    }
    // Abrir modal para nova meta
    function abrirModalNovaMeta() {
        setEditingMeta(null);
        resetForm();
        setModalOpen(true);
    }
    // Fechar modal
    function fecharModal() {
        setModalOpen(false);
        setEditingMeta(null);
        resetForm();
    }
    // Formatar valor monetário
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }
    // Obter nome do mês
    function getNomeMes(mes) {
        var _a;
        return ((_a = MESES.find(m => m.value === mes)) === null || _a === void 0 ? void 0 : _a.label) || mes;
    }
    return (<div className="max-w-7xl mx-auto p-4">
      <Toaster />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas - BarberBeer</h1>
          <p className="text-gray-600">Gerencie as metas individuais dos barbeiros</p>
        </div>
        <Button onClick={abrirModalNovaMeta} className="bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="w-4 h-4 mr-2"/>
          Adicionar Meta
        </Button>
      </div>

      {/* Tabela de Metas */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (<div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando metas...</p>
            </div>) : metas.length === 0 ? (<div className="text-center py-8">
              <p className="text-gray-600">Nenhuma meta cadastrada</p>
            </div>) : (<div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Barbeiro</th>
                    <th className="text-left py-3 px-4">Período</th>
                    <th className="text-left py-3 px-4">Quantidade de Produtos</th>
                    <th className="text-left py-3 px-4">Bonificação</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {metas.map((meta) => (<tr key={meta.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{meta.barbeiro_nome}</td>
                      <td className="py-3 px-4">{getNomeMes(meta.mes)}/{meta.ano}</td>
                      <td className="py-3 px-4">{meta.quantidade_produtos || 0}</td>
                      <td className="py-3 px-4">
                        {meta.tipo_bonificacao === 'fixo'
                    ? formatarMoeda(meta.valor_bonificacao)
                    : `${meta.valor_bonificacao}%`}
                      </td>
                      <td className="py-3 px-4">
                        {meta.foi_batida ? (<Badge className="bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-4 h-4 mr-1"/>
                            Meta Batida
                          </Badge>) : (<Badge variant="secondary">
                            <XCircleIcon className="w-4 h-4 mr-1"/>
                            Em Andamento
                          </Badge>)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => editarMeta(meta)}>
                            <PencilIcon className="w-4 h-4"/>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => excluirMeta(meta.id)} className="text-red-600 hover:text-red-700">
                            <TrashIcon className="w-4 h-4"/>
                          </Button>
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </CardContent>
      </Card>

      {/* Modal */}
      {modalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMeta ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            
            <div className="space-y-4">
              {/* Barbeiro */}
              <div>
                <label className="block text-sm font-medium mb-1">Barbeiro *</label>
                <Select value={form.barbeiro_id} onValueChange={(value) => setForm(Object.assign(Object.assign({}, form), { barbeiro_id: value }))}>
                  <Select.Trigger>
                    <Select.Value placeholder="Selecione o barbeiro"/>
                  </Select.Trigger>
                  <Select.Content>
                    {barbeiros.map((barbeiro) => (<Select.Item key={barbeiro.id} value={barbeiro.id}>
                        {barbeiro.nome}
                      </Select.Item>))}
                  </Select.Content>
                </Select>
              </div>

              {/* Mês e Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mês *</label>
                  <Select value={form.mes} onValueChange={(value) => setForm(Object.assign(Object.assign({}, form), { mes: value }))}>
                    <Select.Trigger>
                      <Select.Value placeholder="Mês"/>
                    </Select.Trigger>
                    <Select.Content>
                      {MESES.map((mes) => (<Select.Item key={mes.value} value={mes.value}>
                          {mes.label}
                        </Select.Item>))}
                    </Select.Content>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ano *</label>
                  <Select value={form.ano} onValueChange={(value) => setForm(Object.assign(Object.assign({}, form), { ano: value }))}>
                    <Select.Trigger>
                      <Select.Value placeholder="Ano"/>
                    </Select.Trigger>
                    <Select.Content>
                      {ANOS.map((ano) => (<Select.Item key={ano} value={ano}>
                          {ano}
                        </Select.Item>))}
                    </Select.Content>
                  </Select>
                </div>
              </div>

              {/* Quantidade de Produtos */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Quantidade de Produtos</label>
                <Input type="number" min={0} value={form.quantidade_produtos || 0} onChange={e => setForm(Object.assign(Object.assign({}, form), { quantidade_produtos: parseInt(e.target.value) || 0 }))} placeholder="0"/>
              </div>

              {/* Bonificação */}
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Bonificação</label>
                <Select value={form.tipo_bonificacao} onValueChange={(value) => setForm(Object.assign(Object.assign({}, form), { tipo_bonificacao: value }))}>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="fixo">Valor Fixo (R$)</Select.Item>
                    <Select.Item value="percentual">Porcentagem (%)</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Valor da Bonificação {form.tipo_bonificacao === 'fixo' ? '(R$)' : '(%)'}
                </label>
                <Input type="number" step="0.01" value={form.valor_bonificacao} onChange={(e) => setForm(Object.assign(Object.assign({}, form), { valor_bonificacao: parseFloat(e.target.value) || 0 }))} placeholder={form.tipo_bonificacao === 'fixo' ? '0,00' : '0'}/>
              </div>
            </div>

            {/* Lista de metas cadastradas */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Metas já cadastradas</h3>
              <div className="max-h-48 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-1">Barbeiro</th>
                      <th className="text-left p-1">Mês</th>
                      <th className="text-left p-1">Ano</th>
                      <th className="text-left p-1">Quantidade de Produtos</th>
                      <th className="text-left p-1">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metas
                .filter(meta => !form.barbeiro_id || meta.barbeiro_id === form.barbeiro_id)
                .map(meta => {
                var _a;
                return (<tr key={meta.id} className="border-b">
                          <td className="p-1">{((_a = barbeiros.find(b => b.id === meta.barbeiro_id)) === null || _a === void 0 ? void 0 : _a.nome) || meta.barbeiro_nome || '-'}</td>
                          <td className="p-1">{getNomeMes(meta.mes)}</td>
                          <td className="p-1">{meta.ano}</td>
                          <td className="p-1">{meta.quantidade_produtos || 0}</td>
                          <td className="p-1">
                            <div className="flex gap-1">
                              <Button size="xs" variant="outline" onClick={() => editarMeta(meta)}>
                                <PencilIcon className="w-4 h-4"/>
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => excluirMeta(meta.id)} className="text-red-600 hover:text-red-700">
                                <TrashIcon className="w-4 h-4"/>
                              </Button>
                            </div>
                          </td>
                        </tr>);
            })}
                  </tbody>
                </table>
                {metas.filter(meta => !form.barbeiro_id || meta.barbeiro_id === form.barbeiro_id).length === 0 && (<div className="text-gray-500 text-center py-2">Nenhuma meta cadastrada.</div>)}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 mt-6">
              <Button onClick={salvarMeta} className="flex-1">
                {editingMeta ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button onClick={fecharModal} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </div>)}
    </div>);
}
