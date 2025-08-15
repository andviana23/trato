"use client";

import * as React from "react";
// shadcn/ui
import { Button as SButton } from "@/components/ui/button";
import { Input as SInput } from "@/components/ui/input";
import { Textarea as STextarea } from "@/components/ui/textarea";
import { Switch as SSwitch } from "@/components/ui/switch";
import { Avatar as SAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip as STooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Progress as SProgress } from "@/components/ui/progress";
import { Badge as SBadge } from "@/components/ui/badge";
import { RadioGroup as SRadioGroup, RadioGroupItem as SRadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox as SCheckbox } from "@/components/ui/checkbox";
import { Tabs as STabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog as SDialog, DialogContent as SDialogContent, DialogHeader as SDialogHeader, DialogFooter as SDialogFooter, DialogOverlay as SDialogOverlay } from "@/components/ui/dialog";
import { Select as SSelect, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table as STable, TableBody as STableBody, TableHead as STableHead, TableHeader as STableHeader, TableRow as STableRow, TableCell as STableCell } from "@/components/ui/table";
import { Card as SCard, CardHeader as SCardHeader, CardContent as SCardBody, CardFooter as SCardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Modal (Dialog) – adapter compatível
type ModalProps = {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  size?: string;
  placement?: string;
  backdrop?: string;
  hideCloseButton?: boolean;
  isDismissable?: boolean;
  closeButton?: boolean;
  children: React.ReactNode;
} & React.ComponentProps<typeof SDialog>;
export function Modal({ isOpen, onOpenChange, onClose, children }: ModalProps) {
  const handleChange = (open: boolean) => {
    onOpenChange?.(open);
    if (!open) onClose?.();
  };
  return (
    <SDialog open={isOpen} onOpenChange={handleChange}>{children}</SDialog>
  );
}
export const ModalContent = SDialogContent as React.FC<React.ComponentProps<typeof SDialogContent>>;
export const ModalHeader = SDialogHeader as React.FC<React.ComponentProps<typeof SDialogHeader>>;
export const ModalBody = ({ children, className, ...rest }: { children?: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) => <div className={"py-2" + (className ? ` ${className}` : "")} {...rest}>{children}</div>;
ModalBody.displayName = "ModalBody";
export const ModalFooter = SDialogFooter as React.FC<React.ComponentProps<typeof SDialogFooter>>;
export const ModalOverlay = SDialogOverlay as React.FC<React.ComponentProps<typeof SDialogOverlay>>;

// Select adapter – expõe API <Select.Root/> e <Select.Item item="..." />
function SelectTag(props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; selectedKeys?: string[]; isRequired?: boolean; onValueChange?: (value: string) => void }) {
  const { className, children, onValueChange, ...rest } = props;
  return (
    <select
      className={"h-9 px-3 py-2 rounded-md border border-input bg-background text-sm " + (className ?? "")}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...rest}
    >
      {children}
    </select>
  );
}
type SelectCompound = typeof SelectTag & {
  Root: typeof SSelect;
  Trigger: typeof SelectTrigger;
  Content: typeof SelectContent;
  Item: (p: { item?: string; value?: string; children?: React.ReactNode } & Omit<React.ComponentProps<typeof SelectItem>, "value">) => JSX.Element;
  ValueText: typeof SelectValue;
  Value: typeof SelectValue;
};
const SelectCompound: SelectCompound = Object.assign(SelectTag, {
  Root: SSelect,
  Trigger: SelectTrigger,
  Content: SelectContent,
  Item: ({ item, value, children, ...rest }: { item?: string; value?: string; children?: React.ReactNode } & Omit<React.ComponentProps<typeof SelectItem>, "value">) => (
    <SelectItem value={(item ?? value) ?? ""} {...rest}>{children}</SelectItem>
  ),
  ValueText: SelectValue,
  Value: SelectValue,
});
export const Select = SelectCompound;

// Table adapter (API próxima ao HTML table)
type TableCompound = typeof STable & {
  Root: typeof STable;
  Header: typeof STableHeader;
  Body: typeof STableBody;
  Row: typeof STableRow;
  Cell: typeof STableCell;
  ColumnHeader: typeof STableHead;
};
export const Table: TableCompound = Object.assign(STable, {
  Root: STable,
  Header: STableHeader,
  Body: STableBody,
  Row: STableRow,
  Cell: STableCell,
  ColumnHeader: STableHead,
});
export const TableHeader = STableHeader;
export const TableBody = STableBody;
export const TableRow = STableRow;
export const TableCell = STableCell;
export const TableColumn = STableHead;
export const Thead = STableHeader;
export const Tbody = STableBody;
export const Tr = STableRow;
export const Th = STableHead;
export const Td = STableCell;
// Back-compat aliases

