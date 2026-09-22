
export default function Status({value})
{
    return <span className={`status ${(value||'').toLowerCase()}`}>{value}</span>
}