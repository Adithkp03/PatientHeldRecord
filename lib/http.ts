import {NextResponse} from 'next/server';
export function json(body:unknown,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'no-store','Pragma':'no-cache'}});}
export async function parseWrite(request:Request){
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json') return {error:'INVALID_REQUEST',status:415} as const;
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin) return {error:'FORBIDDEN',status:403} as const;
 if(Number(request.headers.get('content-length')||0)>2000) return {error:'INVALID_REQUEST',status:413} as const;
 const text=await request.text(); if(text.length>2000) return {error:'INVALID_REQUEST',status:413} as const;
 try{return {value:JSON.parse(text) as unknown};}catch{return {error:'INVALID_REQUEST',status:400} as const;}
}
export function rpcStatus(code:string){return ({FORBIDDEN:403,NOT_APPROVED:403,REVOKED:403,EXPIRED:410,USED:409,INVALID_REQUEST:400,RATE_LIMITED:429} as Record<string,number>)[code]||500;}
