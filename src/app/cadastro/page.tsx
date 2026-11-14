import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpFlow } from "@/components/site/signup";

export const metadata: Metadata = { title: "Criar conta · BRIO" };
export default function Cadastro() { return <Suspense><SignUpFlow /></Suspense>; }
