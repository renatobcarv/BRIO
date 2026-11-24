# BRIO

**Sistema pessoal de constância e alto desempenho.** Treino periodizado com um "Mestre" que ajusta cada semana, dieta, finanças, estudos, vida espiritual, metas e um mascote que evolui com você, tudo gamificado (XP, patentes, conquistas, itens, feras).

> *Brio* (s.m.): amor-próprio, honra, coragem e determinação para não se conformar com o mínimo.

PWA · Next.js 15 (App Router) · React 19 · TypeScript · Tailwind 4 · Supabase (Auth, Postgres com RLS, Storage).

## Funcionalidades
- **Onboarding** para novas contas (rápido ou avançado): áreas, metas, fotos, treino + dieta com especialistas, extrato bancário, sorteio do mascote, resumo da conta e tutorial.
- **Treino:** consulta com especialistas (periodização em blocos, híbrido com corrida, old school, especialização nos básicos), o Mestre (onda semanal, ajustes por RPE/registro, platô, sugestões da semana), cargas série a série, aquecimento, ranking dos básicos.
- **Corpo e dieta:** plano alimentar (IA com plano de reserva), ajuste de calorias pela tendência do peso, água, sono.
- **Finanças:** lançamentos, parcelas, investimentos, importação de extrato OFX/CSV.
- **Status:** nível, patentes, atributos, conquistas, perfil, corpo e **Mente** (testes cognitivos adaptativos).
- **Mascote e feras:** roleta, evolução, 57 equipamentos, loja, feras domáveis com minigame.
- **Módulos por conta:** cada pessoa liga só o que usa; preferências livres em `settings.prefs`.

## Instalação

### 1. Supabase
1. Crie o projeto em [supabase.com](https://supabase.com) (região sugerida: São Paulo).
2. **SQL Editor** → rode `supabase/TUDO.sql` (todas as migrações, idempotente: pode rodar de novo a cada atualização).
3. **Storage:** confirme o bucket `privado` **não público** (o SQL já cria).
4. **Authentication → Sign In / Providers:** deixe *Allow new users to sign up* ligado para aceitar cadastros.
5. **Authentication → URL Configuration:** *Site URL* e *Redirect URLs* com o domínio de produção.

### 2. Variáveis de ambiente
`cp .env.example .env.local` e preencha. Só `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são obrigatórias; as chaves de IA e Google ficam **apenas no servidor**.

### 3. Deploy
Importe o repositório na Vercel, adicione as variáveis e faça o deploy. No celular: *Compartilhar → Adicionar à Tela de Início*.

## Desenvolvimento
```bash
npm install
npm run dev        # servidor local
npm test           # testes da lógica (node --test)
npm run lint       # ESLint
npm run smoke      # abre todas as telas (com o app rodando)
```
A lógica de negócio fica em `src/lib/*.ts`, pura e testável (`tests/`). Migrações em `supabase/migrations/`, consolidadas em `supabase/TUDO.sql`.

## Segurança
- **RLS em todas as tabelas** (política "dono": cada usuário só vê os próprios dados).
- Fotos em bucket **privado** com URLs assinadas temporárias.
- Nunca use a `service_role` no app; segredos só em variáveis de servidor.
- Treino e dieta são orientação baseada em estudos, **não substituem** avaliação médica ou nutricional.
