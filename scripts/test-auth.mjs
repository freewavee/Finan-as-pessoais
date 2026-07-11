const mem = new Map();
const storage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
};
globalThis.localStorage = storage;
globalThis.window = { localStorage: storage };

const { createAccount, loginAccount, getSessionUserId, loadUserData, listUsers } =
  await import("../client/lib/localStore.ts");
const { api, authLogout } = await import("../client/lib/localApi.ts");

const u = await createAccount("Joao", "joao@test.com", "senha123");
console.log("created", u.email, "session", getSessionUserId());
const data = loadUserData(u.id);
console.log("defaults accounts", data.accounts.length, "cats", data.categories.length);

const acc = data.accounts[0];
const cat = data.categories.find((c) => c.type === "ENTRADA");
const pm = data.paymentMethods[0];
await api.createTransaction({
  date: new Date().toISOString(),
  amountCents: 15000,
  type: "ENTRADA",
  description: "Salario",
  accountId: acc.id,
  categoryId: cat.id,
  paymentMethodId: pm.id,
});
const dash = await api.getDashboard();
console.log("receitas", dash.receitasMesCents, "saldo", dash.saldoConsolidadoCents);

await authLogout();
console.log("after logout", getSessionUserId());
await loginAccount("joao@test.com", "senha123");
const dash2 = await api.getDashboard();
console.log(
  "relogin saldo",
  dash2.saldoConsolidadoCents,
  "txs",
  (await api.listTransactions()).total
);

try {
  await loginAccount("joao@test.com", "errada");
  console.log("FAIL wrong password accepted");
  process.exit(1);
} catch {
  console.log("wrong pass OK");
}

await createAccount("Maria", "maria@test.com", "senha456");
const dashM = await api.getDashboard();
console.log("maria saldo", dashM.saldoConsolidadoCents, "users", listUsers().length);

if (dash2.saldoConsolidadoCents !== 15000) {
  console.error("FAIL saldo not persisted");
  process.exit(1);
}
if (dashM.saldoConsolidadoCents !== 0) {
  console.error("FAIL users not isolated");
  process.exit(1);
}
console.log("ALL AUTH+DATA TESTS PASSED");
