import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpwgbutlqmubdnnnfhdp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd2didXRscW11YmRubm5maGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTgwMDAsImV4cCI6MjA4ODc5NDAwMH0.N11fA3pyYUpbtGPs0yvM9lwQecM6AJIwLEnGKNswfVI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVouchersTable() {
  try {
    // Try to get column info from table introspection using a sample row
    const { data: tableData, error: tableError } = await supabase
      .from('vouchers')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('Error accessing vouchers table:', tableError.message);
      return;
    }

    if (!tableData) {
      console.log('No data returned from query');
      return;
    }

    // Get column names from the response
    if (tableData.length > 0) {
      const columns = Object.keys(tableData[0]);
      console.log('Columns found in vouchers table:');
      columns.forEach(col => console.log(`  - ${col}`));
      
      if (columns.includes('scope')) {
        console.log('\n✓ Column "scope" EXISTS in the table');
      } else {
        console.log('\n✗ Column "scope" DOES NOT EXIST in the table');
      }
    } else {
      console.log('Table vouchers is empty. Trying introspection query...');
      
      // Try using Supabase's introspection API - query the table with no filters to get schema
      const { data: introspectData, error: introspectError } = await supabase
        .from('vouchers')
        .select('*')
        .limit(0); // This might still return column info

      if (introspectError) {
        console.log('Introspection error:', introspectError.message);
      } else if (introspectData) {
        console.log('Introspection successful but still no rows');
      }
    }
  } catch (error) {
    console.error('Exception:', error.message);
  }
}

checkVouchersTable();
