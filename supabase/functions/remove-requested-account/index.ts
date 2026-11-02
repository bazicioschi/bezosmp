import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const headers = { 'Content-Type': 'application/json' };
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const auth = req.headers.get('Authorization');
  if (!url || !key || !auth || req.method !== 'POST') return new Response('{}', { status: 401, headers });
  const admin = createClient(url, key);
  const { data: { user }, error } = await admin.auth.getUser(auth.replace(/^Bearer /, ''));
  if (error || user?.id !== '1c2fd2f9-d5d2-4a3b-bd6a-b735200b7200') return new Response('{}', { status: 403, headers });
  const { data: owner } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'owner').maybeSingle();
  if (!owner) return new Response('{}', { status: 403, headers });
  const target = '71127f56-e46e-4382-b63f-82ca22ba3d35';
  const { data: profile } = await admin.from('profiles').select('username').eq('user_id', target).maybeSingle();
  if (profile && profile.username !== 'Dragos1003') return new Response(JSON.stringify({ error: 'Account identity changed' }), { status: 409, headers });
  const { error: deletion } = await admin.auth.admin.deleteUser(target);
  if (deletion) return new Response(JSON.stringify({ error: deletion.message }), { status: 400, headers });
  return new Response(JSON.stringify({ deleted: true }), { headers });
});