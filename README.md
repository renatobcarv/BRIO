# BRIO
App pessoal de constância: vida espiritual, pioneiro, corpo, finanças e metas num só lugar.

> "O que fizerem, façam de toda a alma, como para Jeová, e não para homens." — Colossenses 3:23

Next.js 15 · Supabase (Auth, Postgres, Storage) · Tailwind 4 · PWA.

## Status das fases
- [x] 1. Auth + layout + navegação + design system + schema completo
- [ ] 2. Início + checklist + streak
- [ ] 3. Pioneiro
- [ ] 4. Corpo
- [ ] 5. Espiritual
- [ ] 6. Finanças
- [ ] 7. Metas e Objetivos
- [ ] 8. Configurações, export/import, PWA completo

## Passo a passo de instalação

### 1. Criar o projeto no Supabase
Em [supabase.com](https://supabase.com) → *New project*. Região sugerida: **South America (São Paulo)**.

### 2. Rodar o SQL
*SQL Editor* → cole todo o conteúdo de `supabase/schema.sql` → *Run*.
Isso cria as tabelas, os índices, o RLS em todas as tabelas e o bucket privado `privado`.

### 3. Desligar o cadastro público
*Authentication → Sign In / Providers* → desmarque **Allow new users to sign up**.
Mantenha o provedor **Email** ligado.

### 4. Criar seu usuário
*Authentication → Users → Add user → Create new user*: e-mail + senha, marque **Auto Confirm User**.

### 5. Rodar o seed
*SQL Editor* → cole `supabase/seed.sql` (confira o e-mail na linha do `select`) → *Run*.

### 6. Conferir o bucket
*Storage* → deve existir o bucket `privado`, **não público**. Se não existir, crie com esse nome e deixe *Public* desligado.

### 7. Variáveis de ambiente
*Project Settings → API*: copie a **Project URL** e a **anon public key**.
Localmente: `cp .env.example .env.local` e preencha.
**Nunca** use a `service_role` neste app.

### 8. Deploy na Vercel
[vercel.com/new](https://vercel.com/new) → importe `renatobcarv/brio` → em *Environment Variables* adicione
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` → *Deploy*.

### 9. Instalar no celular
Abra a URL no Safari/Chrome → *Compartilhar → Adicionar à Tela de Início*.

## Rodar localmente
```bash
npm install
npm run dev
```

## Segurança
- Middleware bloqueia todas as rotas exceto `/login`.
- RLS em todas as tabelas com `user_id = auth.uid()`.
- Foto servida por signed URL de bucket privado; arquivos ficam em `privado/<seu-uid>/…`.
