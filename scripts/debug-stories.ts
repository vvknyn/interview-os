import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '/Users/vivek/Antigravity/Code/interview-os/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const targetId = '174ced7f-e7c4-42e0-a5c6-700037b59ed9';
    console.log(`Checking for stories with ID: ${targetId}`);

    const { data, error } = await supabase
        .from('stories')
        .select('*');

    if (error) {
        console.error('Error fetching stories:', error);
        return;
    }

    console.log(`Total rows fetched: ${data?.length}`);

    console.log(`Found ${data?.length} rows (showing all):`);

    data?.forEach((row, i) => {
        console.log(`\n--- Row ${i + 1} (Created: ${row.created_at}) ---`);
        console.log(`DB ID: ${row.id}, User ID: ${row.user_id}`);
        console.log('Raw Content:', row.content);
        try {
            const parsed = JSON.parse(row.content);
            console.log('Parsed Content ID:', parsed.id);
            console.log('Parsed Deleted:', parsed.deleted);
            if (row.content.includes(targetId)) {
                console.log('*** CONTAINS TARGET ID ***');
            }
        } catch (e) {
            console.error('Failed to parse content JSON');
        }
    });
}

main();
