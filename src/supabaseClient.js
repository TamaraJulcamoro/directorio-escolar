import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mafeycbncqarhasjfjsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hZmV5Y2huY3Fhcmhhc2pmanNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NTM2NzksImV4cCI6MjEwMjAyOTY3OX0.FOCWBGt5HmcK32KmwnvIfbB2l7qk1Y0xZOUdwlAEwyE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const BUCKET_NAME = 'directorio';
export const FILE_NAME = 'students.xlsx';
