import './globals.css';
import RecordMark from './components/record-mark';
export const metadata = {title:'Patient Held Record',description:'Synthetic record prototype'};
export default function Layout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body><a className="skip-link" href="#content">Skip to content</a><div className="app-shell"><header className="site-header"><a href="/" className="brand"><RecordMark/><span>Patient Held Record<small>A record that stays with you</small></span></a><span className="badge"><span className="status-dot"/>Synthetic demo</span></header><main id="content">{children}</main><footer className="site-footer"><div><strong>Patient Held Record</strong><span>Prototype, not clinical care. Use fictional records only.</span></div><p>A QR is a request, not permission. Record sharing requires explicit patient approval.</p><span className="footer-label">ONLINE-ONLY PROTOTYPE</span></footer></div></body></html>;
}
