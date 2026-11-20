import {getScope,updateState,resetState,errorResponse} from "@/lib/store";
import {mutate,assert} from "@/lib/domain";
export async function POST(request:Request){try{const scope=getScope(request);const {action,payload={}}=await request.json() as {action:string;payload?:Record<string,any>};if(action==="reset"){assert(scope.role==="director","Chỉ giám đốc được khôi phục dữ liệu mẫu.");await resetState();return Response.json({ok:true});}const id=await updateState(s=>mutate(s,scope,action,payload));return Response.json({ok:true,id});}catch(e){return errorResponse(e);}}

