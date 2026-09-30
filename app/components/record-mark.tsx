export default function RecordMark({small=false}:{small?:boolean}) {
 return <svg className={small?'record-mark small':'record-mark'} viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="1" y="1" width="38" height="38" rx="12" fill="currentColor"/><path d="M12 11h11l5 5v13H12V11Z" stroke="white" strokeWidth="1.6"/><path d="M22 11v6h6M16 22h8M16 26h5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
