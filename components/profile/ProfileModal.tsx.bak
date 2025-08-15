import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Divider,
  Chip,
  Spinner
} from "@nextui-org/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AvatarUpload from "./AvatarUpload";
import PasswordChange from "./PasswordChange";
import PasswordChangeModal from "./PasswordChangeModal";

const phoneRegex = /^\d{10,11}$/;
const profileSchema = z.object({
  fullName: z.string().min(2, "Nome muito curto"),
  phone: z.string().regex(phoneRegex, "Telefone inválido. Use apenas números, ex: 31999999999"),
  avatar: z.any().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: any;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, user }) => {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);

  // Verificar se user existe
  if (!user) {
    return null;
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || "",
      phone: user?.user_metadata?.phone || "",
      avatar: undefined,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setSuccess(false);
    try {
      // Atualizar dados no Supabase
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // Atualizar metadados do usuário
      const updates: any = {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        }
      };
      // Se avatar foi alterado, fazer upload e atualizar URL
      if (avatarFile && user?.id) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          updates.data.avatar_url = urlData?.publicUrl || 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff';
        } else {
          console.error('Erro no upload do avatar:', uploadError);
        }
      }
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onClose();
    } catch (err: any) {
      alert("Erro ao salvar alterações: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="md" placement="center">
      <ModalContent className="rounded-2xl shadow-2xl">
        <ModalHeader className="text-2xl font-bold text-center pb-0 pt-6">Perfil do Usuário</ModalHeader>
        <ModalBody className="flex flex-col items-center gap-6 px-6 pb-2 pt-2">
          {/* Avatar + Upload */}
          <div className="flex flex-col items-center gap-2 w-full">
            <Controller
              name="avatar"
              control={control}
              render={({ field }) => (
                <AvatarUpload
                  value={field.value}
                  onChange={(file) => {
                    setAvatarFile(file);
                    field.onChange(file);
                  }}
                  currentUrl={user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff'}
                />
              )}
            />
          </div>
          <div className="w-full bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col gap-3 border border-gray-100 dark:border-gray-800">
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input
                  label="Nome"
                  placeholder="Digite seu nome completo"
                  value={field.value}
                  onChange={field.onChange}
                  isInvalid={!!errors.fullName}
                  errorMessage={errors.fullName?.message}
                  className="mb-2"
                />
              )}
            />
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input
                  label="Telefone"
                  placeholder="31999999999"
                  value={field.value}
                  onChange={e => {
                    // Permitir apenas números
                    const val = e.target.value.replace(/\D/g, "");
                    field.onChange(val);
                  }}
                  isInvalid={!!errors.phone}
                  errorMessage={errors.phone?.message}
                  maxLength={11}
                  inputMode="tel"
                  className="mb-2"
                />
              )}
            />
          </div>
          <div className="w-full flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Tipo de usuário:</span>
              <Chip color="primary" variant="flat">
                {user?.user_metadata?.role === 'admin' ? 'Administrador' : user?.user_metadata?.role === 'reception' ? 'Recepção' : 'Barbeiro'}
              </Chip>
            </div>
          </div>
          <div className="w-full flex flex-col gap-2 bg-white dark:bg-gray-900 rounded-xl shadow p-4 border border-gray-100 dark:border-gray-800">
            <Button color="primary" variant="solid" onClick={() => setShowPasswordModal(true)} className="w-full">
              Alterar Senha
            </Button>
          </div>
          {showPasswordModal && (
            <PasswordChangeModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} user={user} />
          )}
        </ModalBody>
        <ModalFooter className="flex justify-between items-center px-6 pb-6 pt-2 gap-2">
          <Button variant="light" onClick={onClose} disabled={loading} className="w-1/2">Cancelar</Button>
          <Button color="primary" onClick={handleSubmit(onSubmit)} isLoading={loading} disabled={loading} className="w-1/2">
            Salvar Alterações
          </Button>
        </ModalFooter>
        {success && (
          <div className="text-center text-green-600 py-2">Alterações salvas com sucesso!</div>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ProfileModal; 
