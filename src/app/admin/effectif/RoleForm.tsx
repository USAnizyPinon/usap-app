"use client";

import { useFormState } from "react-dom";
import { changerRole } from "../actions";
import FormMessage from "@/components/FormMessage";

export default function RoleForm({
  userId,
  current,
  isSelf,
}: {
  userId: string;
  current: string;
  isSelf: boolean;
}) {
  const [state, action] = useFormState(changerRole, null);

  if (isSelf) {
    return <span className="text-xs font-bold text-jaune">Vous ({current})</span>;
  }

  return (
    <div>
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={userId} />
        <select
          name="role"
          defaultValue={current}
          className="input !w-auto !py-1.5 text-xs"
          aria-label="Rôle du compte"
        >
          <option value="LICENCIE">Licencié</option>
          <option value="DIRIGEANT">Dirigeant</option>
          <option value="ADMIN">Administrateur</option>
        </select>
        <button className="text-xs font-bold text-jaune hover:underline">Appliquer</button>
      </form>
      <FormMessage state={state} />
    </div>
  );
}
