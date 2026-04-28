import { redirect } from "next/navigation"

// Alias: /correspondencia/bandeja apunta a la bandeja principal
export default function BandejaAlias() {
  redirect("/correspondencia")
}