// Card adapter
function CardFC(props: React.ComponentProps<typeof SCard>) {
  return <SCard {...props} />;
}
type CardCompound = React.FC<React.ComponentProps<typeof SCard>> & {
  Root: typeof SCard;
  Header: typeof SCardHeader;
  Body: typeof SCardBody;
  Footer: typeof SCardFooter;
};
export const Card: CardCompound = Object.assign(CardFC, {
  Root: SCard,
  Header: SCardHeader,
  Body: SCardBody,
  Footer: SCardFooter,
});
export const CardBody = SCardBody;
export const CardHeader = SCardHeader;
export const CardFooter = SCardFooter;

// Tabs/Tab compat
type TabsProps = { selectedKey?: string; onSelectionChange?: (key: string) => void; children?: React.ReactNode } & React.ComponentProps<typeof STabs>;
export function Tabs({ selectedKey, onSelectionChange, children, ...rest }: TabsProps) {
  type TabLikeProps = { value?: string; eventKey?: string; title?: React.ReactNode; children?: React.ReactNode };
  const items = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<TabLikeProps>[];
  const triggers = items.map((child, idx: number) => {
    const props = child.props;
    const value = props.value ?? props.eventKey ?? String(idx);
    const title = props.title ?? props.children ?? value;
    return <TabsTrigger key={value} value={value}>{title}</TabsTrigger>;
  });
  return (
    <STabs value={selectedKey} onValueChange={(v: string) => onSelectionChange?.(v)} {...rest}>
      <TabsList>{triggers}</TabsList>
    </STabs>
  );
}
export type TabProps = { value?: string; title?: React.ReactNode; children?: React.ReactNode };
export function Tab(props: TabProps) { void props; return null; }

// Checkbox compat: aceita children como label e props checked/onChange
type ChangeEventChecked = { target: { checked: boolean } };
export function Checkbox(props: { checked?: boolean; defaultChecked?: boolean; onChange?: (e: ChangeEventChecked) => void; className?: string; children?: React.ReactNode }) {
  const { checked, defaultChecked, onChange, className, children } = props;
  return (
    <label className={"inline-flex items-center gap-2 " + (className ?? "")}>
      <SCheckbox checked={checked} defaultChecked={defaultChecked} onCheckedChange={(v: boolean)=> onChange?.({ target: { checked: v } })} />
      {children ? <span>{children}</span> : null}
    </label>
  );
}
export { SRadioGroup as RadioGroup, SRadioGroupItem as Radio };

// Divider/CircularProgress/Autocomplete
export const Divider = Separator;
export function CircularProgress({ value }: { value: number }) { return <SProgress value={value} />; }
export function Autocomplete(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} />; }
export function AutocompleteItem(props: React.HTMLAttributes<HTMLDivElement>) { return <div {...props} />; }

