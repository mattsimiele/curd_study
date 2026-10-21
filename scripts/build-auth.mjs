import {build} from 'esbuild';
await build({stdin:{contents:'export {createClient} from "@supabase/supabase-js";',resolveDir:process.cwd()},outfile:'dist/vendor/supabase.js',bundle:true,format:'esm',minify:true,platform:'browser',target:'safari16'});
