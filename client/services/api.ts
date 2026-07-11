/** API 100% local (localStorage) — plug-and-play na Vercel sem banco externo. */
export {
  api,
  ApiError,
  type TransactionFilters,
} from "../lib/localApi";
