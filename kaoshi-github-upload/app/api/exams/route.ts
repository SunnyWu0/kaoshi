import { env } from 'cloudflare:workers';
import { currentUser } from '@/lib/auth';

type Question = { type: 'single'|'multiple'|'judge'|'fill'|'short'|'case'; stem: string; options?: string[]; answer?: number|number[]|string[]|boolean; score: number };
const random = (length: number) => Array.from(crypto.getRandomValues(new Uint8Array(length)), (n) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n % 32]).join('');

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ count: 0 }, { status: 401 });
  const rows = await env.DB.prepare(`SELECT code, title, admin_key, created_at FROM exams WHERE owner_id = ? ORDER BY created_at DESC`).bind(user.id).all<{code:string;title:string;admin_key:string;created_at:number}>();
  return Response.json({ count: rows.results.length, exams: rows.results.map((e) => ({ code:e.code, title:e.title, adminKey:e.admin_key, createdAt:e.created_at })) });
}

export async function POST(request: Request) {
  const user=await currentUser(request); if(!user)return Response.json({error:'请先登录后再创建考试'},{status:401});
  const form = await request.formData();
  const title = String(form.get('title') || '').trim();
  const questions = JSON.parse(String(form.get('questions') || '[]')) as Question[];
  const duration = Math.max(1, Math.min(240, Number(form.get('duration')) || 30));
  const expectedCandidates = Math.max(1, Math.min(10000, Number(form.get('expectedCandidates')) || 1));
  const startsAt = Number(form.get('startsAt')) || null;
  const endsAt = Number(form.get('endsAt')) || null;
  if (startsAt && endsAt && endsAt <= startsAt) return Response.json({ error: '考试结束时间必须晚于开始时间' }, { status: 400 });
  if (!title || !questions.length || questions.some((q) => !q.stem || !q.type || q.score <= 0 || ((q.type==='single'||q.type==='multiple'||q.type==='judge') && (!q.options || q.options.length < 2)))) {
    return Response.json({ error: '试卷内容不完整' }, { status: 400 });
  }
  const code = random(6);
  const adminKey = random(24);
  const file = form.get('file');
  let sourceFileKey: string | null = null;
  if (file instanceof File && file.size) {
    sourceFileKey = `exams/${code}/${file.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, '_')}`;
    await env.FILES.put(sourceFileKey, file.stream(), { httpMetadata: { contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
  }
  await env.DB.prepare(`INSERT INTO exams (code, admin_key, title, questions_json, duration_minutes, expected_candidates, owner_id, starts_at, ends_at, source_file_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(code, adminKey, title, JSON.stringify(questions), duration, expectedCandidates, user.id, startsAt, endsAt, sourceFileKey, Date.now()).run();
  return Response.json({ code, adminKey });
}
