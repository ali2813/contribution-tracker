import { Member, PaymentFrequency } from './types';

const uuid = () => Math.random().toString(36).substring(2, 9);

export const INITIAL_MEMBERS: Member[] = [
  { id: 1, name: "Mohammed Sadruzzaman", phone: "716-548-8693", committedAmount: 2400, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 2, name: "Mohammed Javed Hasanat", phone: "332-209-9847", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 3, name: "M Saad Hossain", phone: "716-292-3000", committedAmount: 1800, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 4, name: "Mohammad Abdul Kaium", phone: "716-303-9144", committedAmount: 2400, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 5, name: "Muhammad Sayedur Rahman", phone: "347-691-1515", committedAmount: 2400, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 6, name: "Abdul Kashem", phone: "917-673-6587", committedAmount: 4000, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 7, name: "Farid Bhana", phone: "716-446-3691", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 8, name: "Muhammad Mofizul Islam", phone: "917-294-0521", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 9, name: "Effath A Elahi", phone: "716-903-1302", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 10, name: "Anisul Jasir(Dulal)", phone: "716-880-9365", committedAmount: 600, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 11, name: "Mohammed Sowkat Mustafa", phone: "917-348-6127", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 12, name: "Tufayl Ahmed", phone: "716-348-9698", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 13, name: "Abu Zafar", phone: "716-816-5234", committedAmount: 2000, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 14, name: "Mohammed Zia", phone: "716-400-9994", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 15, name: "Abdul Rehman Siddiqui", phone: "917-888-6861", committedAmount: 2000, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 16, name: "M Zubair Hossain", phone: "716-436-8226", committedAmount: 2000, frequency: PaymentFrequency.YEARLY, payments: [] },
  { 
    id: 17, 
    name: "Mohammad Dudumiah", 
    phone: "716-533-3061", 
    committedAmount: 1800, 
    frequency: PaymentFrequency.YEARLY, 
    payments: [
      { id: uuid(), date: '2023-11-13', amount: 150, note: "Paid - Hasan Bhai" },
      { id: uuid(), date: '2023-12-01', amount: 100, note: "December" }
    ] 
  },
  { id: 18, name: "Student Farid", phone: "716-238-8490", committedAmount: 1000, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 19, name: "Abdulmuqeet M Chowdhury", phone: "716-444-9038", committedAmount: 600, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 20, name: "Mohd Hassan", phone: "917-345-7902", committedAmount: 4000, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 21, name: "Zubair Ali", phone: "917-302-6966", committedAmount: 3000, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 22, name: "Nizam Bhai", phone: "", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 23, name: "Raja Bhai", phone: "646-269-9199", committedAmount: 2399, frequency: PaymentFrequency.YEARLY, payments: [] },
  { 
    id: 24, 
    name: "Habib Rahman", 
    phone: "", 
    committedAmount: 3000, 
    frequency: PaymentFrequency.YEARLY, 
    payments: [
      { id: uuid(), date: '2023-11-14', amount: 500, note: "Paid - Zubair" }
    ] 
  },
  { id: 25, name: "Rashidullah Bhai", phone: "424-393-6629", committedAmount: 500, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 26, name: "Abdullah Siddiqui", phone: "", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 27, name: "Jamal Fiji", phone: "", committedAmount: 1000, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 28, name: "Khalid Father", phone: "", committedAmount: 600, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 29, name: "Mahfuz Bhai", phone: "718-290-6538", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 30, name: "Ta if", phone: "917-756-0195", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 31, name: "M Shawkat Ali", phone: "716-322-8300", committedAmount: 1200, frequency: PaymentFrequency.YEARLY, payments: [] },
  { id: 32, name: "Sayedur Rahman Ahliya", phone: "", committedAmount: 500, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 33, name: "Ayyub Bhuiya", phone: "", committedAmount: 600, frequency: PaymentFrequency.ONE_TIME, payments: [] },
  { id: 34, name: "Tarikul Islam", phone: "+1 (347) 282-4557", committedAmount: 600, frequency: PaymentFrequency.MONTHLY, payments: [] },
  { id: 35, name: "Sumon Miah", phone: "", committedAmount: 5000, frequency: PaymentFrequency.YEARLY, payments: [] },
  // Extra entries from prompt
  { id: 36, name: "Maruf bhai Hudson", phone: "(838) 877-0405", committedAmount: 0, frequency: PaymentFrequency.MONTHLY, payments: [], notes: "Do not disclose monthly" },
  { id: 37, name: "Shadat Patan", phone: "(561) 818-5652", committedAmount: 1200, frequency: PaymentFrequency.MONTHLY, payments: [], notes: "Promised $100 monthly" },
];