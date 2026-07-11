import { supabase } from "@/lib/supabase/client";

interface LogActionParams {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

export async function logAction({
  userId,
  action,
  entity,
  entityId,
  oldValue,
  newValue,
}: LogActionParams) {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: userId,
    action,
    entity,
    entity_id: entityId,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
  });

  if (error) {
    console.error("Falha ao registrar audit log:", error.message);
  }
}
