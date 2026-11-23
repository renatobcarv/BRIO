import { redirect } from "next/navigation";

/** Status agora vive no Perfil. */
export default function Page() { redirect("/perfil?aba=status"); }
