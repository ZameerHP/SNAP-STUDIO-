import Studio from '../../components/Studio';import {studies} from '../../components/content';import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{slug:string}>}){const{slug}=await params;if(!studies.some(x=>x.slug===slug))notFound();return <Studio page="project" slug={slug}/>}
