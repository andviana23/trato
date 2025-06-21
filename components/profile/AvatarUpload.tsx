import React, { useRef, useState, useEffect } from "react";
import { Avatar, Button } from "@nextui-org/react";

interface AvatarUploadProps {
  value?: File;
  onChange: (file: File | null) => void;
  currentUrl?: string;
}

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=365E78&color=fff';

const AvatarUpload: React.FC<AvatarUploadProps> = ({ value, onChange, currentUrl }) => {
  const [preview, setPreview] = useState<string | undefined>(currentUrl || DEFAULT_AVATAR);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(currentUrl || DEFAULT_AVATAR);
  }, [currentUrl]);

  const handleFile = (file: File | null) => {
    if (!file) {
      setPreview(DEFAULT_AVATAR);
      onChange(null);
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      alert('Formato inválido. Use PNG, JPG ou JPEG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Tamanho máximo: 2MB');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
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
        src={preview || DEFAULT_AVATAR}
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
          const files = e.target.files;
          if (files && files.length > 0) {
            handleFile(files[0]);
          }
        }}
      />
      <Button size="sm" variant="bordered" className="mt-1">Trocar foto</Button>
      <span className="text-xs text-gray-400">PNG, JPG, JPEG até 2MB</span>
    </div>
  );
};

export default AvatarUpload; 
