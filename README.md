# Finanças Pessoais

App de gestão financeira **plug-and-play**.

- ✅ Funciona na **Vercel sem configurar banco**
- ✅ Sem Neon, sem Postgres, sem variáveis de ambiente
- ✅ Dados salvos no **localStorage** do navegador
- ✅ Conta local (email + senha no próprio browser)

## Deploy (Vercel)

1. Importe o repositório no [Vercel](https://vercel.com/new)
2. Clique em **Deploy**
3. Pronto — sem Environment Variables

Ou via CLI:

```bash
npx vercel
```

## Rodar local

```bash
npm install
npm run dev
```

Abra **http://localhost:3333** → **Criar conta** → usar o app.

## Como funciona

| O quê | Onde |
|-------|------|
| Contas, lançamentos, metas… | `localStorage` do navegador |
| Login / registro | Local (hash SHA-256 no browser) |
| Deploy Vercel | Site estático (Vite) |

> Os dados ficam **neste navegador/dispositivo**. Limpar o cache do site apaga os dados. Use **Configurações → exportar backup** se quiser copiar o JSON.

## Stack

React · Vite · TypeScript · Tailwind · Recharts · Framer Motion
