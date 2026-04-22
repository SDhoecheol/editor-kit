const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ogfkckjfealewnbefmon.supabase.co';
const supabaseKey = 'sb_publishable_6gKS9HPosi4ijZnJcyW5Mw_2y7mDgoM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: posts, error } = await supabase.from('posts').select('id, title, content').order('created_at', { ascending: false }).limit(5);
  if (error) return console.error(error);
  console.log('Recent posts:', posts);
}

test();
