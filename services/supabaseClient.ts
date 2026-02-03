import { createClient } from '@supabase/supabase-js';
import { Member } from '../types';

// Supabase Configuration
// Using provided credentials for the Markaz Masjid project
const supabaseUrl = 'https://xqzyzqhrcioezpozyrdw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxenl6cWhyY2lvZXpwb3p5cmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTg2OTIsImV4cCI6MjA4NTQ3NDY5Mn0.O_vvQJHvH2mZiiZ8xQMeDa6M2Tlrp2KH_sLCW4KuNq8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbMember {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    committed_amount: number;
    frequency: string;
    payments: any[];
    notes: string | null;
}

export const mapMemberFromDB = (dbMember: any): Member => ({
    id: dbMember.id,
    name: dbMember.name,
    phone: dbMember.phone || '',
    email: dbMember.email || '',
    committedAmount: Number(dbMember.committed_amount),
    frequency: dbMember.frequency,
    payments: dbMember.payments || [],
    notes: dbMember.notes || ''
});

export const mapMemberToDB = (member: Member): DbMember => ({
    id: member.id,
    name: member.name,
    phone: member.phone || null,
    email: member.email || null,
    committed_amount: member.committedAmount,
    frequency: member.frequency,
    payments: member.payments,
    notes: member.notes || null
});

export const validateAccessCode = async (code: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'access_code')
            .single();

        if (error || !data) return false;
        return data.value === code;
    } catch {
        return false;
    }
};