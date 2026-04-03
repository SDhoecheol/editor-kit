import { createClient } from '@supabase/supabase-js';

// 금고(.env.local)에서 주소와 열쇠를 꺼내오는 코드입니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// 꺼내온 열쇠로 수파베이스와 연결된 'supabase'라는 객체를 만듭니다.
export const supabase = createClient(supabaseUrl, supabaseKey);