"use client";
import { useEffect, useState } from "react";
import { Card, CardBody, Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Avatar, Chip, RadioGroup, Radio, Breadcrumbs, BreadcrumbItem } from "@nextui-org/react";
import { PlusIcon, UserIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, UsersIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import LayoutCadastros from "../../../components/LayoutCadastros";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

const supabase = createClient();

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff';

const funcaoOptions = [
  { value: "barbeiro", label: "Barbeiro", icon: <UsersIcon className="w-4 h-4" /> },
  { value: "recepcionista", label: "Recepcionista", icon: <UserIcon className="w-4 h-4" /> },
];

export default function PaginaProfissionais() {
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  const [profissionalEdit, setProfissionalEdit] = useState<any | null>(null);
  const [profissionalDelete, setProfissionalDelete] = useState<any | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", data_nascimento: "", funcao: "barbeiro", senha: "" });
  const [erro, setErro] = useState("");
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");

  async function fetchProfissionais() {
    setLoading(true);
    const { data, error } = await supabase.from("profissionais").select("*").order("created_at", { ascending: false });
    setProfissionais(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchProfissionais(); }, []);

  function openNovo() {
    setProfissionalEdit(null);
    setForm({ nome: "", telefone: "", email: "", data_nascimento: "", funcao: "barbeiro", senha: "" });
    setErro("");
    setModalOpen(true);
  }
  function openEditar(p: any) {
    setProfissionalEdit(p);
    setForm({
      nome: p.nome,
      telefone: p.telefone,
      email: p.email,
      data_nascimento: p.data_nascimento || "",
      funcao: p.funcao,
      senha: ""
    });
    setErro("");
    setModalOpen(true);
  }
  async function salvarProfissional() {
    setSaving(true);
    setErro("");
    if (!form.nome || !form.telefone || !form.email || !form.funcao || (!profissionalEdit && !form.senha)) {
      setErro("Preencha todos os campos obrigatórios.");
      setSaving(false);
      return;
    }
    let result;
    if (profissionalEdit) {
      result = await supabase.from("profissionais").update({ ...form, senha: undefined }).eq("id", profissionalEdit.id).select();
      if (result.error) {
        setErro(result.error.message);
        setSaving(false);
        return;
      }
    } else {
      try {
        const payload: any = {
          nome: form.nome,
          email: form.email,
          funcao: form.funcao,
          senha: form.senha,
          telefone: form.telefone
        };
        if (form.data_nascimento) payload.data_nascimento = form.data_nascimento;
        const res = await fetch("/api/profissionais/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao cadastrar profissional");
      } catch (err: any) {
        setErro(err.message);
        setSaving(false);
        return;
      }
    }
    setModalOpen(false);
    setSaving(false);
    fetchProfissionais();
  }
  function openDelete(p: any) {
    setProfissionalDelete(p);
    setModalDelete(true);
  }
  async function excluirProfissional() {
    if (!profissionalDelete) return;
    await supabase.from("profissionais").delete().eq("id", profissionalDelete.id);
    setModalDelete(false);
    setProfissionalDelete(null);
    fetchProfissionais();
  }

  // Estatísticas
  const total = profissionais.length;
  const barbeiros = profissionais.filter(p => p.funcao === "barbeiro").length;
  const recepcionistas = profissionais.filter(p => p.funcao === "recepcionista").length;

  return (
    <LayoutCadastros titulo="Profissionais">
      {/* Header + Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardBody className="text-center"><h3 className="text-2xl font-bold text-blue-600">{total}</h3><p className="text-sm text-gray-600">Total</p></CardBody></Card>
        <Card><CardBody className="text-center"><h3 className="text-2xl font-bold text-green-600">{barbeiros}</h3><p className="text-sm text-gray-600">Barbeiros</p></CardBody></Card>
        <Card><CardBody className="text-center"><h3 className="text-2xl font-bold text-purple-600">{recepcionistas}</h3><p className="text-sm text-gray-600">Recepcionistas</p></CardBody></Card>
      </div>
      {/* Busca */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          startContent={<UserIcon className="w-4 h-4" />}
          className="max-w-xs"
        />
      </div>
      {/* Botão Novo */}
      <div className="flex justify-end mb-4">
        <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />} onClick={openNovo}>Novo Profissional</Button>
      </div>
      {/* Lista */}
      <Card>
        <CardBody>
          <Table aria-label="Lista de profissionais">
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>FUNÇÃO</TableColumn>
              <TableColumn>TELEFONE</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>NASC.</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody emptyContent={loading ? "Carregando..." : "Nenhum profissional cadastrado"}>
              {profissionais.filter(p =>
                !busca ||
                p.nome.toLowerCase().includes(busca.toLowerCase()) ||
                p.email.toLowerCase().includes(busca.toLowerCase()) ||
                p.telefone.toLowerCase().includes(busca.toLowerCase())
              ).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar src={p.avatar_url || DEFAULT_AVATAR} name={p.nome} size="sm" />
                      <span className="font-medium">{p.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color={p.funcao === "barbeiro" ? "success" : "secondary"} variant="flat">
                      {p.funcao === "barbeiro" ? "Barbeiro" : "Recepcionista"}
                    </Chip>
                  </TableCell>
                  <TableCell>{p.telefone}</TableCell>
                  <TableCell>{p.email}</TableCell>
                  <TableCell>{p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <Button isIconOnly size="sm" variant="light" onClick={() => openEditar(p)}><PencilIcon className="w-4 h-4" /></Button>
                    <Button isIconOnly size="sm" color="danger" variant="light" onClick={() => openDelete(p)}><TrashIcon className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
      {/* Modal Cadastro/Edição */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="xl">
        <ModalContent>
          <ModalHeader>{profissionalEdit ? "Editar Profissional" : "Novo Profissional"}</ModalHeader>
          <ModalBody>
            <Input label="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} isRequired startContent={<UserIcon className="w-4 h-4" />} />
            <Input label="Telefone" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} isRequired startContent={<PhoneIcon className="w-4 h-4" />} />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} isRequired startContent={<EnvelopeIcon className="w-4 h-4" />} />
            <Input label="Senha" type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} isRequired={!profissionalEdit} />
            <Input label="Data de Nascimento" type="date" value={form.data_nascimento} onChange={e => setForm(f => ({ ...f, data_nascimento: e.target.value }))} isRequired={false} />
            <RadioGroup label="Função" value={form.funcao} onValueChange={v => setForm(f => ({ ...f, funcao: v }))} orientation="horizontal">
              {funcaoOptions.map(opt => (
                <Radio key={opt.value} value={opt.value} startContent={opt.icon}>{opt.label}</Radio>
              ))}
            </RadioGroup>
            {erro && <div className="text-red-600 text-sm mt-2">{erro}</div>}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button color="primary" isLoading={saving} onClick={salvarProfissional}>{profissionalEdit ? "Salvar" : "Cadastrar"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {/* Modal Exclusão */}
      <Modal isOpen={modalDelete} onClose={() => setModalDelete(false)} size="sm">
        <ModalContent>
          <ModalHeader>Excluir Profissional</ModalHeader>
          <ModalBody>
            <p>Tem certeza que deseja excluir o profissional {profissionalDelete?.nome}?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={() => setModalDelete(false)}>Cancelar</Button>
            <Button color="danger" onClick={excluirProfissional}>Excluir</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </LayoutCadastros>
  );
} 
