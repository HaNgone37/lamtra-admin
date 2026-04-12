import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tpwgbutlqmubdnnnfhdp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd2didXRscW11YmRubm5maGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTgwMDAsImV4cCI6MjA4ODc5NDAwMH0.N11fA3pyYUpbtGPs0yvM9lwQecM6AJIwLEnGKNswfVI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnDataType() {
  try {
    // Get a sample of data to examine the scope column
    const { data, error } = await supabase
      .from('vouchers')
      .select('scope')
      .limit(5);

    if (error) {
      console.log('Error:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Sample data from scope column:');
      data.forEach((row, index) => {
        console.log(`  Row ${index + 1}: ${JSON.stringify(row.scope)} (Type: ${typeof row.scope})`);
      });

      // Determine the data type based on samples
      const sampleValue = data[0].scope;
      if (sampleValue === null) {
        console.log('\nColumn contains NULL values, checking other rows...');
        const nonNullRow = data.find(row => row.scope !== null);
        if (nonNullRow) {
          console.log(`First non-null value: ${JSON.stringify(nonNullRow.scope)} (Type: ${typeof nonNullRow.scope})`);
        }
      } else if (typeof sampleValue === 'string') {
        console.log(`\n✓ Column "scope" data type: TEXT (string)`);
        console.log(`  Sample value: "${sampleValue}"`);
      } else if (typeof sampleValue === 'number') {
        console.log(`\n✓ Column "scope" data type: NUMERIC/INTEGER`);
        console.log(`  Sample value: ${sampleValue}`);
      } else if (typeof sampleValue === 'boolean') {
        console.log(`\n✓ Column "scope" data type: BOOLEAN`);
        console.log(`  Sample value: ${sampleValue}`);
      } else {
        console.log(`\n✓ Column "scope" data type: ${typeof sampleValue}`);
        console.log(`  Sample value: ${JSON.stringify(sampleValue)}`);
      }
    } else {
      console.log('No data found in vouchers table for scope column inspection');
    }
  } catch (error) {
    console.error('Exception:', error.message);
  }
}

checkColumnDataType();
