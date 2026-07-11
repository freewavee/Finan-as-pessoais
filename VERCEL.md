# Deploy Vercel + Supabase

## Variáveis obrigatórias

| Key | Onde pegar |
|-----|------------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` |

Marque **Production**, **Preview** e **Development**.

> Use a chave **anon**, nunca a `service_role` no front.

## Checklist Supabase

1. Rodar `supabase/schema.sql` no SQL Editor  
2. Desativar **Confirm email** (Auth → Providers → Email) se quiser login imediato  
3. Site URL (Auth → URL Configuration): `https://seu-app.vercel.app`  
4. Redirect URLs: `https://seu-app.vercel.app/**`

## Redeploy

Depois de salvar as envs: Deployments → Redeploy (sem cache se possível).

## Erros comuns

| Sintoma | Causa |
|---------|--------|
| “Supabase não configurado” | Falta env na Vercel ou build sem as vars |
| Cria conta mas pede email | Confirm email ainda ativo |
| 401 / RLS | Schema/SQL não rodado ou políticas faltando |
