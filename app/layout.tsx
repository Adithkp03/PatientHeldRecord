import './globals.css';
export const metadata = {title:'Patient Held Record',description:'Synthetic record prototype'};
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="en"><body><main><header><a href="/">Patient Held Record</a><span className="badge">Synthetic data only</span></header>{children}<footer>Prototype, not clinical care. QR and clinician sharing are not available in phase 1.</footer></main></body></html>; }
