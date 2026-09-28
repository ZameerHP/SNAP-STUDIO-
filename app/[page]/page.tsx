import Studio from '../components/Studio';import {notFound} from 'next/navigation';
export default async function Page({params}:{params:Promise<{page:string}>}){const{page}=await params;if(!['work','services','about','contact','credits'].includes(page))notFound();return <Studio page={page}/>}
