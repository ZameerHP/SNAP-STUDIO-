import type {Metadata} from 'next';import './globals.css';import {PublicProvider} from './components/Studio';
export const metadata:Metadata={title:'Super Snap Studio — A feeling. Forever.',description:'Photography, videography, live streaming, and passport photos. Real moments, thoughtfully captured.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><PublicProvider>{children}</PublicProvider></body></html>}
