export const MAX_CONCURRENT_UPLOADS = parseInt(
  import.meta.env.VITE_MAX_CONCURRENT_UPLOADS || "2",
  10
);
export const MAX_RETRY_ATTEMPTS = parseInt(
  import.meta.env.VITE_MAX_RETRY_ATTEMPTS || "3",
  10
);
