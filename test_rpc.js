const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ogfkckjfealewnbefmon.supabase.co';
const supabaseKey = 'sb_publishable_6gKS9HPosi4ijZnJcyW5Mw_2y7mDgoM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: posts } = await supabase.from('posts').select('id, view_count').limit(1);
  if (!posts || posts.length === 0) return console.log('No posts found');
  const post = posts[0];
  console.log('Before:', post.view_count);
  
  const { error } = await supabase.rpc('increment_view_count', { p_id: post.id });
  if (error) console.log('RPC Error:', error);
  
  const { data: postAfter } = await supabase.from('posts').select('id, view_count').eq('id', post.id).single();
  console.log('After:', postAfter.view_count);
}

test();
