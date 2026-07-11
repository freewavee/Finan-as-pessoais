# Finanças Pessoais

App multi-usuário com **login real** e dados na nuvem via **Supabase** (somente ele — sem Neon, sem outro banco).

| Peça | Tecnologia |
|------|------------|
| Front | React + Vite + Tailwind |
| Auth | Supabase Auth (email + senha) |
| Banco | Supabase Postgres + RLS |
| Deploy | Vercel (site estático) |

## 1. Criar projeto Supabase (grátis)

1. https://supabase.com → **New project**
2. **SQL Editor** → cole e rode o arquivo [`supabase/schema.sql`](./supabase/schema.sql)
3. **Authentication → Providers → Email**  
   - Desative **Confirm email** (para entrar na hora ao criar conta)
4. **Project Settings → API** → copie:
   - Project URL  
   - `anon` `public` key  

## 2. Rodar local

```bash
cp .env.example .env
# edite .env com URL e anon key

npm install
npm run dev
```

Abra http://localhost:3333 → **Criar conta** → usar o app.

## 3. Deploy Vercel

1. Importe o repo no Vercel  
2. **Environment Variables** (Production + Preview):

| Key | Value |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (anon public) |

3. Deploy / Redeploy  

Não precisa de `DATABASE_URL`, Neon nem backend Node.

## O que acontece ao criar conta

1. Supabase Auth cria o usuário  
2. App grava carteira, categorias e formas de pagamento padrão  
3. Todos os lançamentos ficam no Postgres do Supabase, isolados por usuário (RLS)

## Stack

React · Vite · TypeScript · Tailwind · Recharts · Supabase
