import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envStr = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';
let serviceKey = '';

envStr.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
});

async function test() {
  const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);
  
  const { data: posts } = await supabase.from('posts').select('id, comments(id)');
  let targetPost = posts?.find(p => p.comments && p.comments.length > 0);
  
  if (!targetPost) {
    console.log("No post with comments found.");
    return;
  }
  
  console.log("Found post with comments:", targetPost.id);
  
  if (serviceKey) {
    const { error } = await supabase.from('posts').delete().eq('id', targetPost.id);
    if (error) {
      console.error("DELETE ERROR:", error);
    } else {
      console.log("Delete succeeded! (Cascade is working)");
    }
  } else {
    console.log("No service key found");
  }
}
test();
