# Deploy na Vercel — zero config

Este app é uma **SPA estática**. Não precisa de banco (Neon, Postgres, etc.) nem de variáveis de ambiente.

## Passos

1. https://vercel.com/new → importe `freewavee/Finan-as-pessoais`
2. Framework: deixe em branco / Other (o `vercel.json` já define build)
3. **Deploy**

Build automático:

- Install: `npm install`
- Build: `npm run build` → `vite build`
- Output: `dist/client`

## Variáveis de ambiente

**Nenhuma.** Pode deixar vazio.

## Depois do deploy

1. Abra a URL do projeto
2. Clique em **Criar conta**
3. Use o app — tudo salva no browser

## Observações

- Dados ficam no `localStorage` de cada visitante
- Cada dispositivo/navegador tem seus próprios dados
- Para backup: Configurações → exportar JSON
