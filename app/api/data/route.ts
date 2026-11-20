import {env} from "cloudflare:workers";
import {getScope,readState,errorResponse} from "@/lib/store";
import {project} from "@/lib/domain";
export async function GET(request:Request){try{const scope=getScope(request);const {state,version}=await readState();return Response.json({state:project(state,scope),version,aiReady:!!env.ANTHROPIC_API_KEY},{headers:{"Cache-Control":"no-store"}});}catch(e){return errorResponse(e);}}
