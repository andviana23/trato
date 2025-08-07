"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Avatar, Chip, RadioGroup, Radio, Select, SelectItem } from "@nextui-org/react";
import { PlusIcon, UserIcon, EnvelopeIcon, PhoneIcon, UsersIcon, TrashIcon, PencilIcon, BuildingOffice2Icon } from "@heroicons/react/24/outline";
import LayoutCadastros from "../../../components/LayoutCadastros";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff';
const funcaoOptions = [
    { value: "barbeiro", label: "Barbeiro", icon: <UsersIcon className="w-4 h-4"/> },
    { value: "recepcionista", label: "Recepcionista", icon: <UserIcon className="w-4 h-4"/> },
];
export default function PaginaProfissionais() {
    const [profissionais, setProfissionais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDelete, setModalDelete] = useState(false);
    const [profissionalEdit, setProfissionalEdit] = useState(null);
    const [profissionalDelete, setProfissionalDelete] = useState(null);
    const [form, setForm] = useState({ nome: "", telefone: "", email: "", data_nascimento: "", funcao: "barbeiro", senha: "", unidade_id: "" });
    const [erro, setErro] = useState("");
    const [saving, setSaving] = useState(false);
    const [busca, setBusca] = useState("");
    const [unidades, setUnidades] = useState([]);
    const [unidadeSelecionada, setUnidadeSelecionada] = useState("");
    const [modalUnidade, setModalUnidade] = useState(false);
    const [formUnidade, setFormUnidade] = useState({ nome: "", endereco: "", telefone: "" });
    const [unidadeEdit, setUnidadeEdit] = useState(null);
    const [erroUnidade, setErroUnidade] = useState("");
    const [savingUnidade, setSavingUnidade] = useState(false);
    const [novaSenha, setNovaSenha] = useState("");
    const [showResetSenha, setShowResetSenha] = useState(false);
    async function fetchProfissionais() {
        setLoading(true);
        if (!unidadeSelecionada) {
            setProfissionais([]);
            setLoading(false);
            return;
        }
        const { data } = await supabase.from("profissionais").select("*").eq("unidade_id", unidadeSelecionada).order("created_at", { ascending: false });
        setProfissionais(data || []);
        setLoading(false);
    }
    useEffect(() => { fetchProfissionais(); }, [unidadeSelecionada]);
    function openNovo() {
        setProfissionalEdit(null);
        setForm({
            nome: "",
            telefone: "",
            email: "",
            data_nascimento: "",
            funcao: "barbeiro",
            senha: "",
            unidade_id: "87884040-cafc-4625-857b-6e0402ede7d7" // Força sempre BarberBeer
        });
        setErro("");
        setModalOpen(true);
    }
    function openEditar(p) {
        setProfissionalEdit(p);
        setForm({
            nome: p.nome,
            telefone: p.telefone,
            email: p.email,
            data_nascimento: p.data_nascimento || "",
            funcao: p.funcao,
            senha: "",
            unidade_id: p.unidade_id || unidadeSelecionada
        });
        setErro("");
        setModalOpen(true);
    }
    async function salvarProfissional() {
        setSaving(true);
        setErro("");
        // Força sempre BarberBeer
        const unidadeIdBarberBeer = "87884040-cafc-4625-857b-6e0402ede7d7";
        let result;
        if (!form.nome || !form.telefone || !form.email || !form.funcao || !form.senha) {
            setErro("Preencha todos os campos obrigatórios.");
            setSaving(false);
            return;
        }
        if (profissionalEdit) {
            // Corrigido: agora salva a unidade selecionada no formulário
            result = await supabase.from("profissionais").update(Object.assign(Object.assign({}, form), { senha: undefined })).eq("id", profissionalEdit.id).select();
            if (result.error) {
                setErro(result.error.message);
                setSaving(false);
                return;
            }
        }
        else {
            try {
                const payload = {
                    nome: form.nome,
                    email: form.email,
                    funcao: form.funcao,
                    senha: form.senha,
                    telefone: form.telefone,
                    unidade_id: unidadeIdBarberBeer
                };
                if (form.data_nascimento)
                    payload.data_nascimento = form.data_nascimento;
                const res = await fetch("/api/profissionais/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.error || "Erro ao cadastrar profissional");
            }
            catch (err) {
                setErro(err.message);
                setSaving(false);
                return;
            }
        }
        setModalOpen(false);
        setSaving(false);
        fetchProfissionais();
    }
    function openDelete(p) {
        setProfissionalDelete(p);
        setModalDelete(true);
    }
    async function excluirProfissional() {
        if (!profissionalDelete)
            return;
        await supabase.from("profissionais").delete().eq("id", profissionalDelete.id);
        setModalDelete(false);
        setProfissionalDelete(null);
        fetchProfissionais();
    }
    // CRUD de Unidades
    async function fetchUnidades() {
        const { data } = await supabase.from("unidades").select("*").order("nome");
        setUnidades(data || []);
        if (!unidadeSelecionada && data && data.length > 0)
            setUnidadeSelecionada(data[0].id);
    }
    useEffect(() => { fetchUnidades(); }, []);
    function openNovaUnidade() {
        setUnidadeEdit(null);
        setFormUnidade({ nome: "", endereco: "", telefone: "" });
        setErroUnidade("");
        setModalUnidade(true);
    }
    function openEditarUnidade(u) {
        setUnidadeEdit(u);
        setFormUnidade({ nome: u.nome, endereco: u.endereco || "", telefone: u.telefone || "" });
        setErroUnidade("");
        setModalUnidade(true);
    }
    async function salvarUnidade() {
        setSavingUnidade(true);
        setErroUnidade("");
        if (!formUnidade.nome) {
            setErroUnidade("Nome obrigatório");
            setSavingUnidade(false);
            return;
        }
        if (unidadeEdit) {
            const { error } = await supabase.from("unidades").update(formUnidade).eq("id", unidadeEdit.id);
            if (error) {
                setErroUnidade(error.message);
                setSavingUnidade(false);
                return;
            }
        }
        else {
            const { error } = await supabase.from("unidades").insert([formUnidade]);
            if (error) {
                setErroUnidade(error.message);
                setSavingUnidade(false);
                return;
            }
        }
        setModalUnidade(false);
        setSavingUnidade(false);
        fetchUnidades();
    }
    async function excluirUnidade(id) {
        await supabase.from("unidades").delete().eq("id", id);
        fetchUnidades();
    }
    // Estatísticas
    const total = profissionais.length;
    const barbeiros = profissionais.filter(p => p.funcao === "barbeiro").length;
    const recepcionistas = profissionais.filter(p => p.funcao === "recepcionista").length;
    // Função para redefinir senha no Supabase Auth
    async function redefinirSenha() {
        if (!(profissionalEdit === null || profissionalEdit === void 0 ? void 0 : profissionalEdit.user_id) || !novaSenha) {
            setErro("Usuário ou nova senha inválidos.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/profissionais/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: profissionalEdit.user_id, novaSenha })
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Erro ao redefinir senha");
            setShowResetSenha(false);
            setNovaSenha("");
            setErro("");
            alert("Senha redefinida com sucesso!");
        }
        catch (err) {
            setErro(err.message);
        }
        finally {
            setSaving(false);
        }
    }
    return (<LayoutCadastros titulo="Profissionais">
      <div className="container mx-auto max-w-6xl px-2 md:px-0 py-8">
        {/* Breadcrumbs/Contexto */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <BuildingOffice2Icon className="w-6 h-6 text-blue-600"/>
          <span className="font-semibold text-blue-700">Unidade:</span>
          <Select aria-label="Selecionar unidade" className="max-w-xs" selectedKeys={unidadeSelecionada ? [unidadeSelecionada] : []} onChange={e => setUnidadeSelecionada(e.target.value)} size="sm" radius="sm" variant="bordered">
            {unidades.map(u => (<SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>))}
          </Select>
          <Button color="secondary" variant="solid" onClick={openNovaUnidade} className="ml-2 font-bold shadow-md" size="sm">
            <PlusIcon className="w-4 h-4 mr-1"/>Cadastrar Unidades
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg border-t-4 border-blue-500">
            <CardBody className="text-center">
              <h3 className="text-3xl font-extrabold text-blue-600">{total}</h3>
              <p className="text-base text-gray-600">Total de Profissionais</p>
            </CardBody>
          </Card>
          <Card className="shadow-lg border-t-4 border-green-500">
            <CardBody className="text-center">
              <h3 className="text-3xl font-extrabold text-green-600">{barbeiros}</h3>
              <p className="text-base text-gray-600">Barbeiros</p>
            </CardBody>
          </Card>
          <Card className="shadow-lg border-t-4 border-purple-500">
            <CardBody className="text-center">
              <h3 className="text-3xl font-extrabold text-purple-600">{recepcionistas}</h3>
              <p className="text-base text-gray-600">Recepcionistas</p>
            </CardBody>
          </Card>
        </div>

        {/* Busca e Botão Novo */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Input placeholder="Buscar por nome, email ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} startContent={<UserIcon className="w-4 h-4"/>} className="max-w-xs" size="sm" radius="sm" variant="bordered"/>
          <Button color="primary" startContent={<PlusIcon className="w-4 h-4"/>} onClick={openNovo} className="shadow-md self-end md:self-auto font-bold" size="md">
            Novo Profissional
          </Button>
        </div>

        {/* Lista de Profissionais */}
        <Card className="shadow-lg border border-gray-100 mb-10">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <Table aria-label="Lista de profissionais" removeWrapper className="min-w-full text-sm">
                <TableHeader>
                  <TableColumn>NOME</TableColumn>
                  <TableColumn>FUNÇÃO</TableColumn>
                  <TableColumn>TELEFONE</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>NASC.</TableColumn>
                  <TableColumn>AÇÕES</TableColumn>
                </TableHeader>
                <TableBody emptyContent={loading ? "Carregando..." : "Nenhum profissional cadastrado"}>
                  {profissionais.filter(p => !busca ||
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.email.toLowerCase().includes(busca.toLowerCase()) ||
            p.telefone.toLowerCase().includes(busca.toLowerCase())).map((p) => (<TableRow key={p.id} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar src={p.avatar_url || DEFAULT_AVATAR} name={p.nome} size="sm"/>
                          <span className="font-medium text-gray-900 dark:text-white">{p.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip color={p.funcao === "barbeiro" ? "success" : "secondary"} variant="flat">
                          {p.funcao === "barbeiro" ? "Barbeiro" : "Recepcionista"}
                        </Chip>
                      </TableCell>
                      <TableCell>{p.telefone ? p.telefone : ''}</TableCell>
                      <TableCell>{p.email ? p.email : ''}</TableCell>
                      <TableCell>{p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button isIconOnly size="sm" variant="light" onClick={() => openEditar(p)} title="Editar" className="hover:bg-blue-100">
                            <PencilIcon className="w-4 h-4"/>
                          </Button>
                          <Button isIconOnly size="sm" color="danger" variant="light" onClick={() => openDelete(p)} title="Excluir" className="hover:bg-red-100">
                            <TrashIcon className="w-4 h-4"/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </div>
          </CardBody>
        </Card>

        {/* Modal Cadastro/Edição Profissional */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="xl">
          <ModalContent>
            <ModalHeader className="font-bold text-lg border-b">{profissionalEdit ? "Editar Profissional" : "Novo Profissional"}</ModalHeader>
            <ModalBody className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Unidade" value={form.unidade_id} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { unidade_id: e.target.value })))} isRequired className="mb-2" size="sm" radius="sm" variant="bordered">
                  {unidades.map(u => (<SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>))}
                </Select>
                <Input label="Nome" value={form.nome} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { nome: e.target.value })))} isRequired startContent={<UserIcon className="w-4 h-4"/>} size="sm" radius="sm" variant="bordered"/>
                <Input label="Telefone" value={form.telefone} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { telefone: e.target.value })))} isRequired startContent={<PhoneIcon className="w-4 h-4"/>} size="sm" radius="sm" variant="bordered"/>
                <Input label="Email" value={form.email} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { email: e.target.value })))} isRequired startContent={<EnvelopeIcon className="w-4 h-4"/>} size="sm" radius="sm" variant="bordered"/>
                <Input label="Senha" type="password" value={form.senha} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { senha: e.target.value })))} isRequired={!profissionalEdit} size="sm" radius="sm" variant="bordered"/>
                <Input label="Data de Nascimento" type="date" value={form.data_nascimento} onChange={e => setForm(f => (Object.assign(Object.assign({}, f), { data_nascimento: e.target.value })))} isRequired={false} size="sm" radius="sm" variant="bordered"/>
              </div>
              <RadioGroup label="Função" value={form.funcao} onValueChange={v => setForm(f => (Object.assign(Object.assign({}, f), { funcao: v })))} orientation="horizontal" className="mt-2">
                {funcaoOptions.map(opt => (<Radio key={opt.value} value={opt.value}>{opt.label}</Radio>))}
              </RadioGroup>
              {erro && <div className="text-red-600 text-sm mt-2">{erro}</div>}
              {profissionalEdit && (<div className="flex flex-col gap-2 mt-2">
                  {/* Botão para mostrar campo de redefinir senha */}
                  {!showResetSenha ? (<Button color="warning" variant="bordered" onClick={() => setShowResetSenha(true)}>
                      Redefinir Senha
                    </Button>) : (<div className="flex flex-col gap-2">
                      <Input label="Nova Senha" type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} isRequired size="sm" radius="sm" variant="bordered"/>
                      <div className="flex gap-2">
                        <Button color="success" onClick={redefinirSenha} isLoading={saving}>
                          Confirmar Nova Senha
                        </Button>
                        <Button color="default" variant="light" onClick={() => { setShowResetSenha(false); setNovaSenha(""); }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>)}
                </div>)}
            </ModalBody>
            <ModalFooter className="border-t pt-3">
              <Button variant="light" onClick={() => setModalOpen(false)} size="md">Cancelar</Button>
              <Button color="primary" isLoading={saving} onClick={salvarProfissional} size="md" className="font-bold shadow">{profissionalEdit ? "Salvar" : "Cadastrar"}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal de Unidades */}
        <Modal isOpen={modalUnidade} onClose={() => setModalUnidade(false)} size="md">
          <ModalContent>
            <ModalHeader className="font-bold text-lg border-b">{unidadeEdit ? "Editar Unidade" : "Nova Unidade"}</ModalHeader>
            <ModalBody className="space-y-3">
              <Input label="Nome da Unidade" value={formUnidade.nome} onChange={e => setFormUnidade(f => (Object.assign(Object.assign({}, f), { nome: e.target.value })))} isRequired startContent={<BuildingOffice2Icon className="w-4 h-4"/>} size="sm" radius="sm" variant="bordered"/>
              <Input label="Endereço" value={formUnidade.endereco} onChange={e => setFormUnidade(f => (Object.assign(Object.assign({}, f), { endereco: e.target.value })))} size="sm" radius="sm" variant="bordered"/>
              <Input label="Telefone" value={formUnidade.telefone} onChange={e => setFormUnidade(f => (Object.assign(Object.assign({}, f), { telefone: e.target.value })))} size="sm" radius="sm" variant="bordered"/>
              {erroUnidade && <div className="text-red-600 text-sm mt-2">{erroUnidade}</div>}
            </ModalBody>
            <ModalFooter className="border-t pt-3">
              <Button variant="light" onClick={() => setModalUnidade(false)} size="md">Cancelar</Button>
              <Button color="primary" isLoading={savingUnidade} onClick={salvarUnidade} size="md" className="font-bold shadow">{unidadeEdit ? "Salvar" : "Cadastrar"}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Modal Exclusão */}
        <Modal isOpen={modalDelete} onClose={() => setModalDelete(false)} size="sm">
          <ModalContent>
            <ModalHeader className="font-bold text-lg border-b">Excluir Profissional</ModalHeader>
            <ModalBody>
              <p className="text-base">Tem certeza que deseja excluir o profissional <span className="font-semibold">{profissionalDelete === null || profissionalDelete === void 0 ? void 0 : profissionalDelete.nome}</span>?</p>
            </ModalBody>
            <ModalFooter className="border-t pt-3">
              <Button variant="light" onClick={() => setModalDelete(false)} size="md">Cancelar</Button>
              <Button color="danger" onClick={excluirProfissional} size="md" className="font-bold shadow">Excluir</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </LayoutCadastros>);
}
