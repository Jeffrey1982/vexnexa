import {NextRequest,NextResponse} from 'next/server';
const retired=/^\/(?:nl\/|en\/|de\/|fr\/|es\/|pt\/|tl\/)?(?:pricing|dashboard|admin|auth|checkout|settings|scans|sites|teams|audits|free-scan|features|founding-agencies|partner-apply|pilot-partner-program)(?:\/|$)/;
export function proxy(request:NextRequest){
  const path=request.nextUrl.pathname;
  if(path.startsWith('/api/')&&path!=='/api/contact'&&path!=='/api/health')return NextResponse.json({error:'service_retired',support:'https://vexnexa.com/en/support'},{status:410,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  if(retired.test(path)){const locale=path.match(/^\/(nl|en|de|fr|es|pt|tl)\//)?.[1]??'nl';return NextResponse.redirect(new URL(`/${locale}/support`,request.url),308);}
  const oldPublic=path.match(/^\/(contact|privacy|support|studio)$/);if(oldPublic)return NextResponse.redirect(new URL(`/nl/${oldPublic[1]}`,request.url),308);
  return NextResponse.next();
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|studio/).*)']};
