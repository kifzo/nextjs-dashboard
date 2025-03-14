'use server';

// TypeScript ファーストの検証ライブラリである Zod を使用して、フォームデータの検証を行います。
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

//FormSchemaという名前で、フォームデータの形式を定義
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
// CreateInvoiceという新しいスキーマを作成しています。これは、FormSchemaからidとdateを除いたものです。つまり、customerId、amount、statusだけを含むスキーマです。
const CreateInvoice = FormSchema.omit({ id: true, date: true });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });
//

export async function createInvoice(formData: FormData) {
  // const rawFormData = {
  // データが正しい形式でない場合、parseメソッドはエラーを投げます。
    const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status') || 'pending',
  });
  // Test it out:
  // console.log("rawFormData", rawFormData);
  // console.log("typeof ", typeof rawFormData.amount);
  const amountInCents = amount * 100;
  // 現在の日付を ISO 形式の文字列として取得し、そのうちの日付部分（YYYY-MM-DD）だけを抽出
  const date = new Date().toISOString().split('T')[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}