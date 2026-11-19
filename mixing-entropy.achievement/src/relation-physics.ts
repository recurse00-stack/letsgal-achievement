import type { RelationData } from './relation-model.ts';
export interface GraphPoint { x:number;y:number;vx:number;vy:number;hx:number;hy:number }
export type GraphPositions = Record<string,GraphPoint>;
export function graphPositions(data:RelationData,previous:GraphPositions={}):GraphPositions {
  return Object.fromEntries(data.nodes.map(n=>[n.id,previous[n.id]?{...previous[n.id]}:{x:n.x,y:n.y,vx:0,vy:0,hx:n.x,hy:n.y}]));
}
/** Bounded spring/repulsion step. Units are graph coordinates, independent of editor zoom. */
export function stepGraph(data:RelationData,points:GraphPositions,held='',dt=1):number {
  const step=Math.max(.25,Math.min(2,dt)),force=new Map(data.nodes.map(n=>[n.id,{x:0,y:0}]));
  for(const n of data.nodes){const p=points[n.id],f=force.get(n.id)!;f.x+=(p.hx-p.x)*.012;f.y+=(p.hy-p.y)*.012;}
  for(const e of data.edges){const a=points[e.from],b=points[e.to];if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy));const home=Math.max(120,Math.hypot(b.hx-a.hx,b.hy-a.hy)),f=(d-home)*.018;force.get(e.from)!.x+=dx/d*f;force.get(e.from)!.y+=dy/d*f;force.get(e.to)!.x-=dx/d*f;force.get(e.to)!.y-=dy/d*f;}
  for(let i=0;i<data.nodes.length;i++)for(let j=i+1;j<data.nodes.length;j++){
    const a=points[data.nodes[i].id],b=points[data.nodes[j].id];let dx=b.x-a.x,dy=b.y-a.y;
    const ox=175-Math.abs(dx),oy=76-Math.abs(dy);if(ox<=0||oy<=0)continue;
    if(Math.abs(dx)+Math.abs(dy)<.01)dy=1;
    const fx=ox<oy?Math.sign(dx||1)*ox*.08:0,fy=ox<oy?0:Math.sign(dy||1)*oy*.08;
    force.get(data.nodes[i].id)!.x-=fx;force.get(data.nodes[j].id)!.x+=fx;force.get(data.nodes[i].id)!.y-=fy;force.get(data.nodes[j].id)!.y+=fy;
  }
  let speed=0;for(const n of data.nodes){const p=points[n.id];if(n.id===held){p.vx=p.vy=0;continue;}const f=force.get(n.id)!;p.vx=Math.max(-24,Math.min(24,(p.vx+f.x*step)*Math.pow(.84,step)));p.vy=Math.max(-24,Math.min(24,(p.vy+f.y*step)*Math.pow(.84,step)));p.x+=p.vx*step;p.y+=p.vy*step;speed=Math.max(speed,Math.abs(p.vx)+Math.abs(p.vy));}return speed;
}
export interface GraphCamera { x:number;y:number;scale:number }
export function fitGraph(points:GraphPositions):GraphCamera {
  const p=Object.values(points);if(!p.length)return {x:500,y:310,scale:1};
  const minX=Math.min(...p.map(v=>v.x))-100,maxX=Math.max(...p.map(v=>v.x))+100,minY=Math.min(...p.map(v=>v.y))-70,maxY=Math.max(...p.map(v=>v.y))+70;
  const scale=Math.min(1.15,900/(maxX-minX),520/(maxY-minY));return {x:500-(minX+maxX)/2*scale,y:310-(minY+maxY)/2*scale,scale};
}
export function zoomGraph(camera:GraphCamera,factor:number,x=500,y=310):GraphCamera{const scale=Math.max(.15,Math.min(2.5,camera.scale*factor)),r=scale/camera.scale;return {x:x-(x-camera.x)*r,y:y-(y-camera.y)*r,scale};}
