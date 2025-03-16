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
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
// CreateInvoiceという新しいスキーマを作成しています。これは、FormSchemaからidとdateを除いたものです。つまり、customerId、amount、statusだけを含むスキーマです。
const CreateInvoice = FormSchema.omit({ id: true, date: true });

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Zodを使用してフォームを検証する
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // フォームのバリデーションに失敗した場合はエラーを早期に返し、成功した場合は処理を続行します。
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // データベースへの挿入用にデータを準備
  // validatedFields.dataからcustomerId, amount, statusのプロパティを取り出し、各同名の変数に分割代入
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // データベースにデータを挿入
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    // データベースエラーが発生した場合、より具体的なエラーを返します。
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  // 請求書ページのキャッシュを再検証し、ユーザーをリダイレクトします。
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// 更新処理のための関数

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

// 請求書の削除処理

export async function deleteInvoice(id: string) {
  // エラー発生時のテスト処理
  // throw new Error('Failed to Delete Invoice');

  // 到達不可能なコードブロック
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}