// Re-exports úteis
export function Input(props: React.ComponentProps<typeof SInput>) { return <SInput {...props} />; }
export function Textarea(props: React.ComponentProps<typeof STextarea>) { return <STextarea {...props} />; }
// Switch compat: aceita onChange(event) além de onCheckedChange(boolean)
type SwitchProps = Omit<React.ComponentProps<typeof SSwitch>, "onCheckedChange"> & {
  onChange?: (e: ChangeEventChecked) => void;
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
  defaultChecked?: boolean;
};
export const Switch = (props: SwitchProps) => {
  const { onChange, onCheckedChange, checked, defaultChecked, ...rest } = props || {};
  const handleCheckedChange = (val: boolean) => {
    onCheckedChange?.(val);
    if (onChange) {
      const synthetic: ChangeEventChecked = { target: { checked: val } };
      onChange(synthetic);
    }
  };
  return <SSwitch checked={checked} defaultChecked={defaultChecked} onCheckedChange={handleCheckedChange} {...rest} />;
};
// Badge compatível com variantes antigas
// Limitar às variantes aceitas pelo componente SBadge para evitar erro de tipagem
type ShadcnBadgeVariant = "default" | "secondary" | "destructive" | "outline";
type LegacyBadgeVariant = "subtle" | "flat" | "solid" | ShadcnBadgeVariant | undefined;
export function Badge(props: { variant?: LegacyBadgeVariant; className?: string; children?: React.ReactNode } & Omit<React.ComponentProps<typeof SBadge>, "variant">) {
  const { variant, className, children, ...rest } = props || {};
  const mapVariant = (v: LegacyBadgeVariant): ShadcnBadgeVariant => {
    if (v === "subtle" || v === "flat") return "secondary";
    if (v === "solid") return "default";
    return (v ?? "default") as ShadcnBadgeVariant;
  };
  return <SBadge variant={mapVariant(variant)} className={className} {...rest}>{children}</SBadge>;
}
export function Avatar(props: { src?: string; name?: string; size?: "sm"|"md"|"lg"|"xl"; className?: string; isBordered?: boolean }) {
  const { src, name, size = "sm", className, isBordered } = props;
  const sizeCls = size === "xl" ? "h-20 w-20" : size === "lg" ? "h-16 w-16" : size === "md" ? "h-12 w-12" : "h-8 w-8";
  const letter = (name ?? "?").charAt(0).toUpperCase();
  return (
    <SAvatar className={sizeCls + (className ? ` ${className}` : "") + (isBordered ? " border-2 border-border" : "") }>
      <AvatarImage src={src} />
      <AvatarFallback>{letter}</AvatarFallback>
    </SAvatar>
  );
}
export const AvatarNS = { Root: SAvatar, Image: AvatarImage, Fallback: AvatarFallback };
type TooltipCompatProps = { content?: React.ReactNode; children?: React.ReactNode; className?: string; placement?: string };
function TooltipFC({ content, children }: TooltipCompatProps) {
  return (
    <STooltip>
      <TooltipTrigger asChild>{children as React.ReactElement}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </STooltip>
  );
}
type TooltipCompound = React.FC<TooltipCompatProps> & {
  Root: typeof STooltip;
  Trigger: typeof TooltipTrigger;
  Content: typeof TooltipContent;
};
export const Tooltip: TooltipCompound = Object.assign(TooltipFC, {
  Root: STooltip,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
});
// Progress compat
export function Progress(props: React.ComponentProps<typeof SProgress>) {
  return <SProgress {...props} />;
}
export const ProgressNS = { Root: SProgress };
export const Spinner = (props: { className?: string; label?: string }) => (
  <div className={"inline-flex items-center gap-2 " + (props.className ?? "")}>
    <div className="animate-spin rounded-full border-2 border-muted w-5 h-5 border-t-transparent" />
    {props.label ? <span className="text-sm text-muted-foreground">{props.label}</span> : null}
  </div>
);
Spinner.displayName = "Spinner";
export const Chip = Badge;
export const useDisclosure = () => {
  const [isOpen, setOpen] = React.useState(false);
  return { isOpen, onOpen: () => setOpen(true), onClose: () => setOpen(false) };
};

// Button compat: aceita variantes Chakra e ícones em startContent
type ShadcnButtonVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
type LegacyButtonVariant = "light" | "flat" | "subtle" | ShadcnButtonVariant | undefined;
type ShadcnButtonSize = "default" | "sm" | "lg" | "icon";
type CompatButtonProps = Omit<React.ComponentProps<typeof SButton>, "variant" | "size"> & {
  variant?: LegacyButtonVariant;
  size?: ShadcnButtonSize | "icon";
  startContent?: React.ReactNode;
  isLoading?: boolean;
  isDisabled?: boolean;
  onPress?: React.MouseEventHandler<HTMLButtonElement>;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  loading?: boolean;
  radius?: string;
};
export function Button({ variant, children, className, disabled, ...rest }: CompatButtonProps) {
  const { startContent, isLoading, isDisabled, onPress, loading, size, onClick, ...btnRest } = rest;
  const mapVariant = (v: LegacyButtonVariant): ShadcnButtonVariant => {
    if (v === "light" || v === "flat") return "ghost";
    if (v === "subtle") return "secondary";
    return (v ?? "default") as ShadcnButtonVariant;
  };
  return (
    <SButton
      variant={mapVariant(variant)}
      className={className}
      disabled={disabled || isDisabled || isLoading || loading}
      size={size === "icon" ? "icon" : size}
      onClick={onPress ?? onClick}
      {...btnRest}
    >
      {isLoading ? <Spinner className="mr-2" /> : startContent ? <span className="mr-2 inline-flex">{startContent}</span> : null}
      {children}
    </SButton>
  );
}
export { SelectItem };

// Pagination custom
export { default as Pagination } from "@/components/Pagination";
