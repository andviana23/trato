import { createClient } from "@/lib/supabase/client";

export type QueueItem = {
  id: string;
  profissional_id: string;
  queue_position: number;
  daily_services: number;
  total_services: number;
  is_active: boolean;
};

export async function getMinhaVez(userId: string) {
  const supabase = createClient();
  // Resolve profissional via user_id ou id
  let profissionalId: string | null = null;
  const { data: prof1 } = await supabase.from("profissionais").select("id").eq("user_id", userId).single();
  if (prof1?.id) profissionalId = prof1.id;
  if (!profissionalId) {
    const { data: prof2 } = await supabase.from("profissionais").select("id").eq("id", userId).single();
    if (prof2?.id) profissionalId = prof2.id;
  }
  if (!profissionalId) return { queue: null as QueueItem | null };

  const { data } = await supabase
    .from("barber_queue")
    .select("id, profissional_id, queue_position, daily_services, total_services, is_active")
    .eq("profissional_id", profissionalId)
    .single();
  return { queue: (data as QueueItem) || null };
}

// Registrar atendimento do próprio profissional via RPC
export async function attendMyTurn() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('barber_queue_attend');
  if (error) throw error;
  return data as unknown as QueueItem[] | null;
}

// Passar a vez do próprio profissional via RPC
export async function passMyTurn() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('barber_queue_pass_turn');
  if (error) throw error;
  return data as unknown as QueueItem[] | null;
}


