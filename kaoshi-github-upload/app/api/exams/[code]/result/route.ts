import { env } from 'cloudflare:workers';
type Question={type:string;answer?:unknown;score:number};
export async function GET(request:Request,context:{params:Promise<{code:string}>}){
  const{code}=await context.params,resultToken=new URL(request.url).searchParams.get('token')||'';
  const row=await env.DB.prepare(`SELECT e.id exam_id,e.questions_json,e.expected_candidates,e.duration_minutes,e.ends_at,a.answers_json,a.score,a.total_score,a.correct_count,a.grading_status,a.submitted_at FROM exams e JOIN attempts a ON a.exam_id=e.id WHERE e.code=? AND a.result_token=?`).bind(code.toUpperCase(),resultToken).first<any>();
  if(!row)return Response.json({error:'成绩凭证无效'},{status:404});
  const count=await env.DB.prepare(`SELECT COUNT(*) total FROM attempts WHERE exam_id=?`).bind(row.exam_id).first<{total:number}>();
  const answersReleased=row.ends_at ? Date.now()>=row.ends_at : Date.now()>=Number(row.submitted_at)+Number(row.duration_minutes)*60000;
  if(!answersReleased)return Response.json({score:row.score,totalScore:row.total_score,correctCount:row.correct_count,gradingStatus:row.grading_status,answersReleased:false,completedCount:count?.total||0,expectedCandidates:row.expected_candidates});
  const questions=JSON.parse(row.questions_json) as Question[],answers=JSON.parse(row.answers_json);const details=questions.map((q:any,i:number)=>{const selected=answers[i]??'';let correct=null;if(q.type==='single')correct=Number(selected)===Number(q.answer);else if(q.type==='multiple')correct=JSON.stringify((Array.isArray(selected)?[...selected].sort():[]))===JSON.stringify((Array.isArray(q.answer)?[...q.answer].sort():[]));else if(q.type==='fill')correct=(q.answer||[]).map((x:string)=>x.trim().toLowerCase().replace(/\s+/g,'')).includes(String(selected).trim().toLowerCase().replace(/\s+/g,''));return{selected,answer:q.type==='case'?null:q.answer,correct,type:q.type}});
  return Response.json({score:row.score,totalScore:row.total_score,correctCount:row.correct_count,gradingStatus:row.grading_status,answersReleased:true,completedCount:count?.total||0,expectedCandidates:row.expected_candidates,details});
}
