import { createBrowserClient } from "@supabase/ssr";
const SUPABASE_URL=process.env.NEXT_PUBLIC_SUPABASE_URL||"https://ozygvdbtctzaxwijynzj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||"sb_publishable_i0rbYzCRY5AV8pmTrbJbbA_lL88oIhj";
export function supabase(){return createBrowserClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY)}
