import { env } from 'cloudflare:workers';

type Question = { type:string; stem:string; options?:string[]; answer?:unknown; score:number };
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const exam = await env.DB.prepare(`SELECT id, code, title, questions_json, duration_minutes, starts_at, ends_at, admin_key FROM exams WHERE code = ?`).bind(code.toUpperCase()).first<{ id:number; code:string; title:string; questions_json:string; duration_minutes:number; starts_at:number|null; ends_at:number|null; admin_key:string }>();
  if (!exam) return Response.json({ error: '考试不存在' }, { status: 404 });
  const now = Date.now();
  if (exam.starts_at && now < exam.starts_at) return Response.json({ error: `考试尚未开始，开始时间：${new Date(exam.starts_at).toLocaleString('zh-CN')}` }, { status: 403 });
  if (exam.ends_at && now >= exam.ends_at) return Response.json({ error: `考试已结束，结束时间：${new Date(exam.ends_at).toLocaleString('zh-CN')}` }, { status: 403 });
  const includeAnswers = new URL(request.url).searchParams.get('key') === exam.admin_key;
  const questions = (JSON.parse(exam.questions_json) as Question[]).map((q) => includeAnswers ? q : (({ answer: _answer, ...safe }) => safe)(q));
  return Response.json({ code: exam.code, title: exam.title, duration: exam.duration_minutes, startsAt: exam.starts_at, endsAt: exam.ends_at, questions });
}

export async function DELETE(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const key = new URL(request.url).searchParams.get('key') || '';
  const userId = (await import('@/lib/auth')).currentUser;
  const user = await userId(request);
  const exam = await env.DB.prepare(`SELECT id, owner_id, admin_key FROM exams WHERE code = ?`).bind(code.toUpperCase()).first<{id:number;owner_id:number;admin_key:string}>();
  if (!exam || !user || user.role !== 'admin' || exam.owner_id !== user.id || key !== exam.admin_key) return Response.json({error:'无权删除此考试'},{status:403});
  await env.DB.prepare(`DELETE FROM attempts WHERE exam_id = ?`).bind(exam.id).run();
  await env.DB.prepare(`DELETE FROM exams WHERE id = ?`).bind(exam.id).run();
  return Response.json({deleted:true});
}
