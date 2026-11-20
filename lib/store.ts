import { env } from "cloudflare:workers";
import { seed, type State, type Scope, type Role } from "./domain";
export function getScope(request:Request):Scope {
 const role=(request.headers.get("x-demo-role")||"advisor") as Role;
 if(!["director","manager","advisor","teacher","accountant"].includes(role))throw new Error("Vai trò không hợp lệ.");
 const branch=Number(request.headers.get("x-demo-branch")||1);
 if(!Number.isInteger(branch)||branch<0||branch>3||(role!=="director"&&branch===0))throw new Error("Cơ sở không hợp lệ.");
 return {role,branch,teacherId:request.headers.get("x-demo-teacher")||`GV-${branch}-0`};
}
function db(){if(!env.DB)throw new Error("Chưa kết nối cơ sở dữ liệu D1.");return env.DB;}
export async function readState(){let row=await db().prepare("SELECT payload, version FROM center_state WHERE id = ?").bind("demo").first<{payload:string;version:number}>();if(!row){const data=seed();await db().prepare("INSERT OR IGNORE INTO center_state (id, payload, version) VALUES (?, ?, 1)").bind("demo",JSON.stringify(data)).run();row=await db().prepare("SELECT payload, version FROM center_state WHERE id = ?").bind("demo").first<{payload:string;version:number}>();}return {state:JSON.parse(row!.payload) as State,version:row!.version};}
// Compare-and-swap commits all four modules together and retries conflicts.
export async function updateState<T>(fn:(s:State)=>T){for(let attempt=0;attempt<5;attempt++){const {state,version}=await readState();const result=fn(state);const r=await db().prepare("UPDATE center_state SET payload = ?, version = version + 1 WHERE id = ? AND version = ?").bind(JSON.stringify(state),"demo",version).run();if(r.meta.changes===1)return result;}throw new Error("Dữ liệu vừa thay đổi. Vui lòng thử lại.");}
export async function resetState(){const s=seed();await db().prepare("UPDATE center_state SET payload = ?, version = version + 1 WHERE id = ?").bind(JSON.stringify(s),"demo").run();}
export const errorResponse=(e:unknown,status=400)=>Response.json({error:e instanceof Error?e.message:"Có lỗi xảy ra."},{status});
