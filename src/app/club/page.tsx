import { redirect } from "next/navigation";

/** L'ancienne page « Le club » s'appelle desormais « Les bureaux ». */
export default function ClubRedirect() {
  redirect("/bureaux");
}
