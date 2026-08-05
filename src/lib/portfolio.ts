// Shared cap for specialist ("usta") portfolio galleries. Kept in one place so the create
// route, the update route, and the admin UI (CatalogManager) all enforce/display the same
// limit. Not exported from a route.ts file: Next.js route modules only allow a fixed set of
// named exports (GET/POST/etc. + a few config constants), so a plain constant must live here.
export const MAX_PORTFOLIO_IMAGES = 10;
