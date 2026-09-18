import{env}from'cloudflare:workers';
const cookieName='airquality_session';
const encode=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function hashPassword(password:string){const data=new TextEncoder().encode(password);const digest=await crypto.subtle.digest('SHA-256',data);return encode(new Uint8Array(digest))}
export function newToken(){return encode(crypto.getRandomValues(new Uint8Array(24)))}
export function sessionCookie(token:string){return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`}
export function clearCookie(){return `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`}
export async function currentUser(request:Request){const token=request.headers.get('cookie')?.match(new RegExp(`${cookieName}=([^;]+)`))?.[1];if(!token)return null;return env.DB.prepare(`SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?`).bind(token,Date.now()).first<{id:number;email:string;role:string}>()}
