import React, { useRef, useState } from "react";
import { Avatar, Button } from "@heroui/react";

interface AvatarUploadProps {
  value?: File;
  onChange: (file: File | null) => void;
  currentUrl?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange, currentUrl }) => {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Formato inválido. Use PNG, JPG ou JPEG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Tamanho máximo: 2MB');
      return;
    }
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
      tabIndex={0}
      aria-label="Upload de avatar"
    >
      <Avatar
        src={preview}
        name="Avatar"
        size="lg"
        className="ring-2 ring-primary border-2 border-white shadow-md"
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      <Button size="sm" variant="bordered" className="mt-1">Trocar foto</Button>
      <span className="text-xs text-gray-400">PNG, JPG, JPEG até 2MB</span>
    </div>
  );
};

export default AvatarUpload; 