// ZzFX - Zuper Zmall Zeound Zynth - Micro Edition
// MIT License - Copyright 2019 Frank Force
const zzfx=(...t)=>zzfxP(zzfxG(...t));const zzfxP=(...t)=>{let e=zzfxX.createBufferSource(),f=zzfxX.createBuffer(t.length,t[0].length,zzfxR);t.map((d,i)=>f.getChannelData(i).set(d)),e.buffer=f,e.connect(zzfxX.destination),e.start();return e};const zzfxG=(q=1,k=.05,c=220,e=0,t=0,m=.1,r=0,F=1,v=0,z=0,w=0,A=0,l=0,B=0,x=0,A2=0,d=0,y=1,m2=0,p=0)=>{let b=2*Math.PI,H=v*=500*b/zzfxR**2,I=(0<x?1:-1)*b/4,D=c*=(1+2*k*Math.random()-k)*b/zzfxR,Z=[],g=0,E=0,a=0,n=1,J=0,K=0,f=0,p2,h;e=99+zzfxR*e,m=zzfxR*m,r=zzfxR*r,t=zzfxR*t,d=zzfxR*d,y=zzfxR*y,m2=zzfxR*m2,p=zzfxR*p,A=zzfxR*A,A2=zzfxR*A2,l=zzfxR*l,B=zzfxR*B;for(let u=0;u<e+m+r+t+d+y+m2+p;u++){if(u==A)g=A2,D*=F;if(u==l)g=B,D*=F;if(a=1,f=g>0?1:-1,p2=Math.sin(E),h=p2>0?1:-1,z)p2=(p2>.5||p2<-.5?1:-1)*h;if(w)p2=p2>0?1:-1;if(u<e)a=u/e;else if(u<e+m)a=1-(u-e)/m*(1-q);else if(u<e+m+r)a=q;else if(u<e+m+r+t)a=q-(u-(e+m+r))/t*q;else if(u<e+m+r+t+d)a=0;else if(u<e+m+r+t+d+y)a=(u-(e+m+r+t+d+y))/m2;else if(u<e+m+r+t+d+y+m2)a=1-(u-(e+m+r+t+d+y))/m2;else if(u<e+m+r+t+d+y+m2+p)a=0;Z[u]=a*p2*Math.cos(I)*n,E+=D,D+=H,n+=J,I+=K;if(u&&!((u+1)%500))H+=z,J+=w,K+=A}return[Z]};const zzfxX=new(window.AudioContext||webkitAudioContext);const zzfxR=44100;

const sfx = {
    jump: () => zzfx(1,0.05,250,0.05,0.1,0.2,1,1.5,0,0,0,0,0,0,0,0,0,0.5),
    dash: () => zzfx(1.2,0.1,100,0.01,0.1,0.3,0,1,0,0,0,0,0,0,1,0,0,0),
    collect: () => zzfx(1,0.05,800,0.01,0.1,0.1,1,2,0,0,0,0,0,0,0,0,0,0.5),
    hit: () => zzfx(1.5,0.2,150,0.05,0.2,0.3,0,1,0,0,0,0,0,0,2,0,0,0),
    stomp: () => zzfx(1.2,0.1,200,0.01,0.1,0.1,1,1.2,0,0,0,0,0,0,1,0,0,0.5),
    portal: () => zzfx(1.5,0.2,400,0.1,0.5,0.5,2,0.5,0,0,0,0,0,0,0,0,0,0)
};
