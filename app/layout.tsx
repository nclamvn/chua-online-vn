import type {Metadata} from 'next';
export const metadata:Metadata={title:'Hiên An | Một khoảng yên, cùng nhau',description:'Ghé quần thể chùa Việt 3D, khám phá ngày hội, gieo quẻ và ngồi thiền cùng nhau.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
