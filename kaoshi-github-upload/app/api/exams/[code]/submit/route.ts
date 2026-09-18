import { env } from 'cloudflare:workers';

type Question={type:'single'|'multiple'|'judge'|'fill'|'short'|'case';stem:string;options?:string[];answer?:number|number[]|string[]|boolean;score:number};
type CandidateAnswer=number|number[]|string;
const normalize=(value:string)=>value.trim().toLocaleLowerCase('zh-CN').replace(/\s+/g,'');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),n=>'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[n%62]).join('');

export async function POST(request:Request,context:{params:Promise<{code:string}>}){
  const{code}=await context.params;const body=await request.json() as{name?:string;organization?:string;answers?:CandidateAnswer[]};
  const name=String(body.name||'').trim().slice(0,40),organization=String(body.organization||'').trim().slice(0,100),answers=Array.isArray(body.answers)?body.answers:[];
  if(!organization||!name)return Response.json({error:'请填写公司名称/部门和姓名'},{status:400});
  const exam=await env.DB.prepare(`SELECT id,title,questions_json,expected_candidates,duration_minutes,starts_at,ends_at FROM exams WHERE code=?`).bind(code.toUpperCase()).first<{id:number;title:string;questions_json:string;expected_candidates:number;duration_minutes:number;starts_at:number|null;ends_at:number|null}>();
  if(!exam)return Response.json({error:'考试不存在'},{status:404});
  const now=Date.now(); if(exam.starts_at&&now<exam.starts_at)return Response.json({error:'考试尚未开始'},{status:403}); if(exam.ends_at&&now>=exam.ends_at)return Response.json({error:'考试已结束，无法提交'},{status:403});
  const questions=JSON.parse(exam.questions_json) as Question[];let autoScore=0,correctCount=0,hasManual=false;
  const details=questions.map((q,index)=>{const selected=answers[index]??'';let correct:boolean|null=null,earned=0;if(q.type==='case'||q.type==='short')hasManual=true;else if(q.type==='judge')correct=(Number(selected)===0)===Boolean(q.answer);else if(q.type==='single')correct=Number(selected)===Number(q.answer);else if(q.type==='multiple'){const a=Array.isArray(selected)?[...selected].map(Number).sort():[],b=Array.isArray(q.answer)?[...q.answer].map(Number).sort():[];correct=JSON.stringify(a)===JSON.stringify(b)}else{const accepted=Array.isArray(q.answer)?q.answer.map(x=>normalize(String(x))):[];correct=accepted.includes(normalize(String(selected)))}if(correct){earned=q.score;autoScore+=q.score;correctCount++}return{selected,answer:q.type==='case'||q.type==='short'?null:q.answer,correct,score:earned,type:q.type,maxScore:q.score}});
  const totalScore=questions.reduce((s,q)=>s+q.score,0),status=hasManual?'pending':'graded',resultToken=token();
  await env.DB.prepare(`INSERT INTO attempts (exam_id,candidate_name,organization,answers_json,score,total_score,correct_count,auto_score,manual_score,grading_status,result_token,submitted_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(exam.id,name,organization,JSON.stringify(answers),autoScore,totalScore,correctCount,autoScore,0,status,resultToken,Date.now()).run();
  const count=await env.DB.prepare(`SELECT COUNT(*) total FROM attempts WHERE exam_id=?`).bind(exam.id).first<{total:number}>();const submittedAt=Date.now();const answersReleased=exam.ends_at ? submittedAt>=exam.ends_at : false;
  return Response.json({title:exam.title,score:autoScore,totalScore,correctCount,questionCount:questions.length,gradingStatus:status,resultToken,answersReleased,completedCount:count?.total||0,expectedCandidates:exam.expected_candidates,details:answersReleased?details:details.map(d=>({...d,answer:null,correct:null}))});
}
