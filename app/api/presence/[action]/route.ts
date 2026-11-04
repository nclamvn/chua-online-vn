import {env} from 'cloudflare:workers';
import {handlePresence} from '../../../../lib/presence-api';

async function presenceRoute(request:Request,ctx:{params:Promise<{action:string}>}){
 return handlePresence(request,env.DB,(await ctx.params).action);
}

export {presenceRoute as GET,presenceRoute as POST};
