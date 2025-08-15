import { Badge, Button } from "@chakra-ui/react";

export function EnvVarWarning() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      <Badge variant="outline">
        Supabase environment variables required
      </Badge>
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" variant="outline" disabled>
          Sign in
        </Button>
        <Button size="sm" variant="solid" disabled>
          Sign up
        </Button>
      </div>
    </div>
  );
}
