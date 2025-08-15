"use client";
import { Input } from "@/components/ui/input";
import React from "react";
import { Controller, type FieldValues, type Control, type RegisterOptions, type Path } from "react-hook-form";
import { ReactNode } from "react";

type Kind = "input" | "select" | "textarea";
type BaseProps<TFieldValues extends FieldValues> = { name: Path<TFieldValues>; label?: ReactNode; isRequired?: boolean; helperText?: ReactNode };

export type FormFieldProps<TFieldValues extends FieldValues = FieldValues> =
  BaseProps<TFieldValues> &
  (
    | ({ kind?: "input"; componentProps?: React.ComponentProps<typeof Input>; options?: never })
    | ({ kind: "select"; componentProps?: any; options: { label: string; value: string | number }[] })
    | ({ kind: "textarea"; componentProps?: React.ComponentProps<typeof Textarea>; options?: never })
  ) & {
    control: Control<TFieldValues>;
    rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  };

export default function FormField<T extends FieldValues>({
  name, label, isRequired, control, rules,
  kind = "input", componentProps, options
}: FormFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const { error } = fieldState;
        const invalid = !!error;
        const fieldId = String(name);
        return (
          <chakra.div>
            {label && <chakra.label htmlFor={fieldId} display="block" mb={1}>{label}</chakra.label>}
            {kind === "input" && <Input id={fieldId} aria-invalid={invalid} {...field} {...(componentProps as any)} />}
            {kind === "textarea" && <Textarea id={fieldId} aria-invalid={invalid} {...field} {...(componentProps as any)} />}
            {kind === "select" && (
              <chakra.select id={fieldId} aria-invalid={invalid} {...field} {...(componentProps as any)}>
                {options?.map((op) => (
                  <option key={String(op.value)} value={op.value}>{op.label}</option>
                ))}
              </chakra.select>
            )}
            {error?.message && <chakra.p color="red.500" mt={1} fontSize="sm">{error.message}</chakra.p>}
          </chakra.div>
        );
      }}
    />
  );
}


