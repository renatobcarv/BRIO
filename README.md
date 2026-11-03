# BRIO
App pessoal de constância: vida espiritual, pioneiro, corpo, finanças e metas num só lugar.

> "O que fizerem, façam de toda a alma, como para Jeová, e não para homens." — Colossenses 3:23

O brio é um substantivo masculino que significa amor-próprio, honra, dignidade, coragem, altivez e determinação.

Principais Significados e Sentimentos

• Honra e dignidade: É o sentimento que impede uma pessoa de se humilhar ou de aceitar a mediocridade, levando-a a cumprir seus deveres com responsabilidade.
• Coragem e vigor: Representa a força interior e a intrepidez para enfrentar riscos, obstáculos ou momentos de derrota sem abaixar a cabeça.
• Persistência: É a energia que você coloca na ação para não se conformar com o superficial e buscar o melhor de si mesmo.

Next.js 15 · Supabase (Auth, Postgres, Storage) · Tailwind 4 · PWA.

## Status das fases
- [x] 1. Auth + layout + navegação + design system + schema completo
- [x] 2. Início + checklist + streak
- [x] 3. Pioneiro
- [x] 4. Corpo
- [x] 5. Espiritual
- [x] 6. Finanças
- [x] 7. Metas e Objetivos
- [x] 8. Configurações, export/import, PWA completo

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

## Backup e dados antigos
- **Exportar/Importar:** Configurações → Backup. O JSON exportado pode ser reimportado a qualquer momento (atualiza por id, nunca apaga).
- **HTMLs antigos:** abra o HTML antigo no navegador, aperte F12 → Console e cole `scripts/exportar-localstorage.js`. Ele baixa um `legado-*.json` com tudo o que estava salvo. A conversão desse arquivo para o Brio depende do formato de cada HTML e será feita quando os arquivos originais estiverem no repositório.

## Rodar localmente
```bash
npm install
npm run dev
```

## Segurança
- Middleware bloqueia todas as rotas exceto `/login`.
- RLS em todas as tabelas com `user_id = auth.uid()`.
- Foto servida por signed URL de bucket privado; arquivos ficam em `privado/<seu-uid>/…`.
